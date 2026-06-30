-- =============================================================================
-- 0019_despachos_listado.sql — Motor de listado de Despachos (Fase 3).
-- Porta VERBATIM DespachoRepository.consultarConteosByDespachoIds +
-- DespachoServiceImpl.poblarConteos (cumplimiento):
--   total        = count(distinct trabajador_despacho)
--   acreditados  = pp.acreditado = true   (acreditado vive en persona_proyecto)
--   asis/sso/bod/cur/tra = accion_despacho aprobada por categoría
--   despachados  = acreditado AND las 5 acciones aprobadas
--   cumplimiento = round((acred+asis+sso+bod+cur+tra) / (total*6) * 100)
-- Filtros: id_faena (proyecto.id_faena), id_proyecto, estado, rango fecha_despacho.
-- SECURITY DEFINER + proyecto_visible() para alcance por empresa.
-- =============================================================================
create or replace function public.despachos_listado(
  p_id_faena    bigint default null,
  p_id_proyecto bigint default null,
  p_estado      text   default null,
  p_fecha_inicio timestamp default null,
  p_fecha_fin    timestamp default null,
  p_limit       int    default 20,
  p_offset      int    default 0
)
returns table(
  id bigint,
  proyecto_nombre text,
  faena text,
  nombre_despacho text,
  fecha_despacho timestamp,
  estado text,
  total_personas int,
  acreditados int,
  asistencia int,
  sso int,
  bodega int,
  cursos int,
  transporte int,
  despachados int,
  cumplimiento int,
  total bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with filtrada as (
    select d.id, d.nombre_despacho, d.estado, d.fecha_despacho, d.id_proyecto,
           pr.nombre as proyecto_nombre, pr.faena as faena
    from public.despacho d
    join public.proyecto pr on pr.id = d.id_proyecto
    where (has_role('ROLE_ADMIN') or public.proyecto_visible(d.id_proyecto))
      and (p_id_faena    is null or pr.id_faena   = p_id_faena)
      and (p_id_proyecto is null or d.id_proyecto = p_id_proyecto)
      and (p_estado      is null or d.estado      = p_estado)
      and (p_fecha_inicio is null or d.fecha_despacho >= p_fecha_inicio)
      and (p_fecha_fin    is null or d.fecha_despacho <= p_fecha_fin)
  ),
  conteo as (select count(*) c from filtrada),
  pagina as (
    select * from filtrada
    order by fecha_despacho desc nulls last, id desc
    limit p_limit offset p_offset
  ),
  agg as (
    select d.id as despacho_id,
      count(distinct td.id) as total,
      count(distinct case when pp.acreditado then td.id end) as acred,
      count(distinct case when ad.accion = 'Asistencia' and ad.aprobado then td.id end) as asis,
      count(distinct case when ad.accion = 'SSO'        and ad.aprobado then td.id end) as sso,
      count(distinct case when ad.accion = 'Bodega'     and ad.aprobado then td.id end) as bod,
      count(distinct case when ad.accion = 'Cursos'     and ad.aprobado then td.id end) as cur,
      count(distinct case when ad.accion = 'Transporte' and ad.aprobado then td.id end) as tra,
      count(distinct case when pp.acreditado and (
        select count(distinct ad2.accion) from public.accion_despacho ad2
        where ad2.id_trabajador_despacho = td.id and ad2.aprobado
          and ad2.accion in ('Asistencia','SSO','Bodega','Cursos','Transporte')
      ) = 5 then td.id end) as desp
    from pagina d
    left join public.trabajador_despacho td on td.id_despacho = d.id
    left join public.persona_proyecto pp on pp.id_persona = td.id_persona and pp.id_proyecto = d.id_proyecto
    left join public.accion_despacho ad on ad.id_trabajador_despacho = td.id
    group by d.id
  )
  select
    p.id,
    p.proyecto_nombre,
    p.faena,
    p.nombre_despacho,
    p.fecha_despacho,
    p.estado,
    coalesce(a.total, 0)::int as total_personas,
    coalesce(a.acred, 0)::int as acreditados,
    coalesce(a.asis, 0)::int as asistencia,
    coalesce(a.sso, 0)::int as sso,
    coalesce(a.bod, 0)::int as bodega,
    coalesce(a.cur, 0)::int as cursos,
    coalesce(a.tra, 0)::int as transporte,
    coalesce(a.desp, 0)::int as despachados,
    case when coalesce(a.total, 0) > 0
         then round(((a.acred + a.asis + a.sso + a.bod + a.cur + a.tra)::numeric / (a.total * 6)) * 100)::int
         else 0 end as cumplimiento,
    (select c from conteo) as total
  from pagina p
  left join agg a on a.despacho_id = p.id
  order by p.fecha_despacho desc nulls last, p.id desc;
$$;

grant execute on function public.despachos_listado(bigint, bigint, text, timestamp, timestamp, int, int) to authenticated;
