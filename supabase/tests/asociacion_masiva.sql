-- =============================================================================
-- asociacion_masiva.sql — pgTAP de asociar_personas_proyecto_masivo (0032).
-- Transacción + ROLLBACK. Verifica: gating por rol, resolución RUT normalizado
-- (con puntos/guión y duplicado→id mayor), estados por fila (RUT_NO_ENCONTRADO,
-- PERSONA_NO_ACTIVA, SIN_CARGO, ASOCIADA, YA_ASOCIADA) y efectos en
-- persona_proyecto (PRESELECCIONADA + flag nuevo).
-- =============================================================================
begin;

create temp table tap (seq serial, t text);
grant select, insert on tap to authenticated;
grant usage, select on sequence tap_seq_seq to authenticated;

insert into tap(t) select plan(9);

-- ---- Fixtures ----
insert into public.persona (id, nombre_completo, empresa, estado_persona, numero_id)
values (991000001, 'PGTAP MASIVA ACTIVA', 'GESTA SERVICIOS A LA MINERIA SPA', 'Activo', '11.111.111-1'),
       (991000002, 'PGTAP MASIVA INACTIVA', 'GESTA SERVICIOS A LA MINERIA SPA', 'Reclutamiento', '22222222-2'),
       -- RUT duplicado: debe ganar el id MAYOR
       (991000003, 'PGTAP DUP VIEJA', 'GESTA SERVICIOS A LA MINERIA SPA', 'Activo', '33333333-3'),
       (991000004, 'PGTAP DUP NUEVA', 'GESTA SERVICIOS A LA MINERIA SPA', 'Activo', '33.333.333-3');

insert into public.proyecto (id, nombre, faena, estado)
values (991000010, 'PGTAP SERVICIO MASIVA', 'PGTAP FAENA', 'ACTIVO');

insert into public.cargo (id, nombre) values (991000020, 'PGTAP CARGO MASIVA');

set local role authenticated;

-- 1) sin rol autorizado → denegado
set local request.jwt.claims = '{"app_roles":["REPORTABILIDAD"]}';
insert into tap(t) select throws_ok(
  $$select * from public.asociar_personas_proyecto_masivo(991000010, 'pgtap', '[]'::jsonb)$$,
  'permiso denegado para asociar la persona',
  'masivo: rol no autorizado denegado');

-- 2) lote mixto como admin: ASOCIADA + PERSONA_NO_ACTIVA + RUT_NO_ENCONTRADO + SIN_CARGO
set local request.jwt.claims = '{"app_roles":["ROLE_ADMIN"]}';
create temp table res1 as
select * from public.asociar_personas_proyecto_masivo(991000010, 'pgtap', '[
  {"rut": "11111111-1", "id_cargo": 991000020},
  {"rut": "22.222.222-2", "id_cargo": 991000020},
  {"rut": "99999999-9", "id_cargo": 991000020},
  {"rut": "33333333-3", "id_cargo": null}
]'::jsonb);

insert into tap(t) select is(
  (select r.resultado from res1 r where r.rut = '11111111-1'),
  'ASOCIADA', 'masivo: activa con cargo → ASOCIADA (RUT sin puntos matchea numero_id con puntos)');

insert into tap(t) select is(
  (select r.resultado || '|' || r.detalle from res1 r where r.rut = '22.222.222-2'),
  'PERSONA_NO_ACTIVA|Estado de la persona: Reclutamiento',
  'masivo: no activa → PERSONA_NO_ACTIVA con detalle fiel');

insert into tap(t) select is(
  (select r.resultado from res1 r where r.rut = '99999999-9'),
  'RUT_NO_ENCONTRADO', 'masivo: RUT inexistente → RUT_NO_ENCONTRADO');

insert into tap(t) select is(
  (select r.resultado from res1 r where r.rut = '33333333-3'),
  'SIN_CARGO', 'masivo: sin id_cargo → SIN_CARGO');

-- 3) efecto en persona_proyecto: PRESELECCIONADA con cargo y usuario
insert into tap(t) select is(
  (select pp.estado || '|' || pp.cargo || '|' || pp.usuario_creacion
     from public.persona_proyecto pp
    where pp.id_persona = 991000001 and pp.id_proyecto = 991000010),
  'PRESELECCIONADA|PGTAP CARGO MASIVA|pgtap',
  'masivo: inserta PRESELECCIONADA con nombre de cargo y usuario');

-- 4) repetir la misma fila → YA_ASOCIADA (mensaje del 409 fiel)
create temp table res2 as
select * from public.asociar_personas_proyecto_masivo(991000010, 'pgtap',
  '[{"rut": "11111111-1", "id_cargo": 991000020}]'::jsonb);
insert into tap(t) select is(
  (select r.resultado || '|' || r.detalle from res2 r),
  'YA_ASOCIADA|La persona ya se encuentra asociada al proyecto.',
  'masivo: fila repetida → YA_ASOCIADA con mensaje del guard');

-- 5) RUT duplicado en catálogo → asocia la persona de id MAYOR
create temp table res3 as
select * from public.asociar_personas_proyecto_masivo(991000010, 'pgtap',
  '[{"rut": "33333333-3", "id_cargo": 991000020}]'::jsonb);
insert into tap(t) select is(
  (select r.id_persona from res3 r),
  991000004::bigint, 'masivo: RUT duplicado resuelve al registro más reciente (id mayor)');

-- 6) el lote NO es atómico entre filas: la 991000001 sigue asociada tras el 2º intento
insert into tap(t) select is(
  (select count(*) from public.persona_proyecto pp
    where pp.id_proyecto = 991000010 and pp.id_persona in (991000001, 991000004)),
  2::bigint, 'masivo: filas buenas persisten aunque otras fallen (savepoint por fila)');

insert into tap(t) select * from finish();
reset role;
select string_agg(t, E'\n' order by seq) as tap_output from tap;
rollback;
