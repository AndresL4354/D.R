-- =============================================================================
-- persona_docs_servicios.sql — pgTAP de las RPCs 0031 (sub-páginas de la ficha).
-- Todo en una transacción con ROLLBACK. Verifica:
--   persona_servicios: excluye ELIMINADO (BACKUP sí aparece), orden pp.id DESC,
--     primera fila actual=true, join a cargo, guard multi-tenant.
--   persona_documentos: join a documento POR NOMBRE, filtro por categoría,
--     variante solo-públicos, enriquecimiento tipo_resultado (primer documento
--     del catálogo por id ASC), guard multi-tenant.
--   persona_documentos_requeridos: catálogo por cargos + solo-públicos.
--   documento_persona_guardar_fecha / _guardar_resultado / _eliminar y
--   documentos_persona_limpiar_huerfanos (gating por rol).
-- =============================================================================
begin;

create temp table tap (seq serial, t text);
grant select, insert on tap to authenticated;
grant usage, select on sequence tap_seq_seq to authenticated;

insert into tap(t) select plan(18);

-- ---- Fixtures (como postgres, antes de bajar a authenticated) ----
insert into public.persona (id, nombre_completo, empresa)
values (990000001, 'PGTAP DOCS PERSONA', 'GESTA SERVICIOS A LA MINERIA SPA'),
       (990000002, 'PGTAP PERSONA OCULTA', 'PGTAP OTRA EMPRESA');

insert into public.proyecto (id, nombre, faena)
values (990000010, 'PGTAP SERVICIO A', 'PGTAP FAENA'),
       (990000011, 'PGTAP SERVICIO B', 'PGTAP FAENA');

insert into public.cargo (id, nombre) values (990000020, 'PGTAP CARGO');

insert into public.persona_proyecto (id, id_persona, id_proyecto, id_cargo, estado, acreditado, nuevo, fecha_creacion)
values (990000030, 990000001, 990000010, 990000020, 'OFICIALIZADA', true, false, '2026-01-10'),
       (990000031, 990000001, 990000011, null, 'ELIMINADO', false, false, '2026-02-10'),
       (990000032, 990000001, 990000011, null, 'BACKUP', false, true, '2026-03-10');

-- Catálogo: 990000042 duplica el NOMBRE de 990000040 en otra categoría (el
-- enriquecimiento tipo_resultado debe tomar el de id MENOR: 'Porcentaje').
insert into public.documento (id, nombre, categoria_documento, privado, tipo_resultado)
values (990000040, 'PGTAP DOC PUB', 'Documentos generales', false, 'Porcentaje'),
       (990000041, 'PGTAP DOC PRIV', 'Documentos generales', true, null),
       (990000042, 'PGTAP DOC PUB', 'Cursos', false, 'Color');

insert into public.documentos_persona (id, id_persona, nombre_documento, fecha_vencimiento)
values (990000050, 990000001, 'PGTAP DOC PUB', '2027-01-01'),
       (990000051, 990000001, 'PGTAP DOC PRIV', '2027-01-01'),
       (990000052, null, 'PGTAP HUERFANO', null);

insert into public.documentos_cargo (id, nombre, id_cargo, requerido)
values (990000060, 'PGTAP DOC PUB', 990000020, true),
       (990000061, 'PGTAP DOC PRIV', 990000020, true);

set local role authenticated;
set local request.jwt.claims = '{"app_roles":["ROLE_ADMIN"]}';

-- 1) persona_servicios excluye ELIMINADO (2 de 3 filas)
insert into tap(t) select is(
  (select count(*) from public.persona_servicios(990000001)),
  2::bigint, 'persona_servicios: excluye ELIMINADO, incluye BACKUP');

-- 2) la primera fila (pp.id DESC = BACKUP) lleva actual=true
insert into tap(t) select is(
  (select s.actual from public.persona_servicios(990000001) s where s.id_proyecto = 990000011),
  true, 'persona_servicios: la última asociación creada es la actual');

-- 3) …y la OFICIALIZADA no; además el LEFT JOIN a cargo resuelve el nombre
insert into tap(t) select is(
  (select s.actual::text || '|' || s.nombre_cargo
     from public.persona_servicios(990000001) s where s.id_proyecto = 990000010),
  'false|PGTAP CARGO', 'persona_servicios: no-actual + nombre de cargo por id_cargo');

-- 4) guard multi-tenant: GESTA sin rol no ve a la persona de otra empresa
set local request.jwt.claims = '{"app_roles":[],"app_empresa":"GESTA SERVICIOS A LA MINERIA SPA"}';
insert into tap(t) select throws_ok(
  $$select * from public.persona_servicios(990000002)$$,
  'persona fuera del alcance de tu empresa',
  'persona_servicios: persona de otra empresa denegada');

