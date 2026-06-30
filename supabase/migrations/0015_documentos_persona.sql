-- =============================================================================
-- 0015_documentos_persona.sql — RLS documentos_persona + helper persona_visible
-- =============================================================================
-- Helper: ¿la persona pid es visible para el usuario? (misma lógica que la
-- policy de persona). SECURITY DEFINER para reutilizar sin chocar con RLS.
create or replace function public.persona_visible(pid bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.has_role('ROLE_ADMIN')
    or (pid is not null and public.auth_empresa() <> '' and exists (
      select 1 from public.persona pe
      where pe.id = pid and (
        upper(coalesce(pe.empresa, '')) = upper(public.auth_empresa())
        or exists (
          select 1 from public.persona_asociada_empresa pae
          where pae.id_persona = pe.id
            and upper(coalesce(pae.nombre_empresa, '')) like '%' || upper(public.auth_empresa()) || '%'
        )
      )
    ));
$$;

-- documentos_persona: visible si la persona dueña es visible.
drop policy if exists documentos_persona_select on public.documentos_persona;
create policy documentos_persona_select on public.documentos_persona for select to authenticated
  using (public.persona_visible(id_persona));
