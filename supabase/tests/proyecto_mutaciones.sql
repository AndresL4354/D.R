-- =============================================================================
-- proyecto_mutaciones.sql — pgTAP de las mutaciones de Proyecto (0024).
-- Todo dentro de una transacción con ROLLBACK: no persiste cambios.
-- Usa un proyecto ACTIVO real como sujeto (elegido dinámicamente).
-- =============================================================================
begin;

create temp table tap (seq serial, t text);
grant select, insert on tap to authenticated;
grant usage, select on sequence tap_seq_seq to authenticated;

-- Sujeto: un proyecto ACTIVO con personas asociadas no eliminadas.
create temp table subj as
select p.id as pid,
       (select count(*) from public.persona_proyecto pp
         where pp.id_proyecto = p.id and pp.estado not in ('ELIMINADO','FINALIZADO')) as activas
from public.proyecto p
where p.estado = 'ACTIVO'
  and exists (select 1 from public.persona_proyecto pp
              where pp.id_proyecto = p.id and pp.estado not in ('ELIMINADO','FINALIZADO'))
order by p.id
limit 1;
grant select on subj to authenticated;

insert into tap(t) select plan(6);

set local role authenticated;

-- 1) Sin permiso no puede finalizar
set local request.jwt.claims =
  '{"app_empresa":"GESTA SERVICIOS A LA MINERIA SPA","app_roles":["ENCARGADO_RRHH"]}';
insert into tap(t) select throws_ok(
  format('select public.proyecto_finalizar(%s)', (select pid from subj)),
  'permiso denegado para finalizar el servicio',
  'ENCARGADO_RRHH no puede finalizar');

-- 2) Activar solo ROLE_ADMIN
set local request.jwt.claims =
  '{"app_empresa":"GESTA SERVICIOS A LA MINERIA SPA","app_roles":["OPERACIONES"]}';
insert into tap(t) select throws_ok(
  format('select public.proyecto_activar(%s)', (select pid from subj)),
  'solo ROLE_ADMIN puede activar un servicio',
  'OPERACIONES no puede activar');

-- 3) Admin finaliza → proyecto FINALIZADO
set local request.jwt.claims = '{"app_roles":["ROLE_ADMIN"]}';
select public.proyecto_finalizar((select pid from subj));
insert into tap(t) select is(
  (select estado from public.proyecto where id = (select pid from subj)),
  'FINALIZADO', 'admin finaliza: proyecto queda FINALIZADO');

-- 4) …y arrastra persona_proyecto no-eliminadas a FINALIZADO
insert into tap(t) select is(
  (select count(*) from public.persona_proyecto
    where id_proyecto = (select pid from subj) and estado not in ('ELIMINADO','FINALIZADO')),
  0::bigint, 'finalizar arrastra persona_proyecto a FINALIZADO');

-- 5) Activar NO revierte persona_proyecto (quirk fiel)
select public.proyecto_activar((select pid from subj));
insert into tap(t) select is(
  (select estado from public.proyecto where id = (select pid from subj)),
  'ACTIVO', 'admin activa: proyecto vuelve a ACTIVO');
insert into tap(t) select is(
  (select count(*) from public.persona_proyecto
    where id_proyecto = (select pid from subj) and estado = 'FINALIZADO')
    >= (select activas from subj),
  true, 'activar NO revierte persona_proyecto (siguen FINALIZADO)');

insert into tap(t) select * from finish();
reset role;
select string_agg(t, E'\n' order by seq) as tap_output from tap;
rollback;
