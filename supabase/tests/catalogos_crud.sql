-- =============================================================================
-- catalogos_crud.sql — pgTAP de las policies de escritura de catálogos (0028).
-- Todo en una transacción con ROLLBACK. Verifica: admin puede crear/editar/
-- eliminar; un rol no autorizado no; y el gating por fila de artículo (SPDC →
-- ADMIN_VERTICAL). Código SQLSTATE 42501 = violación de RLS.
-- =============================================================================
begin;

create temp table tap (seq serial, t text);
grant select, insert on tap to authenticated;
grant usage, select on sequence tap_seq_seq to authenticated;

insert into tap(t) select plan(8);

set local role authenticated;

-- 1) OPERACIONES no puede insertar en tipo_equipo (RLS)
set local request.jwt.claims = '{"app_roles":["OPERACIONES"]}';
insert into tap(t) select throws_ok(
  $$insert into public.tipo_equipo(nombre, tipo) values('PGTAP-TE', 'X')$$,
  '42501', NULL, 'OPERACIONES no puede insertar tipo_equipo');

-- 2) ROLE_ADMIN sí puede crear
set local request.jwt.claims = '{"app_roles":["ROLE_ADMIN"]}';
insert into tap(t) select lives_ok(
  $$insert into public.tipo_equipo(nombre, tipo) values('PGTAP-TE', 'X')$$,
  'ROLE_ADMIN crea tipo_equipo');

-- 3) …y editar
update public.tipo_equipo set tipo = 'UPD' where nombre = 'PGTAP-TE';
insert into tap(t) select is(
  (select tipo from public.tipo_equipo where nombre = 'PGTAP-TE'),
  'UPD', 'ROLE_ADMIN edita tipo_equipo');

-- 4) OPERACIONES no puede eliminar (0 filas por RLS; la fila sigue existiendo)
set local request.jwt.claims = '{"app_roles":["OPERACIONES"]}';
delete from public.tipo_equipo where nombre = 'PGTAP-TE';
set local request.jwt.claims = '{"app_roles":["ROLE_ADMIN"]}';
insert into tap(t) select is(
  (select count(*) from public.tipo_equipo where nombre = 'PGTAP-TE'),
  1::bigint, 'OPERACIONES no elimina (RLS): la fila persiste');

-- 5) ROLE_ADMIN sí elimina
delete from public.tipo_equipo where nombre = 'PGTAP-TE';
insert into tap(t) select is(
  (select count(*) from public.tipo_equipo where nombre = 'PGTAP-TE'),
  0::bigint, 'ROLE_ADMIN elimina tipo_equipo');

-- 6) ADMIN_VERTICAL puede crear un artículo SPDC (gating por fila)
set local request.jwt.claims = '{"app_roles":["ADMIN_VERTICAL"]}';
insert into tap(t) select lives_ok(
  $$insert into public.articulo(descripcion, clasificacion) values('PGTAP-ART-SPDC', 'SPDC')$$,
  'ADMIN_VERTICAL crea artículo SPDC');

-- 7) …pero NO uno no-SPDC (WITH CHECK falla)
insert into tap(t) select throws_ok(
  $$insert into public.articulo(descripcion, clasificacion) values('PGTAP-ART-EPP', 'EPP')$$,
  '42501', NULL, 'ADMIN_VERTICAL no puede crear artículo no-SPDC');

-- 8) ROLE_ADMIN sí crea el no-SPDC
set local request.jwt.claims = '{"app_roles":["ROLE_ADMIN"]}';
insert into tap(t) select lives_ok(
  $$insert into public.articulo(descripcion, clasificacion) values('PGTAP-ART-EPP', 'EPP')$$,
  'ROLE_ADMIN crea artículo no-SPDC');

insert into tap(t) select * from finish();
reset role;
select string_agg(t, E'\n' order by seq) as tap_output from tap;
rollback;
