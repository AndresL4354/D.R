-- =============================================================================
-- 0031_persona_documentos_servicios.sql — Sub-páginas de la ficha de Persona.
-- Porta con paridad los endpoints de documento-persona.component y
-- servicios.component (Angular) + GeneralesServiceImpl/PersonaServiceImpl:
--
--   persona_servicios            → GET /api/personas/{id}/servicios
--     (persona_proyecto JOIN proyecto LEFT JOIN cargo, excluye estado
--      'ELIMINADO' — BACKUP y NULL sí aparecen —, ORDER BY pp.id DESC y el
--      primero se marca actual=true, como PersonaServiceImpl).
--   persona_documentos           → GET /api/consultarDocumentosPersona[P]/{id}/{cat}
--     (JOIN documento POR NOMBRE — no hay FK, fiel —, filtro por categoría y,
--      en la variante pública, privado=false; ORDER BY nombre_documento.
--      tipo_resultado se enriquece como consultarDocumentoByNombreSingle:
--      primer documento del catálogo por nombre ORDER BY id ASC).
--   persona_documentos_requeridos → GET /api/documentosRequeridosCargo[P]/{cat}/{ids}
--   documento_persona_guardar_fecha    → POST /api/guardarDocumentosPersona
--     (SOLO actualiza fecha_vencimiento por id; si el id no existe el original
--      revienta con NPE→500 → aquí raise exception).
--   documento_persona_guardar_resultado → PUT /api/resultado-documento
--     (UPDATE valor_resultado WHERE id; executeUpdate → si no existe, no-op).
--   documento_persona_eliminar   → DELETE /api/eliminarArchivoPersona/{id}
--     (deleteById; el front lo dispara sin confirmación incluso con id 0 y
--      se traga los errores → aquí delete silencioso).
--   documentos_persona_limpiar_huerfanos → DELETE /api/eliminarArchivosBasura
--     (DELETE WHERE id_persona IS NULL; lo dispara el botón Guardar).
--
-- Gating: el backend original NO tenía checks server-side en nada de esto
-- (solo client-side, y asimétrico: el menú Editar/Eliminar solo está gateado
-- en la tabla de Generales). Decisión del port (endurecimiento deliberado):
-- LECTURAS y mutaciones exigen alcance multi-tenant (admin o persona_visible
-- de la persona/dueño del doc) pero NO rol — así el quirk del menú sin gating
-- en Cursos/Acreditación/Legales sigue operativo dentro de la empresa.
-- limpiar_huerfanos sí se gatea por los roles del botón Guardar (es global).
-- Todas las funciones llevan REVOKE de public/anon (por defecto Postgres da
-- EXECUTE a PUBLIC y persona_documentos_requeridos no tiene guard runtime).
-- La carga de PDF (Storage) y el ZIP quedan para Fase 5/8.
-- =============================================================================

-- Historial de servicios del trabajador (ServicioHistoricoDTO)
create or replace function public.persona_servicios(p_id bigint)
returns table(
  id_proyecto bigint,
  nombre_servicio text,
  faena text,
  nombre_cargo text,
  estado text,
  fecha_creacion timestamp,
  acreditado boolean,
  nuevo boolean,
  actual boolean
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
  select pp.id_proyecto,
         pr.nombre::text,
         pr.faena::text,
         c.nombre::text,
         pp.estado::text,
         pp.fecha_creacion,
         pp.acreditado,
         pp.nuevo,
         (row_number() over (order by pp.id desc)) = 1
    from public.persona_proyecto pp
    join public.proyecto pr on pr.id = pp.id_proyecto
    left join public.cargo c on c.id = pp.id_cargo
   where pp.id_persona = p_id
     and (pp.estado is null or pp.estado <> 'ELIMINADO')
   order by pp.id desc;
end;
$$;

grant execute on function public.persona_servicios(bigint) to authenticated;

-- Documentos de la persona por categoría (con enriquecimiento tipo_resultado).
-- p_solo_publicos=true replica la variante ...P (sin autoridad DOC_PRIVADO).
-- El JOIN es por nombre (sin FK) y SIN distinct: nombres duplicados en el
-- catálogo duplican filas, fiel al JPQL original.
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
  tipo_resultado text
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
           limit 1)
    from public.documentos_persona dp
    join public.documento d on dp.nombre_documento = d.nombre
   where dp.id_persona = p_id
     and d.categoria_documento = p_categoria
     and (not p_solo_publicos or d.privado = false)
   order by dp.nombre_documento;
end;
$$;

