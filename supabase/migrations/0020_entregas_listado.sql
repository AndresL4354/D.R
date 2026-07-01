-- =============================================================================
-- 0020_entregas_listado.sql — RPC del listado de Entregas EPP.
-- Porta EntregaEPPServiceImpl.consultarEntregasFiltro (JPQL dinámico de
-- Constants.java) con sus condiciones EXACTAS:
--   e.id = :id (si > 0)
--   e.persona.numId LIKE '%'+lower(valor)+'%'          (quirk fiel: lower solo en el parámetro)
--   UPPER(e.persona.nombreCompleto) LIKE UPPER('%'+valor+'%')
--   e.usuarioEntrega = :usuarioEntrega
--   e.proyecto.id / e.faena.id (si > 0)
--   e.fechaCreacion >= :fechaInicio / <= :fechaFin
--   ORDER BY e.id DESC (fijo)
-- Alcance por empresa: el backend filtra SIEMPRE e.empresa = account.empresa;
-- aquí admin ve todo y el resto su empresa (razon_social_empresa), coherente
-- con el patrón RLS del resto de RPCs.
-- =============================================================================
create or replace function public.entregas_listado(
  p_id bigint default null,
  p_fecha_inicio timestamp default null,
  p_fecha_fin timestamp default null,
  p_rut text default null,
  p_nombre text default null,
  p_usuario_entrega text default null,
  p_id_faena bigint default null,
  p_id_proyecto bigint default null,
  p_limit int default 20,
  p_offset int default 0
)
returns table(
  id bigint,
  fecha_creacion timestamp,
  usuario_entrega text,
  trabajador text,
  faena text,
  servicio text,
  total bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with filtrada as (
    select e.id, e.fecha_creacion, e.usuario_entrega, e.id_persona, e.id_faena, e.id_proyecto
    from public.entrega_epp e
    left join public.persona pe on pe.id = e.id_persona
    where (has_role('ROLE_ADMIN')
           or (auth_empresa() <> '' and upper(coalesce(e.razon_social_empresa, '')) = upper(auth_empresa())))
      and (p_id is null or p_id <= 0 or e.id = p_id)
      and (p_rut is null or p_rut = '' or pe.numero_id like '%' || lower(p_rut) || '%')
      and (p_nombre is null or p_nombre = ''
           or upper(coalesce(pe.nombre_completo, '')) like upper('%' || p_nombre || '%'))
      and (p_usuario_entrega is null or p_usuario_entrega = '' or e.usuario_entrega = p_usuario_entrega)
      and (p_id_faena    is null or p_id_faena    <= 0 or e.id_faena    = p_id_faena)
      and (p_id_proyecto is null or p_id_proyecto <= 0 or e.id_proyecto = p_id_proyecto)
      and (p_fecha_inicio is null or e.fecha_creacion >= p_fecha_inicio)
      and (p_fecha_fin    is null or e.fecha_creacion <= p_fecha_fin)
  ),
  conteo as (select count(*) c from filtrada)
  select
    f.id,
    f.fecha_creacion,
    f.usuario_entrega,
    pe.nombre_completo as trabajador,
    fa.nombre as faena,
    pr.nombre as servicio,
    (select c from conteo) as total
  from filtrada f
  left join public.persona pe on pe.id = f.id_persona
  left join public.faena fa on fa.id = f.id_faena
  left join public.proyecto pr on pr.id = f.id_proyecto
  order by f.id desc
  limit p_limit offset p_offset;
$$;

grant execute on function public.entregas_listado(bigint, timestamp, timestamp, text, text, text, bigint, bigint, int, int) to authenticated;
