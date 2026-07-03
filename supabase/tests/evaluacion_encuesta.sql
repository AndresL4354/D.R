-- =============================================================================
-- evaluacion_encuesta.sql — pgTAP de la mutación de Evaluación / encuesta (0030).
-- Transacción con ROLLBACK. Verifica crear (promedio media-simple + respuestas),
-- editar (recalcula promedio, upsert/borra respuestas por id_pregunta), gating,
-- y eliminar. Como respuestas/preguntas son deny-all bajo RLS, se verifica vía
-- las RPC SECURITY DEFINER de lectura. Sujeto: persona SIN evaluación NORMAL
-- previa (para que evaluacion_existente devuelva solo la creada aquí).
-- =============================================================================
begin;

create temp table tap (seq serial, t text);
grant select, insert on tap to authenticated;
grant usage, select on sequence tap_seq_seq to authenticated;

create temp table ev (id bigint);
grant select, insert on ev to authenticated;

create temp table subj as
with per as (
  select p.id as perid from public.persona p
  where not exists (select 1 from public.evaluacion e where e.id_persona = p.id and e.tipo = 'NORMAL')
  order by p.id limit 1
),
pj as (select id as pid from public.proyecto order by id limit 1),
qs as (select array_agg(id order by id) as ids from (select id from public.preguntas where tipo = 'NORMAL' order by id) s)
select per.perid, pj.pid, (qs.ids)[1] as q1, (qs.ids)[2] as q2, (qs.ids)[3] as q3
from per, pj, qs;
grant select on subj to authenticated;

insert into tap(t) select plan(10);

set local role authenticated;

-- 1) Gating: un rol fuera del set de creación no puede crear
set local request.jwt.claims = '{"app_roles":["DESPACHO_SSO"]}';
insert into tap(t) select throws_ok(
  format('select public.evaluacion_guardar(null,%s,%s,%L,null,null,null,null,null,null,%L::jsonb)', s.perid, s.pid, 'NORMAL', '[]'),
  'permiso denegado para crear la evaluación',
  'DESPACHO_SSO no puede crear evaluación') from subj s;

-- Crear como ROLE_ADMIN con 3 respuestas (2,4,6) → promedio 4
set local request.jwt.claims = '{"app_roles":["ROLE_ADMIN"]}';
insert into ev(id)
select public.evaluacion_guardar(
  null, (select perid from subj), (select pid from subj), 'NORMAL',
  null, null, null, null, null, null,
  jsonb_build_array(
    jsonb_build_object('id_pregunta', (select q1 from subj), 'respuesta', '2', 'motivo', ''),
    jsonb_build_object('id_pregunta', (select q2 from subj), 'respuesta', '4', 'motivo', ''),
    jsonb_build_object('id_pregunta', (select q3 from subj), 'respuesta', '6', 'motivo', '')
  )
);

-- 2) promedio de creación = media simple (2+4+6)/3 = 4
insert into tap(t) select is(
  (public.evaluacion_existente((select perid from subj), (select pid from subj), 'NORMAL') ->> 'promedio')::numeric,
  4::numeric, 'crear: promedio = media simple = 4');

-- 3) 3 respuestas guardadas
insert into tap(t) select is(
  jsonb_array_length(public.evaluacion_existente((select perid from subj), (select pid from subj), 'NORMAL') -> 'respuestas'),
  3, 'crear: 3 respuestas');

-- Editar: enviar q1=7, q2=4 (se elimina q3) → promedio (7+4)/2 = 5.5
select public.evaluacion_guardar(
  (select id from ev), (select perid from subj), (select pid from subj), 'NORMAL',
  null, null, null, null, null, null,
  jsonb_build_array(
    jsonb_build_object('id_pregunta', (select q1 from subj), 'respuesta', '7', 'motivo', ''),
    jsonb_build_object('id_pregunta', (select q2 from subj), 'respuesta', '4', 'motivo', '')
  )
);

-- 4) promedio recalculado = 5.5
insert into tap(t) select is(
  (public.evaluacion_existente((select perid from subj), (select pid from subj), 'NORMAL') ->> 'promedio')::numeric,
  5.5::numeric, 'editar: promedio recalculado = 5.5');

-- 5) respuestas ahora 2 (q3 removida)
insert into tap(t) select is(
  jsonb_array_length(public.evaluacion_existente((select perid from subj), (select pid from subj), 'NORMAL') -> 'respuestas'),
  2, 'editar: q3 removida (quedan 2 respuestas)');

-- 6) q1 actualizada a '7'
insert into tap(t) select ok(
  (public.evaluacion_existente((select perid from subj), (select pid from subj), 'NORMAL') -> 'respuestas') @> '[{"respuesta":"7"}]'::jsonb,
  'editar: q1 actualizada a 7');

-- 7) Gating editar: OPERACIONES no puede editar
set local request.jwt.claims = '{"app_roles":["OPERACIONES"]}';
insert into tap(t) select throws_ok(
  format('select public.evaluacion_guardar(%s,%s,%s,%L,null,null,null,null,null,null,%L::jsonb)', (select id from ev), s.perid, s.pid, 'NORMAL', '[]'),
  'permiso denegado para editar la evaluación',
  'OPERACIONES no puede editar evaluación') from subj s;

-- 8) Gating eliminar: OPERACIONES no puede eliminar
insert into tap(t) select throws_ok(
  format('select public.evaluacion_eliminar(%s)', (select id from ev)),
  'permiso denegado para eliminar la evaluación',
  'OPERACIONES no puede eliminar evaluación');

-- 9) Eliminar como ROLE_ADMIN → deja de existir
set local request.jwt.claims = '{"app_roles":["ROLE_ADMIN"]}';
select public.evaluacion_eliminar((select id from ev));
insert into tap(t) select ok(
  public.evaluacion_existente((select perid from subj), (select pid from subj), 'NORMAL') is null,
  'eliminar: la evaluación ya no existe');

-- 10) preguntas_por_tipo('NORMAL') devuelve 3
insert into tap(t) select is(
  (select count(*) from public.preguntas_por_tipo('NORMAL')),
  3::bigint, 'preguntas_por_tipo(NORMAL) = 3');

insert into tap(t) select * from finish();
reset role;
select string_agg(t, E'\n' order by seq) as tap_output from tap;
rollback;
