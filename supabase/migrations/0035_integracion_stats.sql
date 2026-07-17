-- =============================================================================
-- 0035_integracion_stats.sql — Stats agregadas para /integracion/stats/login.
-- Porta LoginStatsDTO (IntegracionResource.statsLogin): personas = COUNT
-- (DISTINCT numero_id) total, personasActivas = ídem con estado 'Activo',
-- servicios = COUNT(proyecto) (activos + finalizados), faenas = COUNT(faena).
-- Solo agregados — no expone datos personales. La llama la Edge Function
-- `integracion` con service_role (server-to-server): se revoca de todos los
-- roles de cliente.
-- =============================================================================
create or replace function public.integracion_stats_login()
returns table(personas bigint, personas_activas bigint, servicios bigint, faenas bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(distinct p.numero_id) from public.persona p),
    (select count(distinct p.numero_id) from public.persona p where p.estado_persona = 'Activo'),
    (select count(*) from public.proyecto),
    (select count(*) from public.faena);
$$;

revoke execute on function public.integracion_stats_login() from public, anon, authenticated;
grant execute on function public.integracion_stats_login() to service_role;
