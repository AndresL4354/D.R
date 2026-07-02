-- =============================================================================
-- despacho_mutaciones.sql — pgTAP de las mutaciones de Despacho (0027).
-- Todo dentro de una transacción con ROLLBACK: no persiste cambios.
-- Crea un despacho + 2 trabajadores sintéticos y recorre: registrar acción,
-- cascada 'En Faena', eliminar acción, toggle in-line (email) + auditoría,
-- finalizar (auditoría de estado por trigger) y eliminar con cascada.
-- =============================================================================
begin;

create temp table tap (seq serial, t text);
grant select, insert on tap to authenticated;
grant usage, select on sequence tap_seq_seq to authenticated;

create temp table subj (did bigint, td1 bigint, td2 bigint, perid bigint);

with pj as (select id from public.proyecto order by id limit 1),
     per as (select id from public.persona order by id limit 1),
     d as (
       insert into public.despacho (id_proyecto, nombre_despacho, estado, fecha_despacho)
       select pj.id, 'TEST-DESP-PGTAP', 'ACTIVO', now() from pj returning id
     )
insert into subj (did, perid) select d.id, (select id from per) from d;

with t1 as (insert into public.trabajador_despacho (id_persona, id_despacho)
            select perid, did from subj returning id)
update subj set td1 = (select id from t1);
with t2 as (insert into public.trabajador_despacho (id_persona, id_despacho)
            select perid, did from subj returning id)
update subj set td2 = (select id from t2);

grant select on subj to authenticated;

insert into tap(t) select plan(16);

set local role authenticated;

-- 1) Gating: DESPACHO_SSO no puede registrar 'Bodega'
set local request.jwt.claims = '{"app_roles":["DESPACHO_SSO"]}';
insert into tap(t) select throws_ok(
  format('select public.despacho_registrar_accion(%s,%L,true,false,null,%L)', s.td1, 'Bodega', 'tester'),
  'permiso denegado para registrar la acción Bodega',
  'DESPACHO_SSO no puede registrar Bodega') from subj s;

set local request.jwt.claims = '{"app_roles":["ROLE_ADMIN"]}';

-- 2) Registrar 'Bodega' aprobado
select public.despacho_registrar_accion((select td1 from subj), 'Bodega', true, false, null, 'tester');
insert into tap(t) select is(
  (select aprobado from public.accion_despacho where id_trabajador_despacho = (select td1 from subj) and accion = 'Bodega'),
  true, 'registrar Bodega deja aprobado=true');

-- 3) 'En Faena' aprobado → cascada aprueba las 5 previas
select public.despacho_registrar_accion((select td1 from subj), 'En Faena', true, false, null, 'tester');
insert into tap(t) select is(
  (select count(*) from public.accion_despacho
    where id_trabajador_despacho = (select td1 from subj)
      and accion in ('Asistencia','SSO','Bodega','Cursos','Transporte') and aprobado),
  5::bigint, 'En Faena aprueba en cascada las 5 acciones previas');

-- 4) …y la propia 'En Faena' queda aprobada
insert into tap(t) select is(
  (select aprobado from public.accion_despacho where id_trabajador_despacho = (select td1 from subj) and accion = 'En Faena'),
  true, 'En Faena queda aprobada');

-- 5) Upsert: registrar 'SSO' rechazado actualiza la fila existente
select public.despacho_registrar_accion((select td1 from subj), 'SSO', false, false, 'observacion', 'tester');
insert into tap(t) select is(
  (select aprobado from public.accion_despacho where id_trabajador_despacho = (select td1 from subj) and accion = 'SSO'),
  false, 'registrar SSO rechazado actualiza la fila (aprobado=false)');

-- 6) Eliminar acción (DELETE físico)
select public.despacho_eliminar_accion(
  (select id from public.accion_despacho where id_trabajador_despacho = (select td1 from subj) and accion = 'SSO'));
insert into tap(t) select is(
  (select count(*) from public.accion_despacho where id_trabajador_despacho = (select td1 from subj) and accion = 'SSO'),
  0::bigint, 'eliminar_accion borra la fila');

