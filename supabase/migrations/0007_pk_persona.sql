-- =============================================================================
-- 0007_pk_persona.sql — Generación de IDs para inserts del front nuevo (§18)
-- =============================================================================
-- El esquema JHipster usa la secuencia compartida public.sequence_generator
-- (NO hay default por tabla → los inserts requerían id explícito). Asignamos esa
-- secuencia como DEFAULT del id en las tablas que el front escribe. Los IDs
-- siguen siendo globalmente únicos (compatible con integraciones que asumen IDs).
-- Se hace por dominio; aquí: persona (pilot Fase 2).

alter table public.persona alter column id set default nextval('public.sequence_generator');
