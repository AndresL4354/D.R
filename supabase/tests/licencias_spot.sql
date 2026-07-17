-- =============================================================================
-- licencias_spot.sql — pgTAP del dominio Licencias Spot (0033).
-- Transacción + ROLLBACK. Verifica: gating de escritura (3 roles, incl.
-- RECLUTADOR), validaciones del create (RUT obligatorio / persona existe /
-- RUT único), normalización de RUT, estado MEL calculado en vivo con umbral
-- 30 días, orden vigentes-primero (nulls last), ciudad por RUT exacto,
-- update, eliminar y gating del typeahead.
-- =============================================================================
begin;

create temp table tap (seq serial, t text);
grant select, insert on tap to authenticated;
grant usage, select on sequence tap_seq_seq to authenticated;

insert into tap(t) select plan(13);

-- ---- Fixtures ----
insert into public.persona (id, nombre_completo, empresa, estado_persona, numero_id, comuna)
values (992000001, 'PGTAP SPOT UNO', 'GESTA SERVICIOS A LA MINERIA SPA', 'Activo', '44444444-4', 'CALAMA'),
       (992000002, 'PGTAP SPOT DOS', 'GESTA SERVICIOS A LA MINERIA SPA', 'Activo', '55555555-5', 'ANTOFAGASTA');

set local role authenticated;

-- 1) OPERACIONES no puede crear
set local request.jwt.claims = '{"app_roles":["OPERACIONES"]}';
insert into tap(t) select throws_ok(
  $$select public.licencia_spot_guardar(null, '44444444-4', 'PGTAP SPOT UNO', null, null, null, null, null, 'pgtap')$$,
  'No tienes permisos para editar licencias.',
  'licencias: OPERACIONES no puede crear');

-- 2) typeahead también gateado
insert into tap(t) select throws_ok(
  $$select * from public.licencias_spot_buscar_personas('PGTAP')$$,
  'No tienes permisos para editar licencias.',
  'licencias: typeahead gateado a roles de edición');

-- 3) RECLUTADOR (authority nueva) SÍ puede crear — con RUT con puntos → se normaliza
set local request.jwt.claims = '{"app_roles":["RECLUTADOR"]}';
insert into tap(t) select lives_ok(
  $$select public.licencia_spot_guardar(null, '44.444.444-4', 'PGTAP SPOT UNO', 'RIGGER', current_date + 60, null, true, 'obs pgtap', 'pgtap')$$,
  'licencias: RECLUTADOR crea (RUT con puntos)');

insert into tap(t) select is(
  (select l.rut from public.licencia_spot l where l.nombre = 'PGTAP SPOT UNO'),
  '44444444-4', 'licencias: RUT guardado normalizado (sin puntos, con guion)');

-- 4) validaciones del create
insert into tap(t) select throws_ok(
  $$select public.licencia_spot_guardar(null, null, 'X', null, null, null, null, null, 'pgtap')$$,
  'El RUT es obligatorio',
  'licencias: create sin RUT rechazado');

insert into tap(t) select throws_ok(
  $$select public.licencia_spot_guardar(null, '77777777-7', 'NO EXISTE', null, null, null, null, null, 'pgtap')$$,
  'La persona no existe en el sistema',
  'licencias: persona inexistente rechazada');

insert into tap(t) select throws_ok(
  $$select public.licencia_spot_guardar(null, '44444444-4', 'PGTAP SPOT UNO', null, null, null, null, null, 'pgtap')$$,
  'Ya existe una licencia con ese RUT',
  'licencias: RUT duplicado rechazado');

-- 5) estados calculados en vivo (umbral 30 días) + puede_conducir
select public.licencia_spot_guardar(null, '55555555-5', 'PGTAP SPOT DOS', null, current_date + 10, null, false, null, 'pgtap');
insert into tap(t) select is(
  (select l.estado_mel || '|' || l.puede_conducir::text from public.licencias_spot_listar() l where l.nombre = 'PGTAP SPOT DOS'),
  'POR_VENCER|true', 'licencias: <=30 días → POR_VENCER y puede conducir');

insert into tap(t) select is(
  (select l.estado_mel || '|' || l.dias_restantes::text from public.licencias_spot_listar() l where l.nombre = 'PGTAP SPOT UNO'),
  'VIGENTE|60', 'licencias: >30 días → VIGENTE con días restantes');

-- 6) ciudad enriquecida por RUT exacto
insert into tap(t) select is(
  (select l.ciudad from public.licencias_spot_listar() l where l.nombre = 'PGTAP SPOT UNO'),
  'CALAMA', 'licencias: ciudad = comuna de la persona por RUT');

-- 7) orden: más días primero (UNO 60d antes que DOS 10d)
insert into tap(t) select is(
  (select string_agg(x.nombre, '>') from (
     select l.nombre from public.licencias_spot_listar() l
      where l.nombre like 'PGTAP SPOT%' order by l.dias_restantes desc) x),
  'PGTAP SPOT UNO>PGTAP SPOT DOS', 'licencias: vigentes con más días primero');

-- 8) update conserva id y cambia campos (vencida → estado VENCIDA)
select public.licencia_spot_guardar(
  (select l.id from public.licencia_spot l where l.nombre = 'PGTAP SPOT DOS'),
  null, 'PGTAP SPOT DOS', 'MAESTRO', current_date - 5, null, true, null, 'pgtap2');
insert into tap(t) select is(
  (select l.estado_mel || '|' || l.cargo || '|' || l.updated_by from public.licencias_spot_listar() l where l.nombre = 'PGTAP SPOT DOS'),
  'VENCIDA|MAESTRO|pgtap2', 'licencias: update aplica campos y estado recalcula VENCIDA');

-- 9) eliminar
select public.licencia_spot_eliminar((select l.id from public.licencia_spot l where l.nombre = 'PGTAP SPOT DOS'));
insert into tap(t) select is(
  (select count(*) from public.licencia_spot l where l.nombre = 'PGTAP SPOT DOS'),
  0::bigint, 'licencias: eliminar borra el registro');

insert into tap(t) select * from finish();
reset role;
select string_agg(t, E'\n' order by seq) as tap_output from tap;
rollback;
