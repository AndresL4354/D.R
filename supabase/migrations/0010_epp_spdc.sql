-- =============================================================================
-- 0010_epp_spdc.sql — Entrega EPP + Mochila SPDC + catálogo Articulo
-- =============================================================================

-- PK defaults
alter table public.entrega_epp          alter column id set default nextval('public.sequence_generator');
alter table public.detalle_entrega_epp  alter column id set default nextval('public.sequence_generator');
alter table public.mochila_articulo_spdc alter column id set default nextval('public.sequence_generator');
alter table public.inspeccion_mochila   alter column id set default nextval('public.sequence_generator');
alter table public.articulo             alter column id set default nextval('public.sequence_generator');
alter table public.cuadrilla            alter column id set default nextval('public.sequence_generator');
alter table public.trabajador_cuadrilla alter column id set default nextval('public.sequence_generator');

-- entrega_epp: multi-tenant por razon_social_empresa (lectura). Escritura: solo admin por ahora.
drop policy if exists entrega_epp_select on public.entrega_epp;
create policy entrega_epp_select on public.entrega_epp for select to authenticated using (
  public.has_role('ROLE_ADMIN')
  or (public.auth_empresa() <> ''
      and upper(coalesce(razon_social_empresa, '')) like '%' || upper(public.auth_empresa()) || '%')
);
drop policy if exists entrega_epp_admin_write on public.entrega_epp;
create policy entrega_epp_admin_write on public.entrega_epp for all to authenticated
  using (public.has_role('ROLE_ADMIN')) with check (public.has_role('ROLE_ADMIN'));

-- detalle_entrega_epp: visible si la entrega lo es.
drop policy if exists detalle_entrega_select on public.detalle_entrega_epp;
create policy detalle_entrega_select on public.detalle_entrega_epp for select to authenticated using (
  public.has_role('ROLE_ADMIN')
  or exists (
    select 1 from public.entrega_epp e
    where e.id = detalle_entrega_epp.id_entrega
      and public.auth_empresa() <> ''
      and upper(coalesce(e.razon_social_empresa, '')) like '%' || upper(public.auth_empresa()) || '%'
  )
);

-- articulo: catálogo de EPP (no PII) — lectura para autenticados.
drop policy if exists articulo_read_auth on public.articulo;
create policy articulo_read_auth on public.articulo for select to authenticated using (true);

-- cuadrilla / trabajador_cuadrilla: dominio de despacho (rol). (Hoy sin datos.)
drop policy if exists cuadrilla_select on public.cuadrilla;
create policy cuadrilla_select on public.cuadrilla for select to authenticated
  using (public.tiene_rol_despacho() or public.has_role('OPERACIONES') or public.has_role('REPORTABILIDAD'));
drop policy if exists trabajador_cuadrilla_select on public.trabajador_cuadrilla;
create policy trabajador_cuadrilla_select on public.trabajador_cuadrilla for select to authenticated
  using (public.tiene_rol_despacho() or public.has_role('OPERACIONES') or public.has_role('REPORTABILIDAD'));
