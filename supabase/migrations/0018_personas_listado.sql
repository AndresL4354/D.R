-- =============================================================================
-- 0018_personas_listado.sql — RPC del listado de Personas (clon de personasFiltro).
-- Columnas calculadas igual que el backend:
--   Cargos   = string_agg(cargo.nombre) vía persona_cargo  (PersonaCargoRepository.consultarCargosBatch)
--   Servicio = proyecto.nombre de las asignaciones OFICIALIZADA en persona_proyecto
-- Filtros: rut, nombre, estado, comuna, empresa, id_cargo, id_faena.
-- SECURITY DEFINER + gate `persona_visible(p.id)`: reusa el alcance por empresa
-- (RLS de persona) y deja que los joins de cargo/proyecto lean sin choque de RLS.
-- =============================================================================
create or replace function public.personas_listado(
  p_rut      text   default null,
  p_nombre   text   default null,
  p_estado   text   default null,
  p_comuna   text   default null,
  p_empresa  text   default null,
  p_id_cargo bigint default null,
  p_id_faena bigint default null,
  p_limit    int    default 20,
  p_offset   int    default 0
)
returns table(
  id bigint,
  num_id text,
  nombre_completo text,
  cargos text,
  comuna text,
  telefono text,
  servicio text,
  estado_persona text,
  total bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with filtrada as (
    select p.*
    from public.persona p
    where (has_role('ROLE_ADMIN') or public.persona_visible(p.id))
      and (p_rut     is null or p.numero_id      ilike '%' || p_rut    || '%')
      and (p_nombre  is null or p.nombre_completo ilike '%' || p_nombre || '%')
      and (p_estado  is null or p.estado_persona = p_estado)
      and (p_comuna  is null or p.comuna = p_comuna)
      and (p_empresa is null or p.empresa = p_empresa)
      and (p_id_cargo is null or exists (
            select 1 from public.persona_cargo pc where pc.persona = p.id and pc.cargo = p_id_cargo))
      and (p_id_faena is null or exists (
            select 1 from public.persona_cargo pc
            join public.faenas_cargo fc on fc.idcargo = pc.cargo
            where pc.persona = p.id and fc.idfaena = p_id_faena))
  ),
  conteo as (select count(*) c from filtrada)
  select
    f.id,
    f.numero_id as num_id,
    f.nombre_completo,
    coalesce((
      select string_agg(c.nombre, ', ' order by c.nombre)
      from public.persona_cargo pc
      join public.cargo c on c.id = pc.cargo
      where pc.persona = f.id
    ), '') as cargos,
    f.comuna,
    f.telefono,
    coalesce((
      select string_agg(distinct pr.nombre, ', ')
      from public.persona_proyecto pp
      join public.proyecto pr on pr.id = pp.id_proyecto
      where pp.id_persona = f.id and pp.estado = 'OFICIALIZADA'
    ), '') as servicio,
    f.estado_persona,
    (select c from conteo) as total
  from filtrada f
  order by f.nombre_completo
  limit p_limit offset p_offset;
$$;

grant execute on function public.personas_listado(text, text, text, text, text, bigint, bigint, int, int) to authenticated;

-- Comunas distintas para el selector "Ciudad" (con alcance por empresa).
create or replace function public.persona_comunas()
returns table(comuna text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct p.comuna
  from public.persona p
  where p.comuna is not null and p.comuna <> ''
    and (has_role('ROLE_ADMIN') or public.persona_visible(p.id))
  order by 1;
$$;

grant execute on function public.persona_comunas() to authenticated;