grant execute on function public.persona_documentos(bigint, text, boolean) to authenticated;

-- Catálogo de documentos requeridos por cargo y categoría (IDocumentoCargo)
create or replace function public.persona_documentos_requeridos(
  p_categoria text, p_ids_cargo bigint[], p_solo_publicos boolean
)
returns table(id bigint, nombre text, id_cargo bigint, requerido boolean)
language sql
stable
security definer
set search_path = public
as $$
  select dc.id, dc.nombre::text, dc.id_cargo, dc.requerido
    from public.documentos_cargo dc
    join public.cargo r on dc.id_cargo = r.id
    join public.documento d on dc.nombre = d.nombre
   where r.id = any(p_ids_cargo)
     and d.categoria_documento = p_categoria
     and (not p_solo_publicos or d.privado = false)
   order by dc.nombre;
$$;

grant execute on function public.persona_documentos_requeridos(text, bigint[], boolean) to authenticated;

-- editar-doc: SOLO fecha_vencimiento por id (guardarDocumentosPersona fiel)
create or replace function public.documento_persona_guardar_fecha(p_id bigint, p_fecha timestamp)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_persona bigint;
begin
  select dp.id_persona into v_persona from public.documentos_persona dp where dp.id = p_id;
  if not found then
    raise exception 'documento no encontrado';
  end if;
  if not (has_role('ROLE_ADMIN') or public.persona_visible(v_persona)) then
    raise exception 'documento fuera del alcance de tu empresa';
  end if;
  update public.documentos_persona set fecha_vencimiento = p_fecha where id = p_id;
end;
$$;

grant execute on function public.documento_persona_guardar_fecha(bigint, timestamp) to authenticated;

-- Modificar resultado: UPDATE valor_resultado WHERE id (no-op si no existe)
create or replace function public.documento_persona_guardar_resultado(p_id bigint, p_valor text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_persona bigint;
begin
  select dp.id_persona into v_persona from public.documentos_persona dp where dp.id = p_id;
  if not found then
    return; -- executeUpdate: 0 filas afectadas, sin error (fiel)
  end if;
  if not (has_role('ROLE_ADMIN') or public.persona_visible(v_persona)) then
    raise exception 'documento fuera del alcance de tu empresa';
  end if;
  update public.documentos_persona set valor_resultado = p_valor where id = p_id;
end;
$$;

grant execute on function public.documento_persona_guardar_resultado(bigint, text) to authenticated;

-- Eliminar (deleteById; silencioso si no existe — el front original ignora
-- errores y llega a mandar id 0 para placeholders)
create or replace function public.documento_persona_eliminar(p_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_persona bigint;
begin
  select dp.id_persona into v_persona from public.documentos_persona dp where dp.id = p_id;
  if not found then
    return;
  end if;
  if not (has_role('ROLE_ADMIN') or public.persona_visible(v_persona)) then
    raise exception 'documento fuera del alcance de tu empresa';
  end if;
  delete from public.documentos_persona where id = p_id;
end;
$$;

grant execute on function public.documento_persona_eliminar(bigint) to authenticated;

-- eliminarArchivosBasura: limpia filas huérfanas (id_persona IS NULL).
-- Gateado por los roles del botón Guardar (operación global destructiva).
create or replace function public.documentos_persona_limpiar_huerfanos()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (has_role('ROLE_ADMIN') or has_role('VALIDADOR_RRHH') or has_role('ENCARGADO_RRHH')) then
    raise exception 'permiso denegado para limpiar documentos huérfanos';
  end if;
  delete from public.documentos_persona where id_persona is null;
end;
$$;

grant execute on function public.documentos_persona_limpiar_huerfanos() to authenticated;

-- Postgres otorga EXECUTE a PUBLIC por defecto en funciones nuevas: sin este
-- revoke, anon podría invocarlas vía PostgREST (persona_documentos_requeridos
-- no tiene guard runtime y enumeraría el catálogo).
revoke execute on function public.persona_servicios(bigint) from public, anon;
revoke execute on function public.persona_documentos(bigint, text, boolean) from public, anon;
revoke execute on function public.persona_documentos_requeridos(text, bigint[], boolean) from public, anon;
revoke execute on function public.documento_persona_guardar_fecha(bigint, timestamp) from public, anon;
revoke execute on function public.documento_persona_guardar_resultado(bigint, text) from public, anon;
revoke execute on function public.documento_persona_eliminar(bigint) from public, anon;
revoke execute on function public.documentos_persona_limpiar_huerfanos() from public, anon;
