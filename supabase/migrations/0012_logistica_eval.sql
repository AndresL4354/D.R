-- =============================================================================
-- 0012_logistica_eval.sql — Evaluaciones + Logística (Pasaje/Hospedaje/Citación)
-- =============================================================================
-- Helper reutilizable: ¿el proyecto pid es visible para el usuario? (admin o
-- coincidencia de empresa). SECURITY DEFINER para evaluar sin chocar con la RLS
-- de proyecto dentro de otras policies.
create or replace function public.proyecto_visible(pid bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.has_role('ROLE_ADMIN')
    or (pid is not null and public.auth_empresa() <> '' and exists (
      select 1 from public.proyecto pr
      where pr.id = pid
        and upper(coalesce(pr.razon_social_empresa, '')) like '%' || upper(public.auth_empresa()) || '%'
    ));
$$;

-- PK defaults
alter table public.evaluacion           alter column id set default nextval('public.sequence_generator');
alter table public.pasaje               alter column id set default nextval('public.sequence_generator');
alter table public.citacion             alter column id set default nextval('public.sequence_generator');
alter table public.hospedaje            alter column id set default nextval('public.sequence_generator');
alter table public.trabajador_hospedaje alter column id set default nextval('public.sequence_generator');
alter table public.trabajador_citacion  alter column id set default nextval('public.sequence_generator');

-- Entidades con id_proyecto directo
drop policy if exists evaluacion_select on public.evaluacion;
create policy evaluacion_select on public.evaluacion for select to authenticated
  using (public.proyecto_visible(id_proyecto));

drop policy if exists pasaje_select on public.pasaje;
create policy pasaje_select on public.pasaje for select to authenticated
  using (public.proyecto_visible(id_proyecto));

drop policy if exists trabajador_hospedaje_select on public.trabajador_hospedaje;
create policy trabajador_hospedaje_select on public.trabajador_hospedaje for select to authenticated
  using (public.proyecto_visible(id_proyecto));

drop policy if exists trabajador_citacion_select on public.trabajador_citacion;
create policy trabajador_citacion_select on public.trabajador_citacion for select to authenticated
  using (public.proyecto_visible(id_proyecto));

-- Entidades sin id_proyecto: visibles si un trabajador_* las liga a un proyecto visible
drop policy if exists hospedaje_select on public.hospedaje;
create policy hospedaje_select on public.hospedaje for select to authenticated using (
  public.has_role('ROLE_ADMIN')
  or exists (select 1 from public.trabajador_hospedaje th
             where th.id_hospedaje = hospedaje.id and public.proyecto_visible(th.id_proyecto))
);

drop policy if exists citacion_select on public.citacion;
create policy citacion_select on public.citacion for select to authenticated using (
  public.has_role('ROLE_ADMIN')
  or exists (select 1 from public.trabajador_citacion tc
             where tc.id_citacion = citacion.id and public.proyecto_visible(tc.id_proyecto))
);
