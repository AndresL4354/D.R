-- =============================================================================
-- asociacion_mutaciones.sql — pgTAP de las mutaciones de asociación (0026).
-- Todo dentro de una transacción con ROLLBACK: no persiste cambios.
-- Crea una asociación sintética (persona Activa no asociada + proyecto ACTIVO)
-- y recorre todo el ciclo de vida: asignar → oficializar → toggle → acreditar
-- → gestión temprana → cambiar cargo → backup → reasociar → eliminar, más los
-- guards de rol. Actúa como ROLE_ADMIN para evitar el alcance por empresa.
-- =============================================================================
begin;

create temp table tap (seq serial, t text);
grant select, insert on tap to authenticated;
grant usage, select on sequence tap_seq_seq to authenticated;

-- Sujeto: proyecto ACTIVO + persona Activa NO asociada a él, NO oficializada en
-- ningún lado y sin trabajador_despacho en ese proyecto (para no gatear eliminar).
create temp table subj as
with pj as (
  select id as pid from public.proyecto where estado = 'ACTIVO' order by id limit 1
),
per as (
  select p.id as perid
  from public.persona p, pj
  where p.estado_persona = 'Activo'
    and not exists (select 1 from public.persona_proyecto pp where pp.id_persona = p.id and pp.id_proyecto = pj.pid)
    and not exists (select 1 from public.persona_proyecto pp where pp.id_persona = p.id and pp.estado = 'OFICIALIZADA')
    and not exists (select 1 from public.trabajador_despacho td join public.despacho d on d.id = td.id_despacho
                    where td.id_persona = p.id and d.id_proyecto = pj.pid)
  order by p.id limit 1
),
cg as (select array_agg(id order by id) as ids from (select id from public.cargo order by id limit 2) s)
select pj.pid, per.perid, (cg.ids)[1] as cargo1, (cg.ids)[2] as cargo2,
       not exists (select 1 from public.trabajador_despacho where id_persona = per.perid) as expnuevo
from pj, per, cg;
grant select on subj to authenticated;

insert into tap(t) select plan(18);

set local role authenticated;

-- 1) Gating: un rol fuera del set no puede asociar
set local request.jwt.claims = '{"app_roles":["OBSERVADOR_RRHH"]}';
insert into tap(t) select throws_ok(
  format('select public.asociar_persona_proyecto(%s,%s,%s,%L,%L)', s.perid, s.pid, s.cargo1, 'CARGO X', 'tester'),
  'permiso denegado para asociar la persona',
  'OBSERVADOR_RRHH no puede asociar') from subj s;

set local request.jwt.claims = '{"app_roles":["ROLE_ADMIN"]}';

-- 2) Asociar crea fila PRESELECCIONADA
select public.asociar_persona_proyecto((select perid from subj), (select pid from subj), (select cargo1 from subj), 'CARGO X', 'tester');
insert into tap(t) select is(
  (select estado from public.persona_proyecto where id_persona = (select perid from subj) and id_proyecto = (select pid from subj)),
  'PRESELECCIONADA', 'asociar deja estado PRESELECCIONADA');

-- 3) …y calcula el flag nuevo (sin trabajador_despacho previo)
insert into tap(t) select is(
  (select nuevo from public.persona_proyecto where id_persona = (select perid from subj) and id_proyecto = (select pid from subj)),
  (select expnuevo from subj), 'asociar calcula nuevo correctamente');

-- 4) Asociar de nuevo → 409 lógico
insert into tap(t) select throws_ok(
  format('select public.asociar_persona_proyecto(%s,%s,%s,%L,%L)', s.perid, s.pid, s.cargo1, 'CARGO X', 'tester'),
  'La persona ya se encuentra asociada al proyecto.',
  'no permite asociar duplicado') from subj s;

-- 5) Oficializar sin bloqueados devuelve cadena vacía
insert into tap(t) select is(
  public.oficializar_nomina((select pid from subj), array[(select perid from subj)]::bigint[]),
  '', 'oficializar sin bloqueados devuelve vacio');

