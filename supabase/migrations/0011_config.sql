-- =============================================================================
-- 0011_config.sql — Catálogos de Configuración (Fase 4): PKs + read policies
-- =============================================================================
-- faena/cargo/empresa/empresa_cliente ya tienen read-auth (0006). Aquí faltaban
-- documento, herramienta, equipo. Son catálogos de referencia (no PII):
-- definiciones de tipos de documento, herramientas y equipos.

alter table public.faena           alter column id set default nextval('public.sequence_generator');
alter table public.cargo           alter column id set default nextval('public.sequence_generator');
alter table public.documento       alter column id set default nextval('public.sequence_generator');
alter table public.empresa         alter column id set default nextval('public.sequence_generator');
alter table public.empresa_cliente alter column id set default nextval('public.sequence_generator');
alter table public.herramienta     alter column id set default nextval('public.sequence_generator');
alter table public.equipo          alter column id set default nextval('public.sequence_generator');

do $$
declare t text;
begin
  foreach t in array array['documento', 'herramienta', 'equipo'] loop
    execute format('drop policy if exists %1$I_read_auth on public.%1$I;', t);
    execute format('create policy %1$I_read_auth on public.%1$I for select to authenticated using (true);', t);
  end loop;
end $$;
