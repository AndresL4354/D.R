-- =============================================================================
-- 0008_despacho.sql — Dominio Despacho: PKs + auditoría de estados + RLS (§10.2/§9.4)
-- =============================================================================
-- Nota: en el esquema real el `estado` vive en `despacho` (no en
-- trabajador_despacho, que solo tiene id/id_persona/id_despacho). La auditoría
-- de estados se hace sobre despacho. Despacho es dominio por ROL (DESPACHO_*),
-- no multi-tenant por empresa (§9.4).

-- 1) PK defaults (inserts del front).
alter table public.despacho            alter column id set default nextval('public.sequence_generator');
alter table public.trabajador_despacho alter column id set default nextval('public.sequence_generator');
alter table public.accion_despacho     alter column id set default nextval('public.sequence_generator');

-- 2) Tabla de auditoría de cambios de estado (nueva).
create table if not exists public.auditoria_estado_despacho (
  id bigint primary key default nextval('public.sequence_generator'),
  id_despacho bigint not null,
  estado_anterior text,
  estado_nuevo text,
  usuario text,
  fecha timestamptz not null default now()
);
alter table public.auditoria_estado_despacho enable row level security;

-- 3) Trigger que registra cada cambio de estado. SECURITY DEFINER para poder
--    escribir la auditoría aunque el usuario no tenga insert directo en ella.
create or replace function public.fn_audita_estado_despacho()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.estado is distinct from old.estado then
    insert into public.auditoria_estado_despacho(id_despacho, estado_anterior, estado_nuevo, usuario, fecha)
    values (new.id, old.estado, new.estado,
            coalesce(auth.jwt()->>'email', auth.jwt()->>'sub', 'sistema'), now());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audita_estado_despacho on public.despacho;
create trigger trg_audita_estado_despacho before update on public.despacho
  for each row execute function public.fn_audita_estado_despacho();

-- 4) Helper: ¿tiene algún rol de despacho? (incluye admin)
create or replace function public.tiene_rol_despacho() returns boolean
language sql stable set search_path = '' as $$
  select public.has_role('ROLE_ADMIN')
    or public.has_role('DESPACHO_ACREDITACION') or public.has_role('DESPACHO_ADMINISTRADOR')
    or public.has_role('DESPACHO_BODEGA')       or public.has_role('DESPACHO_CURSOS')
    or public.has_role('DESPACHO_RECEPCION')    or public.has_role('DESPACHO_SSO')
    or public.has_role('DESPACHO_TRANSPORTE');
$$;

-- 5) RLS de la familia despacho: lectura para roles despacho + OPERACIONES + REPORTABILIDAD;
--    escritura solo roles despacho/admin. (write USING ⊆ select → no amplía el SELECT.)
do $$
declare t text;
begin
  foreach t in array array['despacho','trabajador_despacho','accion_despacho'] loop
    execute format('drop policy if exists %1$I_select on public.%1$I;', t);
    execute format('create policy %1$I_select on public.%1$I for select to authenticated using ('
                || 'public.tiene_rol_despacho() or public.has_role(''OPERACIONES'') or public.has_role(''REPORTABILIDAD''));', t);
    execute format('drop policy if exists %1$I_write on public.%1$I;', t);
    execute format('create policy %1$I_write on public.%1$I for all to authenticated '
                || 'using (public.tiene_rol_despacho()) with check (public.tiene_rol_despacho());', t);
  end loop;
end $$;

drop policy if exists auditoria_select on public.auditoria_estado_despacho;
create policy auditoria_select on public.auditoria_estado_despacho for select to authenticated
  using (public.tiene_rol_despacho() or public.has_role('REPORTABILIDAD'));
