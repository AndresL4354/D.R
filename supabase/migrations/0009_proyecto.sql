-- =============================================================================
-- 0009_proyecto.sql — Dominio Proyecto (Servicios): PKs + RLS multi-tenant (§9.4)
-- =============================================================================
-- proyecto.razon_social_empresa tiene la empresa. §9.4: proyecto = su empresa.
-- Reemplaza el catalog-read de 0006 (que dejaba ver TODOS los proyectos).

alter table public.proyecto         alter column id set default nextval('public.sequence_generator');
alter table public.persona_proyecto alter column id set default nextval('public.sequence_generator');

-- proyecto: SELECT multi-tenant (escritura por comando para no ampliar el SELECT).
drop policy if exists proyecto_read_auth on public.proyecto;
drop policy if exists proyecto_select on public.proyecto;
create policy proyecto_select on public.proyecto for select to authenticated using (
  public.has_role('ROLE_ADMIN')
  or (public.auth_empresa() <> ''
      and upper(coalesce(razon_social_empresa, '')) like '%' || upper(public.auth_empresa()) || '%')
);

drop policy if exists proyecto_insert on public.proyecto;
create policy proyecto_insert on public.proyecto for insert to authenticated
  with check (
    public.has_role('ROLE_ADMIN')
    or (public.has_role('OPERACIONES') and public.auth_empresa() <> ''
        and upper(coalesce(razon_social_empresa, '')) like '%' || upper(public.auth_empresa()) || '%')
  );

drop policy if exists proyecto_update on public.proyecto;
create policy proyecto_update on public.proyecto for update to authenticated
  using (
    public.has_role('ROLE_ADMIN')
    or (public.has_role('OPERACIONES') and public.auth_empresa() <> ''
        and upper(coalesce(razon_social_empresa, '')) like '%' || upper(public.auth_empresa()) || '%')
  )
  with check (
    public.has_role('ROLE_ADMIN')
    or (public.auth_empresa() <> ''
        and upper(coalesce(razon_social_empresa, '')) like '%' || upper(public.auth_empresa()) || '%')
  );

drop policy if exists proyecto_delete on public.proyecto;
create policy proyecto_delete on public.proyecto for delete to authenticated
  using (public.has_role('ROLE_ADMIN'));

-- persona_proyecto: visible si el proyecto asociado es visible (misma empresa) o admin.
drop policy if exists persona_proyecto_select on public.persona_proyecto;
create policy persona_proyecto_select on public.persona_proyecto for select to authenticated using (
  public.has_role('ROLE_ADMIN')
  or exists (
    select 1 from public.proyecto pr
    where pr.id = persona_proyecto.id_proyecto
      and public.auth_empresa() <> ''
      and upper(coalesce(pr.razon_social_empresa, '')) like '%' || upper(public.auth_empresa()) || '%'
  )
);
