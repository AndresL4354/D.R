-- =============================================================================
-- 0002_perfil.sql  —  Perfil de usuario + Auth Hook (custom claims)  [§8]
-- =============================================================================
-- `perfil` reemplaza `jhi_user` (§7.2). Conserva los campos que docnomina usa
-- para autorización (empresa, roles) y los que necesita el provisioning SSO
-- (id_gesta_os, login, email, nombres). auth.users (GoTrue) es 1:1 con perfil.

create table if not exists public.perfil (
  id uuid primary key references auth.users (id) on delete cascade,
  id_gesta_os text unique,                 -- vínculo SSO (hoy jhi_user.id_gesta_os)
  login text unique not null,
  email text unique not null,
  first_name text,
  last_name text,
  empresa text not null default '',        -- 'GESTA SERVICIOS...', 'SERVICIOS ALTA SPA', ...
  roles text[] not null default '{}',      -- authorities locales (jhi_user_authority)
  activated boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at automático.
create or replace function public.tg_set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_perfil_updated_at on public.perfil;
create trigger trg_perfil_updated_at before update on public.perfil
  for each row execute function public.tg_set_updated_at();

-- =============================================================================
-- Auth Hook: inyecta empresa y roles como custom claims en el JWT.
-- Registrar en Dashboard → Auth → Hooks → Custom Access Token.
-- =============================================================================
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  claims jsonb;
  p record;
begin
  select empresa, roles into p
  from public.perfil
  where id = (event->>'user_id')::uuid;

  claims := coalesce(event->'claims', '{}'::jsonb);

  if p.empresa is not null then
    claims := jsonb_set(claims, '{app_empresa}', to_jsonb(p.empresa));
    claims := jsonb_set(claims, '{app_roles}',   to_jsonb(p.roles));
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- Permisos requeridos por el hook de GoTrue.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant select on public.perfil to supabase_auth_admin;

-- =============================================================================
-- RLS de perfil: cada usuario ve solo su propio perfil. (La policy de admin
-- vive en 0003, tras definir has_role.) El provisioning usa service_role, que
-- bypassa RLS, así que no hacen falta policies de escritura para el cliente.
-- =============================================================================
alter table public.perfil enable row level security;

create policy perfil_select_own on public.perfil
  for select using (id = (select auth.uid()));
