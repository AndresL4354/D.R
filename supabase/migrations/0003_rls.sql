-- =============================================================================
-- 0003_rls.sql  —  Autorización por fila (RLS)  [§9]
-- =============================================================================
-- ⚠️ CAMBIO DE MAYOR RIESGO: un error aquí = fuga de datos entre empresas.
-- Toda policy debe acompañarse de tests pgTAP (§9.5) ANTES del cutover.
-- Las policies de abajo son PLANTILLAS de ejemplo (persona, mochila_spdc);
-- el resto se escribe dominio por dominio según el mapa rol→acceso (§9.4).

-- --- Funciones helper (leen los custom claims del JWT) ----------------------
create or replace function public.auth_empresa() returns text
language sql stable
set search_path = ''
as $$
  select coalesce(auth.jwt()->>'app_empresa', '');
$$;

create or replace function public.has_role(r text) returns boolean
language sql stable
set search_path = ''
as $$
  select coalesce(auth.jwt()->'app_roles' ? r, false);
$$;

create or replace function public.es_alta() returns boolean
language sql stable
set search_path = ''
as $$
  select upper(public.auth_empresa()) like '%SERVICIOS ALTA%';
$$;

create or replace function public.es_gesta() returns boolean
language sql stable
set search_path = ''
as $$
  select upper(public.auth_empresa()) like '%GESTA%';
$$;

-- Policy de admin sobre perfil (depende de has_role, definido arriba).
create policy perfil_select_admin on public.perfil
  for select using (public.has_role('ROLE_ADMIN'));

-- --- Ejemplo: persona (multi-tenant; admin ve todo) -------------------------
-- alter table public.persona enable row level security;
--
-- create policy persona_select on public.persona for select using (
--   public.has_role('ROLE_ADMIN')
--   or upper(empresa) = upper(public.auth_empresa())
--   or exists (
--     select 1 from public.persona_asociada_empresa pae
--     where pae.id_persona = persona.id
--       and upper(pae.nombre_empresa) like '%' || upper(public.auth_empresa()) || '%'
--   )
-- );
--
-- create policy persona_write on public.persona for all
--   using ( public.has_role('ROLE_ADMIN') or public.has_role('OPERACIONES') )
--   with check ( upper(empresa) = upper(public.auth_empresa()) or public.has_role('ROLE_ADMIN') );

-- --- Ejemplo: mochila SPDC (solo ALTA) --------------------------------------
-- alter table public.mochila_spdc enable row level security;
-- create policy mochila_alta on public.mochila_spdc for all using (
--   public.es_alta()
--   and ( public.has_role('ROLE_ADMIN') or public.has_role('ADMIN_VERTICAL') or public.has_role('OPERACIONES') )
-- );
-- -- idem: mochila_articulo_spdc, inspeccion_mochila, historial_mochila_spdc, evaluacion_articulo
