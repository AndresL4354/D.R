-- =============================================================================
-- 0026_asociacion_mutaciones.sql — Mutaciones de asociación Persona↔Proyecto (Fase 3).
-- Porta con paridad ProyectoServiceImpl (pantalla "Asociar"):
--   asignar            → INSERT persona_proyecto estado='PRESELECCIONADA' (409 si ya existe)
--   oficializar        → UPDATE PRESELECCIONADA→OFICIALIZADA en lote; excluye a quien ya
--                        esté OFICIALIZADA en OTRO proyecto y devuelve sus nombres
--   cambiar_estado     → toggle condicional PRESELECCIONADA<->OFICIALIZADA (método huérfano
--                        en el HTML real; se porta por completitud, devuelve OK/ERROR)
--   backup             → UPDATE estado='BACKUP', motivo (motivo obligatorio)
--   eliminar_asociado  → borrado LÓGICO estado='ELIMINADO', motivo (bloquea si en despacho)
--   reasociar          → UPDATE estado='PRESELECCIONADA', motivo (reingreso desde BACKUP/ELIMINADO)
--   cambiar_cargo      → UPDATE id_cargo + cargo(nombre)
--   acreditar          → UPDATE acreditado=true, fecha_acreditacion=now() (error si ya acreditado)
--   gestion_temprana   → toggle gestion_temprana + fecha/usuario
-- Guards = gating real de la UI (el backend original solo pedía authenticated; aquí lo
-- endurecemos al gating de los botones) + alcance por empresa (proyecto_visible).
-- Todo vía RPC SECURITY DEFINER, por lo que no se requieren policies de tabla nuevas.
-- Los despachos (accion_despacho/trabajador_despacho) NO se tocan aquí: el borrado
-- físico de despachos por cambio de estado de la persona vive en 0025.
-- descargarDocumentos (ZIP) y toggleEstadoPersonal (despacho) quedan fuera (Fase 5 / Fase Despacho).
-- =============================================================================

-- ¿La persona tiene trabajador_despacho en algún despacho de este proyecto?
-- (gate de eliminar_asociado y selector de texto del modal de backup)
create or replace function public.persona_en_despacho(p_id_persona bigint, p_id_proyecto bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.trabajador_despacho td
    join public.despacho d on d.id = td.id_despacho
    where td.id_persona = p_id_persona and d.id_proyecto = p_id_proyecto
  );
$$;