-- 7) Toggle: un email NO editor no puede
set local request.jwt.claims = '{"email":"otra.persona@gestamineria.cl"}';
insert into tap(t) select throws_ok(
  format('select public.despacho_toggle_estado(%s,%L,true,false)', s.td2, 'Transporte'),
  'No tienes permiso para editar los estados del personal',
  'email no autorizado no puede togglear estado') from subj s;

-- 8-11) Con el email editor: marcar + auditoría, desmarcar + auditoría.
-- (ROLE_ADMIN además del email para que RLS deje LEER las filas al verificar.)
set local request.jwt.claims = '{"app_roles":["ROLE_ADMIN"],"email":"marcela.santibanez@gestamineria.cl"}';
select public.despacho_toggle_estado((select td2 from subj), 'Transporte', true, false);
insert into tap(t) select is(
  (select aprobado from public.accion_despacho where id_trabajador_despacho = (select td2 from subj) and accion = 'Transporte'),
  true, 'toggle marcar crea la accion aprobada');
insert into tap(t) select ok(
  exists (select 1 from public.auditoria_estado_despacho
          where columna = 'Transporte' and valor_nuevo = 'aprobado' and id_persona = (select perid from subj)),
  'toggle marcar registra auditoria (valor_nuevo=aprobado)');

select public.despacho_toggle_estado((select td2 from subj), 'Transporte', false, true);
insert into tap(t) select is(
  (select count(*) from public.accion_despacho where id_trabajador_despacho = (select td2 from subj) and accion = 'Transporte'),
  0::bigint, 'toggle desmarcar borra la accion');
insert into tap(t) select ok(
  exists (select 1 from public.auditoria_estado_despacho
          where columna = 'Transporte' and valor_nuevo = 'sin registro' and id_persona = (select perid from subj)),
  'toggle desmarcar registra auditoria (valor_nuevo=sin registro)');

-- 12) Finalizar: rol sin permiso no puede
set local request.jwt.claims = '{"app_roles":["DESPACHO_SSO"]}';
insert into tap(t) select throws_ok(
  format('select public.despacho_finalizar(%s)', s.did),
  'permiso denegado para finalizar el despacho',
  'DESPACHO_SSO no puede finalizar') from subj s;

-- 13) Finalizar con ROLE_ADMIN → estado FINALIZADO
set local request.jwt.claims = '{"app_roles":["ROLE_ADMIN"]}';
select public.despacho_finalizar((select did from subj));
insert into tap(t) select is(
  (select estado from public.despacho where id = (select did from subj)),
  'FINALIZADO', 'finalizar deja el despacho FINALIZADO');

-- 14) …y el trigger 0008 registra la auditoría de estado
insert into tap(t) select ok(
  exists (select 1 from public.auditoria_estado_despacho where id_despacho = (select did from subj) and estado_nuevo = 'FINALIZADO'),
  'finalizar dispara la auditoria de estado (trigger)');

-- 15) Eliminar: DESPACHO_ADMINISTRADOR no basta
set local request.jwt.claims = '{"app_roles":["DESPACHO_ADMINISTRADOR"]}';
insert into tap(t) select throws_ok(
  format('select public.despacho_eliminar(%s)', s.did),
  'permiso denegado para eliminar el despacho',
  'DESPACHO_ADMINISTRADOR no puede eliminar el despacho') from subj s;

-- 16) Eliminar con ROLE_ADMIN → cascada
set local request.jwt.claims = '{"app_roles":["ROLE_ADMIN"]}';
select public.despacho_eliminar((select did from subj));
insert into tap(t) select is(
  (select count(*) from public.despacho where id = (select did from subj))
    + (select count(*) from public.trabajador_despacho where id_despacho = (select did from subj)),
  0::bigint, 'eliminar despacho borra despacho + trabajadores (cascada)');

insert into tap(t) select * from finish();
reset role;
select string_agg(t, E'\n' order by seq) as tap_output from tap;
rollback;
