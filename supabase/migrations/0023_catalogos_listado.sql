-- =============================================================================
-- 0023_catalogos_listado.sql — RPCs de catálogos con columnas calculadas.
--
-- faenas_listado: clon de FaenaServiceImpl.findAll/faenasFiltro —
--   Usuarios = string_agg(jhi_user.login) vía faenas_responsables_usuario
--   (columna física id_faenid_usuario, typo real del esquema). jhi_user tiene
--   RLS deny-all al front → SECURITY DEFINER; el endpoint real /api/faenas es
--   accesible a cualquier autenticado, así que el guard es solo authenticated.
--   Filtro por nombre = IGUALDAD EXACTA (quirk fiel de faenasFiltro).
--
-- cargos_listado: clon de CargoResource.getAllCargos/cargoFiltro —
--   Documentos = string_agg(documentos_cargo.nombre); Faenas = string_agg vía
--   faenas_cargo→faena. Quirks fieles: con filtro, LIKE sensible a mayúsculas,
--   SIN ORDER BY y la columna Faenas queda VACÍA (el Resource no la setea).
-- =============================================================================
create or replace function public.faenas_listado(p_nombre text default null)
returns table(
  id bigint,
  nombre text,
  empresa text,
  descripcion text,
  usuarios text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    f.id,
    f.nombre,
    f.empresa,
    f.descripcion,
    (select string_agg(u.login, ',')
     from public.faenas_responsables_usuario p
     join public.jhi_user u on u.id = p.id_faenid_usuario
     where p.id_faena = f.id) as usuarios
  from public.faena f
  where p_nombre is null or f.nombre = p_nombre;
$$;

grant execute on function public.faenas_listado(text) to authenticated;

create or replace function public.cargos_listado(p_nombre text default null)
returns table(
  id bigint,
  nombre text,
  descripcion text,
  documentos text,
  faenas text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.nombre,
    c.descripcion,
    coalesce((select string_agg(dc.nombre, ',') from public.documentos_cargo dc where dc.id_cargo = c.id), '') as documentos,
    case when p_nombre is null then
      coalesce((select string_agg(f.nombre, ',')
                from public.faenas_cargo fc
                join public.faena f on f.id = fc.idfaena
                where fc.idcargo = c.id), '')
    else '' end as faenas
  from public.cargo c
  where p_nombre is null or c.nombre like '%' || p_nombre || '%'
  order by case when p_nombre is null then c.nombre end;
$$;

grant execute on function public.cargos_listado(text) to authenticated;
