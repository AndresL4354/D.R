-- =============================================================================
-- 0013_pk_global_reportes.sql — PK defaults globales + RLS Reportes Flash
-- =============================================================================
-- Completa la estrategia de PK: asigna la secuencia compartida como default del
-- `id` en TODA tabla public que aún no tenga default (deja inserts listos en
-- todos los dominios). Excluye perfil (id uuid).
do $$
declare r record;
begin
  for r in
    select c.relname as t
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid and a.attname = 'id' and a.attnum > 0 and not a.attisdropped
    left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
    where n.nspname = 'public' and c.relkind = 'r'
      and d.adbin is null
      and c.relname <> 'perfil'
      and format_type(a.atttypid, a.atttypmod) in ('bigint', 'integer')
  loop
    execute format('alter table public.%I alter column id set default nextval(''public.sequence_generator'');', r.t);
  end loop;
end $$;

-- Reportes Flash (incidentes de seguridad): sin columna clara de empresa operadora
-- (solo empresa_cliente/faena), así que por ahora SOLO admin (evita fuga entre
-- empresas). TODO: scoping por faena->proyecto->empresa cuando se modele el módulo.
drop policy if exists reporte_flash_select on public.reporte_flash;
create policy reporte_flash_select on public.reporte_flash for select to authenticated
  using (public.has_role('ROLE_ADMIN'));
