-- =============================================================================
-- 0027_despacho_mutaciones.sql — Mutaciones de Despacho (Fase 3).
-- Porta con paridad DespachoServiceImpl:
--   registrar_accion  → upsert accion_despacho (Aprobar/Rechazar/Pendiente) por
--                       (id_trabajador_despacho, accion); si 'En Faena' aprobado,
--                       aprueba en cascada Asistencia/SSO/Bodega/Cursos/Transporte.
--                       Gating por sub-rol DESPACHO_* según la categoría.
--   eliminar_accion   → DELETE físico de la acción (DESPACHO_ADMINISTRADOR/ADMIN).
--   toggle_estado     → edición in-line marcar/desmarcar; guard por EMAIL editor;
--                       upsert (marcar) / delete (desmarcar) + AUDITORÍA por acción.
--   puede_editar_estados_personal → boolean (match por email).
--   finalizar         → UPDATE estado='FINALIZADO' (el trigger 0008 audita estado).
--   eliminar          → cascada accion→trabajador→despacho (ADMIN/SUPER/SUPER BP).
--   eliminar_trabajador → cascada accion→trabajador (rol despacho).
-- Crear/editar despacho y agregar trabajador van por PostgREST (RLS = tiene_rol_despacho).
-- =============================================================================

-- 1) CAMINO A: extender auditoria_estado_despacho para la auditoría por ACCIÓN
--    (el trigger de estado sigue usando estado_anterior/estado_nuevo).
alter table public.auditoria_estado_despacho add column if not exists columna text;
alter table public.auditoria_estado_despacho add column if not exists valor_anterior text;
alter table public.auditoria_estado_despacho add column if not exists valor_nuevo text;
alter table public.auditoria_estado_despacho add column if not exists id_persona bigint;
alter table public.auditoria_estado_despacho add column if not exists rut varchar;
alter table public.auditoria_estado_despacho add column if not exists confirmado boolean;
alter table public.auditoria_estado_despacho alter column id_despacho drop not null;

-- 2) ¿El usuario actual puede gestionar esta acción según su sub-rol DESPACHO_*?
create or replace function public.puede_gestionar_accion(p_accion text)
returns boolean
language sql
stable
set search_path = public
as $$
  select public.has_role('ROLE_ADMIN') or public.has_role('DESPACHO_ADMINISTRADOR') or
    case p_accion
      when 'Asistencia' then public.has_role('DESPACHO_RECEPCION')
      when 'SSO'        then public.has_role('DESPACHO_SSO')
      when 'Bodega'     then public.has_role('DESPACHO_BODEGA')
      when 'Cursos'     then public.has_role('DESPACHO_CURSOS')
      when 'Transporte' then public.has_role('DESPACHO_TRANSPORTE')
      when 'En Faena'   then public.has_role('DESPACHO_ACREDITACION')
      else false
    end;
$$;

grant execute on function public.puede_gestionar_accion(text) to authenticated;

-- 3) ¿El usuario actual es el editor autorizado de estados in-line? (match por email)
create or replace function public.puede_editar_estados_personal()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = lower('marcela.santibanez@gestamineria.cl');
$$;

grant execute on function public.puede_editar_estados_personal() to authenticated;

-- 4) Registrar acción (Aprobar / Rechazar / Pendiente) — upsert por (trabajador, accion).
create or replace function public.despacho_registrar_accion(
  p_id_trabajador_despacho bigint,
  p_accion text,
  p_aprobado boolean,
  p_pendiente boolean,
  p_comentario text,
  p_usuario text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_id bigint;
  v_tipo text;
  v_prev_id bigint;
  v_prev_ap boolean;
begin
  if p_accion not in ('Asistencia', 'SSO', 'Bodega', 'Cursos', 'Transporte', 'En Faena') then
    raise exception 'Acción no válida para edición de estado';
  end if;
  if not public.puede_gestionar_accion(p_accion) then
    raise exception 'permiso denegado para registrar la acción %', p_accion;
  end if;
  if not exists (select 1 from public.trabajador_despacho where id = p_id_trabajador_despacho) then
    raise exception 'Trabajador de despacho no encontrado';
  end if;

  -- Cascada: aprobar 'En Faena' aprueba/crea las 5 acciones previas.
  if p_accion = 'En Faena' and coalesce(p_aprobado, false) then
    foreach v_tipo in array array['Asistencia', 'SSO', 'Bodega', 'Cursos', 'Transporte'] loop
      select id, aprobado into v_prev_id, v_prev_ap
        from public.accion_despacho
       where id_trabajador_despacho = p_id_trabajador_despacho and accion = v_tipo;
      if v_prev_id is null then
        insert into public.accion_despacho
          (id_trabajador_despacho, accion, fecha, aprobado, pendiente, usuario_creacion)
        values (p_id_trabajador_despacho, v_tipo, v_now, true, false, p_usuario);
      elsif not coalesce(v_prev_ap, false) then
        update public.accion_despacho
           set aprobado = true, pendiente = false, fecha_modificacion = v_now, usuario_modificacion = p_usuario
         where id = v_prev_id;
      end if;
    end loop;
  end if;

  select id into v_id
    from public.accion_despacho
   where id_trabajador_despacho = p_id_trabajador_despacho and accion = p_accion;

  if v_id is null then
    insert into public.accion_despacho
      (id_trabajador_despacho, accion, fecha, aprobado, pendiente, comentario, usuario_creacion)
    values (p_id_trabajador_despacho, p_accion, v_now,
            coalesce(p_aprobado, false), coalesce(p_pendiente, false), p_comentario, p_usuario);
  else
    update public.accion_despacho
       set aprobado = coalesce(p_aprobado, false),
           pendiente = coalesce(p_pendiente, false),
           comentario = p_comentario,
           fecha_modificacion = v_now,
           usuario_modificacion = p_usuario
     where id = v_id;
  end if;
end;
$$;

grant execute on function public.despacho_registrar_accion(bigint, text, boolean, boolean, text, text) to authenticated;

-- 5) Eliminar acción (DELETE físico). Gate: DESPACHO_ADMINISTRADOR / ROLE_ADMIN.
create or replace function public.despacho_eliminar_accion(p_id_accion bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.has_role('ROLE_ADMIN') or public.has_role('DESPACHO_ADMINISTRADOR')) then
    raise exception 'permiso denegado para eliminar la acción';
  end if;
  delete from public.accion_despacho where id = p_id_accion;
