-- =============================================================================
-- 0016_notificaciones_documentos.sql — RPC para las campanas del navbar.
-- Replica PersonaServiceImpl.consultarCantidadPersonasVencimiento (docnomina):
--   personas en estado ('En Revisión','Activo','Reclutamiento'),
--   documentos con fecha_vencimiento no nula:
--     vencidos   = días hasta vencimiento <= 0
--     por_vencer = días hasta vencimiento entre 1 y 45
-- SECURITY INVOKER (default): el alcance por empresa lo aplica RLS de
-- documentos_persona/persona (persona_visible). Admin ve todo.
-- =============================================================================
create or replace function public.notificaciones_documentos()
returns table(vencidos integer, por_vencer integer)
language sql
stable
set search_path = public
as $$
  select
    count(*) filter (
      where d.fecha_vencimiento::date <= current_date
    )::int as vencidos,
    count(*) filter (
      where d.fecha_vencimiento::date between current_date + 1 and current_date + 45
    )::int as por_vencer
  from public.documentos_persona d
  join public.persona p on p.id = d.id_persona
  where d.fecha_vencimiento is not null
    and p.estado_persona in ('En Revisión', 'Activo', 'Reclutamiento');
$$;

grant execute on function public.notificaciones_documentos() to authenticated;
