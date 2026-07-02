-- =============================================================================
-- 0022_reporte_investigacion.sql — Tabla reporte_investigacion (paridad de esquema).
-- La entidad Java ReporteInvestigacion (@Table reporte_investigacion) NO estaba
-- en el backup de prod (dominio dormido: /flash comentado en el webapp y
-- loadAll() de Investigaciones deshabilitado). Se crea desde la entidad para
-- que la vista /investigacion funcione. anexos byte[] → path a Storage (§12).
-- =============================================================================
create table if not exists public.reporte_investigacion (
  id bigint primary key default nextval('public.sequence_generator'),
  estado varchar(255),
  personas_involucradas varchar(255),
  aprendizaje varchar(255),
  anexos varchar(255),
  fecha_creacion timestamp,
  fecha_cierre timestamp,
  usuario_cierre varchar(255),
  reporte_id bigint
);

alter table public.reporte_investigacion enable row level security;

-- Mismo alcance que reporte_flash (dominio seguridad: admin lee/escribe).
drop policy if exists reporte_investigacion_select on public.reporte_investigacion;
create policy reporte_investigacion_select on public.reporte_investigacion
  for select to authenticated using (has_role('ROLE_ADMIN'));

drop policy if exists reporte_investigacion_admin_write on public.reporte_investigacion;
create policy reporte_investigacion_admin_write on public.reporte_investigacion
  for all to authenticated using (has_role('ROLE_ADMIN')) with check (has_role('ROLE_ADMIN'));