end;
$$;

grant execute on function public.despacho_eliminar_accion(bigint) to authenticated;

-- 6) Toggle in-line del estado (marcar/desmarcar) — guard por EMAIL + auditoría por acción.
create or replace function public.despacho_toggle_estado(
  p_id_trabajador_despacho bigint,
  p_accion text,
  p_marcar boolean,
  p_confirmado boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_id bigint;
  v_ap boolean;
  v_pe boolean;
  v_id_persona bigint;
  v_id_despacho bigint;
  v_rut varchar;
  v_usuario text;
  v_valor_anterior text;
  v_valor_nuevo text;
begin
  if not public.puede_editar_estados_personal() then
    raise exception 'No tienes permiso para editar los estados del personal';
  end if;
  if p_accion not in ('Asistencia', 'SSO', 'Bodega', 'Cursos', 'Transporte', 'En Faena') then
    raise exception 'Acción no válida para edición de estado';
  end if;

  select id_persona, id_despacho into v_id_persona, v_id_despacho
    from public.trabajador_despacho where id = p_id_trabajador_despacho;
  if not found then
    raise exception 'Trabajador de despacho no encontrado';
  end if;

  v_usuario := coalesce(auth.jwt() ->> 'email', 'desconocido');
  select numero_id into v_rut from public.persona where id = v_id_persona;

  select id, aprobado, pendiente into v_id, v_ap, v_pe
    from public.accion_despacho
   where id_trabajador_despacho = p_id_trabajador_despacho and accion = p_accion;

  v_valor_anterior := case
    when v_id is null then 'sin registro'
    when coalesce(v_pe, false) then 'pendiente'
    when coalesce(v_ap, false) then 'aprobado'
    else 'rechazado'
  end;

  if coalesce(p_marcar, false) then
    if v_id is null then
      insert into public.accion_despacho
        (id_trabajador_despacho, accion, fecha, aprobado, pendiente, usuario_creacion)
      values (p_id_trabajador_despacho, p_accion, v_now, true, false, v_usuario);
    else
      update public.accion_despacho
         set aprobado = true, pendiente = false, fecha_modificacion = v_now, usuario_modificacion = v_usuario
       where id = v_id;
    end if;
    v_valor_nuevo := 'aprobado';
  else
    if v_id is not null then
      delete from public.accion_despacho where id = v_id;
    end if;
    v_valor_nuevo := 'sin registro';
  end if;

  insert into public.auditoria_estado_despacho
    (id_despacho, columna, valor_anterior, valor_nuevo, id_persona, rut, confirmado, usuario, fecha)
  values (v_id_despacho, p_accion, v_valor_anterior, v_valor_nuevo, v_id_persona, v_rut,
          coalesce(p_confirmado, false), v_usuario, v_now);
end;
$$;

grant execute on function public.despacho_toggle_estado(bigint, text, boolean, boolean) to authenticated;

-- 7) Finalizar despacho — el trigger 0008 registra la auditoría de estado.
create or replace function public.despacho_finalizar(p_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.has_role('ROLE_ADMIN') or public.has_role('DESPACHO_ADMINISTRADOR')) then
    raise exception 'permiso denegado para finalizar el despacho';
  end if;
  update public.despacho set estado = 'FINALIZADO' where id = p_id;
  if not found then
    raise exception 'Despacho no encontrado';
  end if;
end;
$$;

grant execute on function public.despacho_finalizar(bigint) to authenticated;

-- 8) Eliminar despacho — cascada accion→trabajador→despacho (ADMIN/SUPER/SUPER BP).
create or replace function public.despacho_eliminar(p_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.has_role('ROLE_ADMIN') or public.has_role('SUPERADMINISTRADOR') or public.has_role('SUPERADMINISTRADOR BP')) then
    raise exception 'permiso denegado para eliminar el despacho';
  end if;
  delete from public.accion_despacho
   where id_trabajador_despacho in (select id from public.trabajador_despacho where id_despacho = p_id);
  delete from public.trabajador_despacho where id_despacho = p_id;
  delete from public.despacho where id = p_id;
end;
$$;

grant execute on function public.despacho_eliminar(bigint) to authenticated;

-- 9) Eliminar trabajador del despacho — cascada accion→trabajador (rol despacho).
create or replace function public.despacho_eliminar_trabajador(p_id_trabajador_despacho bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.tiene_rol_despacho() then
    raise exception 'permiso denegado para eliminar al trabajador del despacho';
  end if;
  delete from public.accion_despacho where id_trabajador_despacho = p_id_trabajador_despacho;
  delete from public.trabajador_despacho where id = p_id_trabajador_despacho;
end;
$$;

grant execute on function public.despacho_eliminar_trabajador(bigint) to authenticated;
