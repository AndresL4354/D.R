-- =============================================================================
-- 0021_mochilas_listado.sql — RPCs de Mochilas SPDC e Inspecciones.
-- El listado real resuelve userCreacion.login (join a jhi_user) y las
-- inspecciones anidan entrega→persona/proyecto. jhi_user tiene RLS sin
-- policies (deny-all al front), por eso SECURITY DEFINER con EL MISMO guard
-- que la policy mochila_spdc_alta: es_alta() AND (ROLE_ADMIN | ADMIN_VERTICAL
-- | OPERACIONES) — réplica de requireAlta() del backend.
-- =============================================================================
create or replace function public.mochilas_listado()
returns table(
  id bigint,
  numero text,
  usuario text,
  fecha_creacion timestamp
)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, m.numero::text, u.login::text as usuario, m.fecha_creacion
  from public.mochila_spdc m
  left join public.jhi_user u on u.id = m.id_user_creacion
  where es_alta() and (has_role('ROLE_ADMIN') or has_role('ADMIN_VERTICAL') or has_role('OPERACIONES'));
$$;

grant execute on function public.mochilas_listado() to authenticated;

-- Inspecciones de una mochila — clon de InspeccionMochilaRepository.findByMochilaId:
-- SELECT im FROM InspeccionMochila im WHERE im.mochilaSPDC.id = :idMochila (sin orden).
-- Servicio/Trabajador se resuelven vía entrega_epp (EntregaMapping del mapper).
create or replace function public.inspecciones_mochila(p_id_mochila bigint)
returns table(
  id bigint,
  mantencion boolean,
  servicio text,
  trabajador text,
  usuario_creacion text,
  fecha timestamp
)
language sql
stable
security definer
set search_path = public
as $$
  select
    im.id,
    im.mantencion,
    pr.nombre as servicio,
    pe.nombre_completo as trabajador,
    im.usuario_creacion,
    im.fecha
  from public.inspeccion_mochila im
  left join public.entrega_epp e on e.id = im.id_entrega
  left join public.proyecto pr on pr.id = e.id_proyecto
  left join public.persona pe on pe.id = e.id_persona
  where im.id_mochila = p_id_mochila
    and es_alta() and (has_role('ROLE_ADMIN') or has_role('ADMIN_VERTICAL') or has_role('OPERACIONES'));
$$;

grant execute on function public.inspecciones_mochila(bigint) to authenticated;
