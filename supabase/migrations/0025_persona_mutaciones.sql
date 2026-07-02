-- =============================================================================
-- 0025_persona_mutaciones.sql — Mutaciones de Persona (Fase 3).
-- Porta con paridad PersonaServiceImpl:
--   persona_cambiar_estado → persona_historico (solo si cambia) + si estado
--     nuevo != 'Activo' y hay filas OFICIALIZADA/PRESELECCIONADA: borra esas
--     filas de persona_proyecto y sus despachos (accion_despacho + trabajador_
--     despacho, cascada manual) + uppercase de campos + estado.
--   persona_guardar_bloqueo → INSERT append-only en bloqueo_persona.
--   persona_verificar_documentos → documentos requeridos del cargo no cargados
--     + documentos de la persona vencidos y requeridos.
--   persona_eliminar → DELETE físico (sin validaciones — fiel).
-- Gating replicado del front (VALIDADOR_RRHH/ENCARGADO_RRHH para estado;
-- ADMIN/SUPER/SUPER BP para eliminar). SECURITY DEFINER + alcance por empresa.
-- Los QR masivos y la notificación por correo son Fase 5 (Resend/SMTP + ZIP).
-- =============================================================================

-- Cambio de estado (núcleo). p_usuario = login/email del actor (auditoría).
create or replace function public.persona_cambiar_estado(p_id bigint, p_estado text, p_usuario text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estado_anterior text;
  v_id_proyecto bigint;
begin
  if not (has_role('VALIDADOR_RRHH') or has_role('ENCARGADO_RRHH') or has_role('ROLE_ADMIN')) then
    raise exception 'permiso denegado para cambiar el estado de la persona';
  end if;
  if not (has_role('ROLE_ADMIN') or public.persona_visible(p_id)) then
    raise exception 'persona fuera del alcance de tu empresa';
  end if;

  select estado_persona into v_estado_anterior from public.persona where id = p_id;
  if v_estado_anterior is null and not exists (select 1 from public.persona where id = p_id) then
    raise exception 'persona no encontrada';
  end if;

  -- Historico solo si el estado realmente cambia (fiel a registrarPersonaHistorico)
  if v_estado_anterior is distinct from p_estado then
    select pp.id_proyecto into v_id_proyecto
      from public.persona_proyecto pp
     where pp.id_persona = p_id and pp.estado in ('OFICIALIZADA', 'PRESELECCIONADA')
     order by pp.id limit 1;

    insert into public.persona_historico
      (id_persona, estado_anterior, estado_nuevo, fecha_creacion, id_proyecto, usuario_creacion)
    values (p_id, v_estado_anterior, p_estado, now(), v_id_proyecto, p_usuario);

    -- Si el nuevo estado NO es 'Activo' y estaba en proyectos → sáquenla y borren despachos.
    if p_estado <> 'Activo' and v_id_proyecto is not null then
      -- despachos de los trabajador_despacho de esta persona en proyectos donde está OFIC/PRESEL
      delete from public.accion_despacho ad
       using public.trabajador_despacho td
       join public.despacho d on d.id = td.id_despacho
       join public.persona_proyecto pp on pp.id_proyecto = d.id_proyecto and pp.id_persona = td.id_persona
       where ad.id_trabajador_despacho = td.id
         and td.id_persona = p_id
         and pp.estado in ('OFICIALIZADA', 'PRESELECCIONADA');

      delete from public.trabajador_despacho td
       using public.despacho d, public.persona_proyecto pp
       where td.id_despacho = d.id
         and pp.id_proyecto = d.id_proyecto and pp.id_persona = td.id_persona
         and td.id_persona = p_id
         and pp.estado in ('OFICIALIZADA', 'PRESELECCIONADA');

      delete from public.persona_proyecto pp
       where pp.id_persona = p_id and pp.estado in ('OFICIALIZADA', 'PRESELECCIONADA');
    end if;
  end if;

  -- Estado + uppercase de campos (toUpperCaseCamposPersona, subconjunto seguro)
  update public.persona
     set estado_persona = p_estado,
         nombre_completo = upper(nombre_completo),
         direccion = upper(direccion)
   where id = p_id;
end;
$$;

grant execute on function public.persona_cambiar_estado(bigint, text, text) to authenticated;

-- Bloqueo / desbloqueo (append-only en bloqueo_persona)
create or replace function public.persona_guardar_bloqueo(
  p_id bigint, p_motivo text, p_descripcion text, p_usuario text, p_estado_bloqueo text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (has_role('VALIDADOR_RRHH') or has_role('ENCARGADO_RRHH') or has_role('ROLE_ADMIN')) then
    raise exception 'permiso denegado para registrar el bloqueo';
  end if;
  if not (has_role('ROLE_ADMIN') or public.persona_visible(p_id)) then
    raise exception 'persona fuera del alcance de tu empresa';
  end if;
  insert into public.bloqueo_persona
    (id_persona, fecha_bloqueo, motivo_bloqueo, descripcio_bloqueo, usuario, estado)
  values (p_id, now(), p_motivo, p_descripcion, p_usuario, p_estado_bloqueo);
end;
$$;

grant execute on function public.persona_guardar_bloqueo(bigint, text, text, text, text) to authenticated;

-- Verificar documentos (gate del cambio a 'Activo'): requeridos del cargo no
-- cargados + documentos de la persona vencidos y requeridos.
create or replace function public.persona_verificar_documentos(p_id bigint, p_ids_cargo bigint[])
returns table(documento text)
language sql
stable
security definer
set search_path = public
as $$
  -- requeridos del cargo que la persona NO tiene cargados
  select distinct dc.nombre::text
  from public.documentos_cargo dc
  where dc.id_cargo = any(p_ids_cargo)
    and coalesce(dc.requerido, false)
    and not exists (
      select 1 from public.documentos_persona dp
      where dp.id_persona = p_id and dp.nombre_documento = dc.nombre
    )
  union
  -- documentos de la persona vencidos
  select distinct dp.nombre_documento::text
  from public.documentos_persona dp
  where dp.id_persona = p_id and coalesce(dp.vencido, false);
$$;

grant execute on function public.persona_verificar_documentos(bigint, bigint[]) to authenticated;

-- Eliminar persona (DELETE físico, sin validaciones — fiel)
create or replace function public.persona_eliminar(p_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (has_role('ROLE_ADMIN') or has_role('SUPERADMINISTRADOR') or has_role('SUPERADMINISTRADOR BP')) then
    raise exception 'permiso denegado para eliminar la persona';
  end if;
  if not (has_role('ROLE_ADMIN') or public.persona_visible(p_id)) then
    raise exception 'persona fuera del alcance de tu empresa';
  end if;
  delete from public.persona where id = p_id;
end;
$$;

grant execute on function public.persona_eliminar(bigint) to authenticated;
