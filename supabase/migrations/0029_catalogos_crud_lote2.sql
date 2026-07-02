-- =============================================================================
-- 0029_catalogos_crud_lote2.sql — Escritura de catálogos (Fase 4), lote 2.
-- documento, empresa, empresa_cliente, aviso_mantenimiento. Mismo criterio que
-- 0028: policy de escritura permissive gated a ROLE_ADMIN/SUPERADMINISTRADOR/
-- SUPERADMINISTRADOR BP; la lectura sigue abierta (via `*_read_auth`). CRUD por
-- PostgREST. (El aviso, además, va en una ruta gateada por ROLE_ADMIN/SUPER.)
-- =============================================================================

do $$
declare
  t text;
  cond constant text := $c$has_role('ROLE_ADMIN') or has_role('SUPERADMINISTRADOR') or has_role('SUPERADMINISTRADOR BP')$c$;
begin
  foreach t in array array['documento', 'empresa', 'empresa_cliente', 'aviso_mantenimiento'] loop
    execute format('drop policy if exists %1$I_write on public.%1$I;', t);
    execute format(
      'create policy %1$I_write on public.%1$I for all to authenticated using (%2$s) with check (%2$s);',
      t, cond
    );
  end loop;
end $$;
