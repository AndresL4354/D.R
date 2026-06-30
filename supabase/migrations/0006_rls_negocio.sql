-- =============================================================================
-- 0006_rls_negocio.sql — RLS de tablas de negocio (baseline + pilot persona/EPP)
-- =============================================================================
-- Portan §9.2/§9.3 del plan, CORREGIDAS tras verificar con datos reales:
--   * Todas las policies de negocio van `to authenticated` (anon nunca ve PII).
--   * Se guarda auth_empresa() <> '' para no colapsar el LIKE a '%%' (un claim
--     de empresa vacío filtraba TODO — fuga crítica detectada en el pilot).
--   * El SELECT se rige SOLO por persona_select; la escritura se separa por
--     comando (insert/update/delete) para que su USING no amplíe el SELECT.
-- ⚠️ Verificar con pgTAP (§9.5). El resto de tablas quedan RLS-on sin policy =
-- deny-by-default (seguro); se completan dominio por dominio (§9.4).

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
      'drop policy if exists %1$I_read_auth on public.%1$I;', t);
    execute format(
      'create policy %1$I_read_auth on public.%1$I for select to authenticated using (true);', t);
  end loop;
end $$;

-- 3) persona_asociada_empresa: admin o coincidencia de empresa (sostiene el
--    subquery de persona_select). Guardado contra empresa vacía.
drop policy if exists pae_select on public.persona_asociada_empresa;
create policy pae_select on public.persona_asociada_empresa for select to authenticated using (
  public.has_role('ROLE_ADMIN')
  or (public.auth_empresa() <> ''
      and upper(nombre_empresa) like '%' || upper(public.auth_empresa()) || '%')
);

-- 4) persona — SELECT multi-tenant (§9.2)
drop policy if exists persona_select on public.persona;
create policy persona_select on public.persona for select to authenticated using (
  public.has_role('ROLE_ADMIN')
  or (
    public.auth_empresa() <> '' and (
      upper(empresa) = upper(public.auth_empresa())
      or exists (
        select 1 from public.persona_asociada_empresa pae
        where pae.id_persona = persona.id
          and upper(pae.nombre_empresa) like '%' || upper(public.auth_empresa()) || '%'
      )
    )
  )
);

-- 4b) persona — escritura por comando (no amplía el SELECT). Write = admin / OPERACIONES de su empresa.
drop policy if exists persona_insert on public.persona;
create policy persona_insert on public.persona for insert to authenticated
  with check (
    public.has_role('ROLE_ADMIN')
    or (public.auth_empresa() <> '' and public.has_role('OPERACIONES')
        and upper(empresa) = upper(public.auth_empresa()))
  );

drop policy if exists persona_update on public.persona;
create policy persona_update on public.persona for update to authenticated
  using (
    public.has_role('ROLE_ADMIN')
    or (public.auth_empresa() <> '' and public.has_role('OPERACIONES')
        and upper(empresa) = upper(public.auth_empresa()))
  )
  with check (
    public.has_role('ROLE_ADMIN')
    or (public.auth_empresa() <> '' and upper(empresa) = upper(public.auth_empresa()))
  );

drop policy if exists persona_delete on public.persona;
create policy persona_delete on public.persona for delete to authenticated
  using (public.has_role('ROLE_ADMIN'));

-- 5) Familia Mochila SPDC: solo ALTA + roles — §9.3 (es_alta()=false niega a anon/otros).
do $$
declare t text;
begin
  foreach t in array array[
    'mochila_spdc','mochila_articulo_spdc','inspeccion_mochila',
    'historial_mochila_spdc','evaluacion_articulo'
  ] loop
    execute format('drop policy if exists %1$I_alta on public.%1$I;', t);
    execute format(
      'create policy %1$I_alta on public.%1$I for all to authenticated using ('
      || 'public.es_alta() and (public.has_role(''ROLE_ADMIN'') '
      || 'or public.has_role(''ADMIN_VERTICAL'') or public.has_role(''OPERACIONES'')));',
      t);
  end loop;
end $$;
