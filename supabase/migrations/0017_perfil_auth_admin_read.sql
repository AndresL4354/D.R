-- =============================================================================
-- 0017_perfil_auth_admin_read.sql
-- Fix: el Auth Hook custom_access_token_hook corre como `supabase_auth_admin`
-- (que NO hace BYPASSRLS). Las policies existentes de perfil dependen de
-- auth.uid() / has_role(), que durante la emisión del token aún no existen,
-- por lo que el hook leía 0 filas y NO inyectaba app_empresa / app_roles.
-- Solución recomendada por Supabase: policy de solo-lectura para el rol del hook.
-- =============================================================================
drop policy if exists perfil_select_auth_admin on public.perfil;
create policy perfil_select_auth_admin on public.perfil
  as permissive for select to supabase_auth_admin using (true);

grant select on public.perfil to supabase_auth_admin;
