-- =============================================================================
-- 0004_functions.sql  —  Lógica de negocio: funciones RPC + triggers  [§10]
-- =============================================================================
-- ⚠️ Cada regla debe verificarse 1:1 contra el código Java actual (oráculo)
-- con un test de equivalencia sobre datos reales antes de fijarla.

-- --- Flag `nuevo` (persona) [§10.1] -----------------------------------------
-- "nuevo en general" = registrado hace <180d Y sin despacho en los últimos 180d.
create or replace function public.persona_es_nueva(p_id_persona bigint)
returns boolean
language sql stable
set search_path = ''
as $$
  select
    coalesce(
      (select fecha_creacion from public.persona where id = p_id_persona) > now() - interval '180 days',
      false
    )
    and not exists (
      select 1
      from public.trabajador_despacho td
      join public.despacho d on d.id = td.id_despacho
      where td.id_persona = p_id_persona
        and d.fecha > now() - interval '180 days'
    );
$$;

-- --- Máquina de estados de Despacho + auditoría [§10.2] ---------------------
-- create table if not exists public.auditoria_estado_despacho (
--   id bigint generated always as identity primary key,
--   id_trabajador_despacho bigint not null,
--   estado_anterior text,
--   estado_nuevo text,
--   usuario text,
--   fecha timestamptz not null default now()
-- );

create or replace function public.fn_audita_estado_despacho()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.estado is distinct from old.estado then
    insert into public.auditoria_estado_despacho
      (id_trabajador_despacho, estado_anterior, estado_nuevo, usuario, fecha)
    values (new.id, old.estado, new.estado, auth.jwt()->>'app_empresa', now());
  end if;
  return new;
end;
$$;

-- create trigger trg_audita_estado before update on public.trabajador_despacho
--   for each row execute function public.fn_audita_estado_despacho();
