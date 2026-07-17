-- =============================================================================
-- 0034_storage_documentos.sql — Storage para documentos de Persona (Fase 5).
-- Des-stubea la subida/visualización de PDF de la sub-página Documentos:
-- el original guardaba el archivo en el FILESYSTEM del server (cargarDocumento:
-- ruta_foto id=2 + "{nombre}-{n}.pdf") y la fila en documentos_persona con la
-- ruta en la columna `documento`. En el port:
--   * bucket privado `documentos-persona` (solo PDF, máx 10 MB),
--   * objetos bajo "{id_persona}/{nombre}-{sufijo}.pdf" — la columna
--     `documento` guarda esa ruta de Storage (los registros LEGACY conservan
--     su ruta de filesystem y siguen sin binario hasta la Fase 8),
--   * subida en el cliente + RPC documento_persona_cargar que crea la fila
--     CON fecha en un paso (desviación deliberada del flujo 2-pasos del
--     original, que podía dejar docs sin fecha si fallaba el 2º POST),
--   * visualización vía signed URL (60s).
-- Gating fiel a la UI: subir/borrar = ROLE_ADMIN/VALIDADOR_RRHH/ENCARGADO_RRHH
-- + alcance multi-tenant (persona_visible por carpeta); lectura = persona
-- visible. El bucket es privado: sin URL pública.
-- =============================================================================

-- FIX de bug latente detectado al verificar esta fase: persona_cargo tenía
-- RLS habilitado SIN policies → deny-all silencioso vía PostgREST. Efectos:
-- los placeholders de "documentos requeridos del cargo" nunca aparecían en
-- la sub-página Documentos, y el verificar-documentos del cambio de estado
-- corría siempre con ids de cargo vacíos (solo detectaba vencidos, nunca
-- faltantes). Se abre lectura con el alcance estándar por persona.
drop policy if exists persona_cargo_select on public.persona_cargo;
create policy persona_cargo_select on public.persona_cargo
  for select to authenticated
  using (public.persona_visible(persona));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos-persona', 'documentos-persona', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

-- Lectura: la carpeta raíz es el id de la persona → visible si la persona lo es.
drop policy if exists docs_persona_select on storage.objects;
create policy docs_persona_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documentos-persona'
    and name ~ '^[0-9]+/'
    and public.persona_visible(split_part(name, '/', 1)::bigint)
  );

-- Subida: roles del input file de la UI + alcance por empresa.
drop policy if exists docs_persona_insert on storage.objects;
create policy docs_persona_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documentos-persona'
    and name ~ '^[0-9]+/'
    and (has_role('ROLE_ADMIN') or has_role('VALIDADOR_RRHH') or has_role('ENCARGADO_RRHH'))
    and public.persona_visible(split_part(name, '/', 1)::bigint)
  );

-- Borrado del objeto (limpieza; la fila se borra por documento_persona_eliminar).
drop policy if exists docs_persona_delete on storage.objects;
create policy docs_persona_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documentos-persona'
    and name ~ '^[0-9]+/'
    and (has_role('ROLE_ADMIN') or has_role('VALIDADOR_RRHH') or has_role('ENCARGADO_RRHH'))
    and public.persona_visible(split_part(name, '/', 1)::bigint)
  );

-- Crea la fila del documento tras subir el PDF (cargarDocumento + fecha en un paso).
create or replace function public.documento_persona_cargar(
  p_id_persona bigint,
  p_nombre_documento text,
  p_ruta text,
  p_fecha timestamp
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  if not (has_role('ROLE_ADMIN') or has_role('VALIDADOR_RRHH') or has_role('ENCARGADO_RRHH')) then
    raise exception 'permiso denegado para cargar documentos';
  end if;
  if not (has_role('ROLE_ADMIN') or public.persona_visible(p_id_persona)) then
    raise exception 'persona fuera del alcance de tu empresa';
  end if;
  if not exists (select 1 from public.persona p where p.id = p_id_persona) then
    raise exception 'persona no encontrada';
  end if;
  insert into public.documentos_persona
    (id_persona, nombre_documento, documento, tipo_documento, fecha_vencimiento, vencido)
  values
    (p_id_persona, p_nombre_documento, p_ruta, 'application/pdf', p_fecha, false)
  returning documentos_persona.id into v_id;
  return v_id;
end;
$$;

grant execute on function public.documento_persona_cargar(bigint, text, text, timestamp) to authenticated;
revoke execute on function public.documento_persona_cargar(bigint, text, text, timestamp) from public, anon;

-- persona_documentos (0031) ahora expone también la ruta (`documento`) para
-- que el botón "ver" abra el PDF de Storage (legacy filesystem sigue stub).
drop function if exists public.persona_documentos(bigint, text, boolean);
create or replace function public.persona_documentos(
  p_id bigint, p_categoria text, p_solo_publicos boolean
)
returns table(
  id bigint,
  nombre_documento text,
  vencido boolean,
  fecha_vencimiento timestamp,
  tipo_documento text,
  valor_resultado text,
  tipo_resultado text,
  documento text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (has_role('ROLE_ADMIN') or public.persona_visible(p_id)) then
    raise exception 'persona fuera del alcance de tu empresa';
  end if;
  return query
  select dp.id,
         dp.nombre_documento::text,
         dp.vencido,
         dp.fecha_vencimiento,
         dp.tipo_documento::text,
         dp.valor_resultado::text,
         (select d2.tipo_resultado::text
            from public.documento d2
           where d2.nombre = dp.nombre_documento
           order by d2.id asc
           limit 1),
         dp.documento::text
    from public.documentos_persona dp
    join public.documento d on dp.nombre_documento = d.nombre
   where dp.id_persona = p_id
     and d.categoria_documento = p_categoria
     and (not p_solo_publicos or d.privado = false)
   order by dp.nombre_documento;
end;
$$;

grant execute on function public.persona_documentos(bigint, text, boolean) to authenticated;
revoke execute on function public.persona_documentos(bigint, text, boolean) from public, anon;