-- 6) …y la fila queda OFICIALIZADA
insert into tap(t) select is(
  (select estado from public.persona_proyecto where id_persona = (select perid from subj) and id_proyecto = (select pid from subj)),
  'OFICIALIZADA', 'oficializar deja estado OFICIALIZADA');

-- 7) Toggle condicional OFICIALIZADA→PRESELECCIONADA devuelve OK
insert into tap(t) select is(
  public.cambiar_estado_asociado((select perid from subj), (select pid from subj), 'PRESELECCIONADA', 'OFICIALIZADA'),
  'OK', 'cambiar_estado (toggle) devuelve OK');

-- 8) …y aplica el cambio
insert into tap(t) select is(
  (select estado from public.persona_proyecto where id_persona = (select perid from subj) and id_proyecto = (select pid from subj)),
  'PRESELECCIONADA', 'toggle deja estado PRESELECCIONADA');

-- 9) Acreditar marca acreditado
select public.acreditar_trabajador((select pid from subj), (select perid from subj));
insert into tap(t) select is(
  (select acreditado from public.persona_proyecto where id_persona = (select perid from subj) and id_proyecto = (select pid from subj)),
  true, 'acreditar deja acreditado=true');

-- 10) Acreditar de nuevo → error (no idempotente)
insert into tap(t) select throws_ok(
  format('select public.acreditar_trabajador(%s,%s)', s.pid, s.perid),
  'El trabajador ya esta acreditado.',
  'acreditar dos veces falla') from subj s;

-- 11-12) Gestión temprana: toggle a true y luego a false
insert into tap(t) select is(
  public.gestion_temprana_toggle((select pid from subj), (select perid from subj), 'tester'),
  true, 'gestion_temprana toggle a true');
insert into tap(t) select is(
  public.gestion_temprana_toggle((select pid from subj), (select perid from subj), 'tester'),
  false, 'gestion_temprana toggle a false');

-- 13) Cambiar cargo
select public.cambiar_cargo_asociado((select perid from subj), (select pid from subj), (select cargo2 from subj), 'CARGO Y');
insert into tap(t) select is(
  (select cargo from public.persona_proyecto where id_persona = (select perid from subj) and id_proyecto = (select pid from subj)),
  'CARGO Y', 'cambiar_cargo actualiza el nombre de cargo');

-- 14) Backup exige motivo
insert into tap(t) select throws_ok(
  format('select public.backup_asociado(%s,%s,%L)', s.perid, s.pid, ''),
  'El motivo es obligatorio.',
  'backup sin motivo falla') from subj s;

-- 15) Backup con motivo → BACKUP
select public.backup_asociado((select perid from subj), (select pid from subj), 'sin cupo');
insert into tap(t) select is(
  (select estado from public.persona_proyecto where id_persona = (select perid from subj) and id_proyecto = (select pid from subj)),
  'BACKUP', 'backup deja estado BACKUP');

-- 16) Reasociar → PRESELECCIONADA
select public.reasociar_persona((select perid from subj), (select pid from subj), 'reingreso');
insert into tap(t) select is(
  (select estado from public.persona_proyecto where id_persona = (select perid from subj) and id_proyecto = (select pid from subj)),
  'PRESELECCIONADA', 'reasociar deja estado PRESELECCIONADA');

-- 17) Eliminar (lógico) → ELIMINADO
select public.eliminar_asociado((select perid from subj), (select pid from subj), 'baja');
insert into tap(t) select is(
  (select estado from public.persona_proyecto where id_persona = (select perid from subj) and id_proyecto = (select pid from subj)),
  'ELIMINADO', 'eliminar_asociado deja estado ELIMINADO (borrado logico)');

-- 18) Gating GT: ENCARGADO_RRHH no puede gestionar asistencia temprana
set local request.jwt.claims = '{"app_roles":["ENCARGADO_RRHH"]}';
insert into tap(t) select throws_ok(
  format('select public.gestion_temprana_toggle(%s,%s,%L)', s.pid, s.perid, 'tester'),
  'permiso denegado para gestionar la asistencia temprana',
  'ENCARGADO_RRHH no puede gestion temprana') from subj s;

insert into tap(t) select * from finish();
reset role;
select string_agg(t, E'\n' order by seq) as tap_output from tap;
rollback;
