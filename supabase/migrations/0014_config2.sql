-- =============================================================================
-- 0014_config2.sql — read de aviso_mantenimiento (catálogo de Configuraciones)
-- =============================================================================
drop policy if exists aviso_mantenimiento_read_auth on public.aviso_mantenimiento;
create policy aviso_mantenimiento_read_auth on public.aviso_mantenimiento for select to authenticated using (true);