grant execute on function public.persona_en_despacho(bigint, bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- asignar (individual) — INSERT PRESELECCIONADA. nuevo = nunca despachado.
-- ---------------------------------------------------------------------------
create or replace function public.asociar_persona_proyecto(
  p_id_persona bigint, p_id_proyecto bigint, p_id_cargo bigint, p_cargo text, p_usuario text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (has_role('ROLE_ADMIN') or has_role('VALIDADOR_RRHH') or has_role('ENCARGADO_RRHH')
          or has_role('OPERACIONES') or has_role('RRHH')) then
    raise exception 'permiso denegado para asociar la persona';
  end if;
  if not (has_role('ROLE_ADMIN') or public.proyecto_visible(p_id_proyecto)) then
    raise exception 'servicio fuera del alcance de tu empresa';
  end if;
  -- guarda de negocio del front (backstop): persona debe estar Activa
  if not exists (select 1 from public.persona where id = p_id_persona and estado_persona = 'Activo') then
    raise exception 'Esta persona no esta Activa.';
  end if;
  -- guarda 409 del backend: ya existe fila para el par (cualquier estado → usar reasociar)
  if exists (select 1 from public.persona_proyecto where id_persona = p_id_persona and id_proyecto = p_id_proyecto) then
    raise exception 'La persona ya se encuentra asociada al proyecto.';
  end if;
  insert into public.persona_proyecto
    (id_persona, id_proyecto, id_cargo, cargo, estado, fecha_creacion, usuario_creacion, nuevo)
  values
    (p_id_persona, p_id_proyecto, p_id_cargo, p_cargo, 'PRESELECCIONADA', now(), p_usuario,
     not exists (select 1 from public.trabajador_despacho where id_persona = p_id_persona));
end;
$$;

grant execute on function public.asociar_persona_proyecto(bigint, bigint, bigint, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- oficializar (lote) — PRESELECCIONADA→OFICIALIZADA salvo quien ya esté
-- OFICIALIZADA en otro proyecto. Devuelve nombres bloqueados ('' si ninguno).
-- ---------------------------------------------------------------------------
create or replace function public.oficializar_nomina(p_id_proyecto bigint, p_ids_persona bigint[])
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bloqueados text;
begin
  if not (has_role('ROLE_ADMIN') or has_role('SUPERADMINISTRADOR') or has_role('SUPERADMINISTRADOR BP')
          or has_role('OPERACIONES') or has_role('ENCARGADO_RRHH')) then
    raise exception 'permiso denegado para oficializar la nomina';
  end if;
  if not (has_role('ROLE_ADMIN') or public.proyecto_visible(p_id_proyecto)) then
    raise exception 'servicio fuera del alcance de tu empresa';
  end if;

  -- Regla dura: una persona sólo puede estar OFICIALIZADA en UN proyecto.
  select string_agg(distinct p.nombre_completo, ', ')
    into v_bloqueados
  from public.persona_proyecto pp
  join public.persona p on p.id = pp.id_persona
  where pp.id_persona = any(p_ids_persona)
    and pp.estado = 'OFICIALIZADA'
    and pp.id_proyecto <> p_id_proyecto;

  update public.persona_proyecto pp
     set estado = 'OFICIALIZADA'
   where pp.id_proyecto = p_id_proyecto
     and pp.id_persona = any(p_ids_persona)
     and pp.estado = 'PRESELECCIONADA'
     and not exists (
       select 1 from public.persona_proyecto p2
       where p2.id_persona = pp.id_persona
         and p2.estado = 'OFICIALIZADA'
         and p2.id_proyecto <> p_id_proyecto
     );

  return coalesce(v_bloqueados, '');
end;
$$;

grant execute on function public.oficializar_nomina(bigint, bigint[]) to authenticated;

-- ---------------------------------------------------------------------------
-- cambiar estado asociado (toggle condicional) — método huérfano en el HTML
-- real; portado por completitud. UPDATE optimista sobre estado_filtro.
-- ---------------------------------------------------------------------------
create or replace function public.cambiar_estado_asociado(
  p_id_persona bigint, p_id_proyecto bigint, p_estado text, p_estado_filtro text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n int;
begin
  if not (has_role('ROLE_ADMIN') or has_role('SUPERADMINISTRADOR') or has_role('SUPERADMINISTRADOR BP')
          or has_role('OPERACIONES') or has_role('ENCARGADO_RRHH')) then
    raise exception 'permiso denegado para cambiar el estado del asociado';
  end if;
  if not (has_role('ROLE_ADMIN') or public.proyecto_visible(p_id_proyecto)) then
    raise exception 'servicio fuera del alcance de tu empresa';
  end if;
  update public.persona_proyecto
     set estado = p_estado
   where estado = p_estado_filtro
     and id_proyecto = p_id_proyecto
     and id_persona = p_id_persona;
  get diagnostics v_n = row_count;
  return case when v_n > 0 then 'OK' else 'ERROR' end;
end;
$$;

grant execute on function public.cambiar_estado_asociado(bigint, bigint, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- backup / eliminar (lógico) / reasociar — comparten gating y motivo obligatorio.
-- ---------------------------------------------------------------------------
create or replace function public.backup_asociado(p_id_persona bigint, p_id_proyecto bigint, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (has_role('ROLE_ADMIN') or has_role('SUPERADMINISTRADOR') or has_role('SUPERADMINISTRADOR BP')
          or has_role('ENCARGADO_RRHH')) then
    raise exception 'permiso denegado para mover a backUp';
  end if;
  if not (has_role('ROLE_ADMIN') or public.proyecto_visible(p_id_proyecto)) then
    raise exception 'servicio fuera del alcance de tu empresa';
  end if;
  if coalesce(btrim(p_motivo), '') = '' then
    raise exception 'El motivo es obligatorio.';
  end if;
  update public.persona_proyecto
     set estado = 'BACKUP', motivo = p_motivo
   where id_proyecto = p_id_proyecto and id_persona = p_id_persona;
end;
$$;

grant execute on function public.backup_asociado(bigint, bigint, text) to authenticated;

create or replace function public.eliminar_asociado(p_id_persona bigint, p_id_proyecto bigint, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (has_role('ROLE_ADMIN') or has_role('SUPERADMINISTRADOR') or has_role('SUPERADMINISTRADOR BP')
          or has_role('ENCARGADO_RRHH')) then
    raise exception 'permiso denegado para eliminar al asociado';
  end if;
  if not (has_role('ROLE_ADMIN') or public.proyecto_visible(p_id_proyecto)) then
    raise exception 'servicio fuera del alcance de tu empresa';
  end if;
  if coalesce(btrim(p_motivo), '') = '' then
    raise exception 'El motivo es obligatorio.';
  end if;
  -- gate del front: no eliminar si está en un despacho de este servicio
  if public.persona_en_despacho(p_id_persona, p_id_proyecto) then
    raise exception 'Esta persona no se puede eliminar, se encuentra asociada a un despacho en este servicio.';
  end if;
  update public.persona_proyecto
     set estado = 'ELIMINADO', motivo = p_motivo
   where id_proyecto = p_id_proyecto and id_persona = p_id_persona;
end;
$$;

grant execute on function public.eliminar_asociado(bigint, bigint, text) to authenticated;

create or replace function public.reasociar_persona(p_id_persona bigint, p_id_proyecto bigint, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (has_role('ROLE_ADMIN') or has_role('SUPERADMINISTRADOR') or has_role('SUPERADMINISTRADOR BP')
          or has_role('ENCARGADO_RRHH')) then
    raise exception 'permiso denegado para reasociar la persona';
  end if;
  if not (has_role('ROLE_ADMIN') or public.proyecto_visible(p_id_proyecto)) then
    raise exception 'servicio fuera del alcance de tu empresa';
  end if;
  if coalesce(btrim(p_motivo), '') = '' then
    raise exception 'El motivo es obligatorio.';
  end if;
  update public.persona_proyecto
     set estado = 'PRESELECCIONADA', motivo = p_motivo
   where id_proyecto = p_id_proyecto and id_persona = p_id_persona;
end;
$$;

grant execute on function public.reasociar_persona(bigint, bigint, text) to authenticated;

-- ---------------------------------------------------------------------------
-- cambiar cargo — UPDATE id_cargo + cargo(nombre).
-- ---------------------------------------------------------------------------
create or replace function public.cambiar_cargo_asociado(
  p_id_persona bigint, p_id_proyecto bigint, p_id_cargo bigint, p_cargo text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (has_role('ROLE_ADMIN') or has_role('SUPERADMINISTRADOR') or has_role('SUPERADMINISTRADOR BP')
          or has_role('ENCARGADO_RRHH')) then
    raise exception 'permiso denegado para modificar el cargo';
  end if;
  if not (has_role('ROLE_ADMIN') or public.proyecto_visible(p_id_proyecto)) then
    raise exception 'servicio fuera del alcance de tu empresa';
  end if;
  if p_id_persona is null or p_id_proyecto is null then
    raise exception 'ids requeridos';
  end if;
  update public.persona_proyecto
     set id_cargo = p_id_cargo, cargo = p_cargo
   where id_proyecto = p_id_proyecto and id_persona = p_id_persona;
end;
$$;

grant execute on function public.cambiar_cargo_asociado(bigint, bigint, bigint, text) to authenticated;

-- ---------------------------------------------------------------------------
-- acreditar — error si ya acreditado; setea acreditado + fecha_acreditacion.
-- NOTA: persona_proyecto.fecha_acreditacion es 'time without time zone' en el
-- esquema original → now() se castea a hora (quirk fiel, no lo corregimos).
-- ---------------------------------------------------------------------------
create or replace function public.acreditar_trabajador(p_id_proyecto bigint, p_id_persona bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (has_role('ROLE_ADMIN') or has_role('SUPERADMINISTRADOR') or has_role('SUPERADMINISTRADOR BP')
          or has_role('ENCARGADO_ACREDITACION')) then
    raise exception 'permiso denegado para acreditar al trabajador';
  end if;
  if not (has_role('ROLE_ADMIN') or public.proyecto_visible(p_id_proyecto)) then
    raise exception 'servicio fuera del alcance de tu empresa';
  end if;
  if exists (
    select 1 from public.persona_proyecto
    where id_persona = p_id_persona and id_proyecto = p_id_proyecto and coalesce(acreditado, false)
  ) then
    raise exception 'El trabajador ya esta acreditado.';
  end if;
  update public.persona_proyecto
     set acreditado = true, fecha_acreditacion = now()
   where id_persona = p_id_persona and id_proyecto = p_id_proyecto;
end;
$$;

grant execute on function public.acreditar_trabajador(bigint, bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- gestión temprana (toggle) — invierte gestion_temprana + fecha/usuario.
-- Devuelve el nuevo valor del flag.
-- ---------------------------------------------------------------------------
create or replace function public.gestion_temprana_toggle(p_id_proyecto bigint, p_id_persona bigint, p_usuario text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new boolean;
begin
  if not (has_role('ROLE_ADMIN') or has_role('ENCARGADO_ASISTENCIA_GT')) then
    raise exception 'permiso denegado para gestionar la asistencia temprana';
  end if;
  if not (has_role('ROLE_ADMIN') or public.proyecto_visible(p_id_proyecto)) then
    raise exception 'servicio fuera del alcance de tu empresa';
  end if;
  update public.persona_proyecto
     set gestion_temprana = not coalesce(gestion_temprana, false),
         fecha_gestion_temprana = now(),
         usuario_gestion_temprana = p_usuario
   where id_persona = p_id_persona and id_proyecto = p_id_proyecto
  returning gestion_temprana into v_new;
  return coalesce(v_new, false);
end;
$$;

grant execute on function public.gestion_temprana_toggle(bigint, bigint, text) to authenticated;
