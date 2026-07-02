-- =============================================================================
-- rls_smoke.sql — Suite pgTAP mínima de RLS/claims (bloqueante para cutover).
-- Se ejecuta con `node scripts/run-pgtap.mjs` (Management API) o psql.
-- Corre en una transacción con ROLLBACK: no toca datos.
-- Los valores esperados se calculan como postgres ANTES de cambiar de rol,
-- para que la suite no se rompa cuando cambien los datos.
-- =============================================================================
begin;

create temp table tap (seq serial, t text);
grant select, insert on tap to authenticated;
grant usage, select on sequence tap_seq_seq to authenticated;

-- Valores esperados (calculados sin RLS, como postgres)
create temp table exp as
select
  (select count(*) from public.persona) as personas_total,
  (select count(*) from public.persona p
    where upper(coalesce(p.empresa, '')) like '%SERVICIOS ALTA%'
      and not exists (select 1 from public.persona_asociada_empresa pae
                      where pae.id_persona = p.id
                        and upper(coalesce(pae.nombre_empresa, '')) like '%GESTA%')
  ) as alta_exclusivas,
  (select count(*) from public.mochila_spdc) as mochilas_total,
  (select count(*) from public.entrega_epp
    where upper(coalesce(razon_social_empresa, '')) = 'SERVICIOS ALTA SPA') as entregas_alta;
grant select on exp to authenticated;

insert into tap(t) select plan(12);

-- (como postgres) hook + policies clave
insert into tap(t) select ok(
  (public.custom_access_token_hook(jsonb_build_object(
     'user_id', (select id from public.perfil where roles @> array['ROLE_ADMIN'] limit 1),
     'claims', '{}'::jsonb)) -> 'claims' ->> 'app_empresa') is not null,
  'el auth hook inyecta app_empresa (fix 0017)');

insert into tap(t) select ok(
  exists (select 1 from pg_policy where polname = 'perfil_select_auth_admin'),
  'existe la policy perfil_select_auth_admin (hook puede leer perfil)');

insert into tap(t) select ok(
  (select relrowsecurity from pg_class where oid = 'public.jhi_user'::regclass)
  and not exists (select 1 from pg_policy where polrelid = 'public.jhi_user'::regclass),
  'jhi_user tiene RLS sin policies (deny-all al front)');

-- Sin claims (sesión sin empresa/roles)
set local role authenticated;
set local request.jwt.claims = '{}';
insert into tap(t) select is((select count(*) from public.persona), 0::bigint,
  'sin claims no ve personas');
insert into tap(t) select is((select count(*) from public.documentos_persona), 0::bigint,
  'sin claims no ve documentos de persona');
insert into tap(t) select is((select coalesce(sum(vencidos + por_vencer), 0)::bigint
  from public.notificaciones_documentos()), 0::bigint,
  'sin claims las campanas dan 0');

-- Usuario GESTA (no admin)
set local request.jwt.claims =
  '{"app_empresa":"GESTA SERVICIOS A LA MINERIA SPA","app_roles":["ENCARGADO_RRHH"]}';
insert into tap(t) select isnt((select count(*) from public.persona), 0::bigint,
  'usuario GESTA ve personas de su empresa');
insert into tap(t) select is(
  (select count(*) from public.persona p
    where upper(coalesce(p.empresa, '')) like '%SERVICIOS ALTA%'
      and not exists (select 1 from public.persona_asociada_empresa pae
                      where pae.id_persona = p.id
                        and upper(coalesce(pae.nombre_empresa, '')) like '%GESTA%')),
  0::bigint,
  'usuario GESTA no ve personas exclusivas de ALTA');

-- Admin GESTA
set local request.jwt.claims =
  '{"app_empresa":"GESTA SERVICIOS A LA MINERIA SPA","app_roles":["ROLE_ADMIN"]}';
insert into tap(t) select is((select count(*) from public.persona),
  (select personas_total from exp),
  'ROLE_ADMIN ve todas las personas');
insert into tap(t) select is((select count(*) from public.mochilas_listado()), 0::bigint,
  'admin GESTA no ve mochilas SPDC (requireAlta fiel)');

-- ALTA
set local request.jwt.claims =
  '{"app_empresa":"SERVICIOS ALTA SPA","app_roles":["ADMIN_VERTICAL"]}';
insert into tap(t) select is((select count(*) from public.mochilas_listado()),
  (select mochilas_total from exp),
  'ADMIN_VERTICAL ALTA ve todas las mochilas');

set local request.jwt.claims =
  '{"app_empresa":"SERVICIOS ALTA SPA","app_roles":["ENCARGADO_BODEGA"]}';
insert into tap(t) select is(
  (select coalesce(max(total), 0)::bigint from public.entregas_listado(null,null,null,null,null,null,null,null,1,0)),
  (select entregas_alta from exp),
  'usuario ALTA ve solo sus entregas EPP');

insert into tap(t) select * from finish();

reset role;
select string_agg(t, E'\n' order by seq) as tap_output from tap;

rollback;
