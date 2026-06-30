-- =============================================================================
-- 0005_cron.sql  —  Jobs programados (reemplaza Quartz @Scheduled)  [§12]
-- =============================================================================
-- Reemplaza los 2 @Scheduled de UserService:
--   cron "0 0 0 * * ?"  (medianoche)  y  cron "0 0 1 * * ?"  (01:00)
-- ⚠️ Identificar primero QUÉ hacen exactamente (¿purga de usuarios no activados
-- / tokens?) y replicar la lógica en la Edge Function o en SQL puro.

-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;

-- select cron.schedule('job-medianoche', '0 0 * * *', $$
--   select net.http_post(
--     url     := 'https://<ref>.functions.supabase.co/job-diario',
--     headers := '{"Authorization":"Bearer <service-role>","Content-Type":"application/json"}'::jsonb,
--     body    := '{}'::jsonb
--   );
-- $$);

-- select cron.schedule('job-1am', '0 1 * * *', $$
--   select net.http_post(
--     url     := 'https://<ref>.functions.supabase.co/job-limpieza',
--     headers := '{"Authorization":"Bearer <service-role>","Content-Type":"application/json"}'::jsonb,
--     body    := '{}'::jsonb
--   );
-- $$);
