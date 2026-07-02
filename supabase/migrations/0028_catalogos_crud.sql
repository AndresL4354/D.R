-- =============================================================================
-- 0028_catalogos_crud.sql — Escritura de catálogos de Configuración (Fase 4).
-- Los catálogos tenían RLS con SOLO policy de lectura (`*_read_auth`); el front
-- no podía crear/editar/eliminar. Aquí se añaden policies de ESCRITURA alineadas
-- al gating real de docnomina (botones *jhiHasAnyAuthority=['ROLE_ADMIN',
-- 'SUPERADMINISTRADOR','SUPERADMINISTRADOR BP']). Como son permissive, la lectura
-- sigue abierta a authenticated (via `*_read_auth`) y la ESCRITURA queda restringida
-- a esos 3 roles. CRUD por PostgREST directo (sin RPC), como en proyecto (0024).
-- Primer lote: faena, cargo, articulo, tipo_equipo.
-- =============================================================================

do $$
declare
  t text;
  cond constant text := $c$has_role('ROLE_ADMIN') or has_role('SUPERADMINISTRADOR') or has_role('SUPERADMINISTRADOR BP')$c$;
begin
  foreach t in array array['faena', 'cargo', 'tipo_equipo'] loop
    execute format('drop policy if exists %1$I_write on public.%1$I;', t);
    execute format(
      'create policy %1$I_write on public.%1$I for all to authenticated using (%2$s) with check (%2$s);',
      t, cond
    );
  end loop;
end $$;

-- Artículo: gating por fila (fiel a validarPermiso) — SPDC lo gestiona ADMIN_VERTICAL,
-- el resto ROLE_ADMIN (+ SUPER/SUPER BP). USING mira la fila existente (update/delete);
-- WITH CHECK mira la fila nueva (insert/update).
drop policy if exists articulo_write on public.articulo;
create policy articulo_write on public.articulo for all to authenticated
  using (
    has_role('ROLE_ADMIN') or has_role('SUPERADMINISTRADOR') or has_role('SUPERADMINISTRADOR BP')
    or (clasificacion = 'SPDC' and has_role('ADMIN_VERTICAL'))
  )
  with check (
    has_role('ROLE_ADMIN') or has_role('SUPERADMINISTRADOR') or has_role('SUPERADMINISTRADOR BP')
    or (clasificacion = 'SPDC' and has_role('ADMIN_VERTICAL'))
  );
