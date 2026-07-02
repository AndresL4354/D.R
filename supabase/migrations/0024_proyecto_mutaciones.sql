-- =============================================================================
-- 0024_proyecto_mutaciones.sql — Mutaciones de Proyecto/Servicio (Fase 3).
-- Porta ProyectoServiceImpl con paridad:
--   finalizar → UPDATE persona_proyecto SET estado='FINALIZADO'
--               WHERE id_proyecto=:id AND estado != 'ELIMINADO'  + proyecto.estado
--   activar   → solo proyecto.estado='ACTIVO' (persona_proyecto NO se revierte — quirk fiel)
--   eliminar  → DELETE persona_proyecto + cargos_solicitados_proyectos + proyecto (cascada literal)
--   evaluaciones-remaining → COUNT pp LEFT JOIN evaluacion … WHERE e.id IS NULL
--   cargos    → full-replace (DELETE + reinsert), como guardarCargosProyecto
-- Guards = gating real de la UI (el backend original solo pedía authenticated;
-- aquí lo endurecemos al gating de los botones). Alcance por empresa incluido.
-- =============================================================================

-- --- Policies de escritura alineadas al gating real de la UI ---
drop policy if exists proyecto_insert on public.proyecto;
create policy proyecto_insert on public.proyecto for insert to authenticated
  with check (
    (has_role('ROLE_ADMIN') or has_role('SUPERADMINISTRADOR') or has_role('SUPERADMINISTRADOR BP')
     or has_role('ENCARGADO_RRHH') or has_role('VALIDADOR_RRHH') or has_role('OPERACIONES'))
    and (has_role('ROLE_ADMIN')
         or (auth_empresa() <> '' and upper(coalesce(razon_social_empresa, '')) like '%' || upper(auth_empresa()) || '%'))
  );

drop policy if exists proyecto_update on public.proyecto;
create policy proyecto_update on public.proyecto for update to authenticated
  using (
    has_role('ROLE_ADMIN')
    or ((has_role('ENCARGADO_RRHH') or has_role('VALIDADOR_RRHH') or has_role('OPERACIONES'))
        and auth_empresa() <> ''
        and upper(coalesce(razon_social_empresa, '')) like '%' || upper(auth_empresa()) || '%')
  );

-- --- Evaluaciones pendientes (gate del flujo Finalizar) ---
create or replace function public.proyecto_evaluaciones_pendientes(p_id bigint)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(pp.id)::int
  from public.persona_proyecto pp
  left join public.evaluacion e
    on pp.id_persona = e.id_persona and pp.id_proyecto = e.id_proyecto
  where pp.id_proyecto = p_id and e.id is null
    and (has_role('ROLE_ADMIN') or public.proyecto_visible(p_id));
$$;

grant execute on function public.proyecto_evaluaciones_pendientes(bigint) to authenticated;

-- --- Finalizar (cascada fiel, transaccional) ---
create or replace function public.proyecto_finalizar(p_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (has_role('ROLE_ADMIN') or has_role('SUPERADMINISTRADOR')
          or has_role('SUPERADMINISTRADOR BP') or has_role('OPERACIONES')) then
    raise exception 'permiso denegado para finalizar el servicio';
  end if;
  if not (has_role('ROLE_ADMIN') or public.proyecto_visible(p_id)) then
    raise exception 'servicio fuera del alcance de tu empresa';
  end if;
  update public.persona_proyecto
     set estado = 'FINALIZADO'
   where id_proyecto = p_id and estado != 'ELIMINADO';
  update public.proyecto set estado = 'FINALIZADO' where id = p_id;
end;
$$;

grant execute on function public.proyecto_finalizar(bigint) to authenticated;

-- --- Activar (solo ROLE_ADMIN; sin revertir persona_proyecto — quirk fiel) ---
create or replace function public.proyecto_activar(p_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_role('ROLE_ADMIN') then
    raise exception 'solo ROLE_ADMIN puede activar un servicio';
  end if;
  update public.proyecto set estado = 'ACTIVO' where id = p_id;
end;
$$;

grant execute on function public.proyecto_activar(bigint) to authenticated;

-- --- Eliminar (cascada literal del backend; sin validaciones extra — fiel) ---
create or replace function public.proyecto_eliminar(p_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (has_role('ROLE_ADMIN') or has_role('SUPERADMINISTRADOR') or has_role('SUPERADMINISTRADOR BP')) then
    raise exception 'permiso denegado para eliminar el servicio';
  end if;
  if not (has_role('ROLE_ADMIN') or public.proyecto_visible(p_id)) then
    raise exception 'servicio fuera del alcance de tu empresa';
  end if;
  delete from public.persona_proyecto where id_proyecto = p_id;
  delete from public.cargos_solicitados_proyectos where id_proyecto = p_id;
  delete from public.proyecto where id = p_id;
end;
$$;

grant execute on function public.proyecto_eliminar(bigint) to authenticated;

-- --- Cargos solicitados: lectura + full-replace (guardarCargosProyecto fiel) ---
create or replace function public.cargos_proyecto_listar(p_id bigint)
returns table(id bigint, id_cargo bigint, nombre_cargo text, cantidad int, cantidad_noche int, turnos_efectivos int)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.id_cargo, c.nombre_cargo::text, c.cantidad::int, c.cantidad_noche::int, c.turnos_efectivos::int
  from public.cargos_solicitados_proyectos c
  where c.id_proyecto = p_id
    and (has_role('ROLE_ADMIN') or public.proyecto_visible(p_id));
$$;

grant execute on function public.cargos_proyecto_listar(bigint) to authenticated;

create or replace function public.cargos_proyecto_guardar(p_id bigint, p_cargos jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (has_role('ROLE_ADMIN') or has_role('OPERACIONES')) then
    raise exception 'permiso denegado para guardar cargos del servicio';
  end if;
  if not (has_role('ROLE_ADMIN') or public.proyecto_visible(p_id)) then
    raise exception 'servicio fuera del alcance de tu empresa';
  end if;
  delete from public.cargos_solicitados_proyectos where id_proyecto = p_id;
  insert into public.cargos_solicitados_proyectos
    (id_proyecto, id_cargo, nombre_cargo, cantidad, cantidad_noche, turnos_efectivos)
  select p_id,
         (c ->> 'idCargo')::bigint,
         c ->> 'nombreCargo',
         coalesce((c ->> 'cantidad')::int, 0),
         coalesce((c ->> 'cantidadNoche')::int, 0),
         (c ->> 'turnosEfectivos')::int
  from jsonb_array_elements(coalesce(p_cargos, '[]'::jsonb)) as c;
end;
$$;

grant execute on function public.cargos_proyecto_guardar(bigint, jsonb) to authenticated;
