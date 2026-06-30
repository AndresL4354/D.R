-- =============================================================================
-- 0006_rls_negocio.sql — RLS de tablas de negocio (baseline + pilot persona/EPP)
-- =============================================================================
-- ⚠️ Portan §9.2/§9.3 del plan. DEBEN verificarse con pgTAP (§9.5) ANTES de
-- cargar datos reales. Sin datos aún, no hay riesgo de fuga. El resto de las
-- ~70 tablas quedan con RLS habilitado SIN policy = deny-by-default (seguro);
-- se les escribe policy dominio por dominio (§9.4).

-- 1) Baseline seguro: RLS habilitado en TODAS las tablas public (deny-by-default).
do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security;', r.tablename);
  end loop;
end $$;

-- 2) Catálogos de referencia: lectura para cualquier usuario autenticado.
do $$
declare t text;
begin
  foreach t in array array[
    'estado','tipo_identificacion','tipo_usuario','pais','region','comuna',
    'cargo','categoria_cargo','empresa','empresa_cliente','tipo_cuadrilla',
    'tipo_equipo','faena','proyecto'
  ] loop
    execute format(
      'create policy %1$I_read_auth on public.%1$I for select to authenticated using (true);',
      t
    );
  end loop;
end $$;

-- 3) persona_asociada_empresa: admin o coincidencia de empresa (sostiene el
--    subquery de persona_select).
create policy pae_select on public.persona_asociada_empresa for select using (
  public.has_role('ROLE_ADMIN')
  or upper(nombre_empresa) like '%' || upper(public.auth_empresa()) || '%'
);

-- 4) persona (multi-tenant) — §9.2
create policy persona_select on public.persona for select using (
  public.has_role('ROLE_ADMIN')
  or upper(empresa) = upper(public.auth_empresa())
  or exists (
    select 1 from public.persona_asociada_empresa pae
    where pae.id_persona = persona.id
      and upper(pae.nombre_empresa) like '%' || upper(public.auth_empresa()) || '%'
  )
);
create policy persona_write on public.persona for all
  using (public.has_role('ROLE_ADMIN') or public.has_role('OPERACIONES'))
  with check (upper(empresa) = upper(public.auth_empresa()) or public.has_role('ROLE_ADMIN'));

-- 5) Familia Mochila SPDC: solo ALTA + roles — §9.3
do $$
declare t text;
begin
  foreach t in array array[
    'mochila_spdc','mochila_articulo_spdc','inspeccion_mochila',
    'historial_mochila_spdc','evaluacion_articulo'
  ] loop
    execute format(
      'create policy %1$I_alta on public.%1$I for all using ('
      || 'public.es_alta() and (public.has_role(''ROLE_ADMIN'') '
      || 'or public.has_role(''ADMIN_VERTICAL'') or public.has_role(''OPERACIONES'')));',
      t
    );
  end loop;
end $$;