-- 5) persona_documentos (con privados): PUB + PRIV en generales
set local request.jwt.claims = '{"app_roles":["ROLE_ADMIN"]}';
insert into tap(t) select is(
  (select count(*) from public.persona_documentos(990000001, 'Documentos generales', false)),
  2::bigint, 'persona_documentos: 2 docs en generales (con privados)');

-- 6) variante solo-públicos excluye el privado
insert into tap(t) select is(
  (select count(*) from public.persona_documentos(990000001, 'Documentos generales', true)),
  1::bigint, 'persona_documentos: solo-públicos excluye el privado');

-- 7) tipo_resultado = el del primer documento del catálogo por nombre (id ASC)
insert into tap(t) select is(
  (select d.tipo_resultado from public.persona_documentos(990000001, 'Documentos generales', false) d
    where d.nombre_documento = 'PGTAP DOC PUB' limit 1),
  'Porcentaje', 'persona_documentos: tipo_resultado del documento con menor id');

-- 8) guard multi-tenant de documentos
set local request.jwt.claims = '{"app_roles":[],"app_empresa":"GESTA SERVICIOS A LA MINERIA SPA"}';
insert into tap(t) select throws_ok(
  $$select * from public.persona_documentos(990000002, 'Documentos generales', true)$$,
  'persona fuera del alcance de tu empresa',
  'persona_documentos: persona de otra empresa denegada');

-- 9) requeridos por cargo: 2 con privados, 1 solo-públicos
set local request.jwt.claims = '{"app_roles":["ROLE_ADMIN"]}';
insert into tap(t) select is(
  (select (select count(*) from public.persona_documentos_requeridos('Documentos generales', array[990000020]::bigint[], false))::text
   || '|' ||
   (select count(*) from public.persona_documentos_requeridos('Documentos generales', array[990000020]::bigint[], true))::text),
  '2|1', 'persona_documentos_requeridos: catálogo por cargo con y sin privados');

-- 10) guardar_fecha actualiza SOLO fecha_vencimiento
select public.documento_persona_guardar_fecha(990000050, '2030-05-05T10:00');
insert into tap(t) select is(
  (select dp.fecha_vencimiento from public.documentos_persona dp where dp.id = 990000050),
  '2030-05-05 10:00:00'::timestamp, 'guardar_fecha: actualiza la fecha');

-- 11) guardar_fecha con id inexistente revienta (NPE→500 fiel)
insert into tap(t) select throws_ok(
  $$select public.documento_persona_guardar_fecha(990099999, '2030-01-01')$$,
  'documento no encontrado',
  'guardar_fecha: id inexistente lanza error');

-- 12) guardar_resultado actualiza; con id inexistente es no-op (executeUpdate)
select public.documento_persona_guardar_resultado(990000050, '88.5');
insert into tap(t) select is(
  (select dp.valor_resultado from public.documentos_persona dp where dp.id = 990000050),
  '88.5', 'guardar_resultado: actualiza valor_resultado');
insert into tap(t) select lives_ok(
  $$select public.documento_persona_guardar_resultado(990099999, 'X')$$,
  'guardar_resultado: id inexistente no-op sin error');

-- 13a) eliminar borra la fila
select public.documento_persona_eliminar(990000051);
insert into tap(t) select is(
  (select count(*) from public.documentos_persona dp where dp.id = 990000051),
  0::bigint, 'eliminar: borra la fila');

-- 13b) con id 0 (placeholder) no revienta (el front original lo dispara igual)
insert into tap(t) select lives_ok(
  $$select public.documento_persona_eliminar(0)$$,
  'eliminar: tolera id 0 sin error');

-- 14) limpiar_huerfanos denegado sin rol
set local request.jwt.claims = '{"app_roles":["OPERACIONES"]}';
insert into tap(t) select throws_ok(
  $$select public.documentos_persona_limpiar_huerfanos()$$,
  'permiso denegado para limpiar documentos huérfanos',
  'limpiar_huerfanos: OPERACIONES denegado');

-- 15) …y permitido para VALIDADOR_RRHH (roles del botón Guardar)
set local request.jwt.claims = '{"app_roles":["VALIDADOR_RRHH"]}';
insert into tap(t) select lives_ok(
  $$select public.documentos_persona_limpiar_huerfanos()$$,
  'limpiar_huerfanos: VALIDADOR_RRHH permitido');

-- 16) …y los huérfanos desaparecieron
set local request.jwt.claims = '{"app_roles":["ROLE_ADMIN"]}';
insert into tap(t) select is(
  (select count(*) from public.documentos_persona dp where dp.id_persona is null and dp.nombre_documento = 'PGTAP HUERFANO'),
  0::bigint, 'limpiar_huerfanos: elimina filas con id_persona NULL');

insert into tap(t) select * from finish();
reset role;
select string_agg(t, E'\n' order by seq) as tap_output from tap;
rollback;
