-- =============================================================================
-- 0032_asociacion_masiva.sql — Carga masiva de personal desde Excel (Asociar).
-- Porta POST /api/asociarPersonasProyectoMasivo (ProyectoServiceImpl, commit
-- 1ab1556 del original):
--   * resuelve RUT→persona con el MISMO alcance de la pantalla Asociar
--     (admin ve todo; si no, personas de la empresa del usuario — lógica de
--     persona_visible inlined para hacerlo set-based);
--   * RUT normalizado = upper + solo [0-9K]; RUT duplicado → gana id mayor;
--   * por fila: RUT_NO_ENCONTRADO / PERSONA_NO_ACTIVA / SIN_CARGO, y si pasa,
--     reusa asociar_persona_proyecto (0026) — PRESELECCIONADA, flag nuevo,
--     antiduplicados — con savepoint por fila (el try/catch de Java):
--     éxito → ASOCIADA; excepción → YA_ASOCIADA + mensaje.
-- Gating: el de asociar_persona_proyecto, validado UNA vez arriba (mismos 5
-- roles + proyecto_visible) para que los errores por fila sean solo de negocio.
-- =============================================================================

create or replace function public.asociar_personas_proyecto_masivo(
  p_id_proyecto bigint, p_usuario text, p_filas jsonb
)
returns table(rut text, id_persona bigint, nombre_persona text, resultado text, detalle text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fila jsonb;
  v_rut text;
  v_rut_norm text;
  v_id_cargo bigint;
  v_cargo_nombre text;
  v_p record;
begin
  if not (has_role('ROLE_ADMIN') or has_role('VALIDADOR_RRHH') or has_role('ENCARGADO_RRHH')
          or has_role('OPERACIONES') or has_role('RRHH')) then
    raise exception 'permiso denegado para asociar la persona';
  end if;
  if not (has_role('ROLE_ADMIN') or public.proyecto_visible(p_id_proyecto)) then
    raise exception 'servicio fuera del alcance de tu empresa';
  end if;
  if p_id_proyecto is null or p_filas is null or jsonb_typeof(p_filas) <> 'array' then
    return;
  end if;

  -- Índice RUT normalizado → persona visible (duplicado: se conserva id mayor).
  -- on commit drop + truncate: seguro ante llamadas repetidas en la misma tx.
  -- (truncate y no DELETE: PostgREST corre con pg-safeupdate, que rechaza
  -- DELETE sin WHERE incluso dentro de funciones SECURITY DEFINER.)
  create temp table if not exists tmp_rut_idx
    (rut_norm text primary key, id bigint, nombre text, estado text) on commit drop;
  truncate tmp_rut_idx;
  insert into tmp_rut_idx
  select distinct on (s.rn) s.rn, s.id, s.nombre_completo, s.estado_persona
    from (
      select upper(regexp_replace(coalesce(p.numero_id, ''), '[^0-9K]', '', 'g')) as rn,
             p.id, p.nombre_completo, p.estado_persona
        from public.persona p
       where has_role('ROLE_ADMIN')
          or (auth_empresa() <> '' and (
               upper(coalesce(p.empresa, '')) = upper(auth_empresa())
               or exists (
                 select 1 from public.persona_asociada_empresa pae
                  where pae.id_persona = p.id
                    and upper(coalesce(pae.nombre_empresa, '')) like '%' || upper(auth_empresa()) || '%'
               )))
    ) s
   where s.rn <> ''
   order by s.rn, s.id desc;

  for v_fila in select * from jsonb_array_elements(p_filas) loop
    v_rut := v_fila->>'rut';
    v_id_cargo := nullif(v_fila->>'id_cargo', '')::bigint;
    v_rut_norm := upper(regexp_replace(coalesce(v_rut, ''), '[^0-9K]', '', 'g'));

    select t.id, t.nombre, t.estado into v_p from tmp_rut_idx t where t.rut_norm = v_rut_norm;
    if not found then
      return query select v_rut, null::bigint, null::text,
        'RUT_NO_ENCONTRADO'::text, 'No existe una persona con este RUT en el catálogo.'::text;
      continue;
    end if;
    if v_p.estado is distinct from 'Activo' then
      return query select v_rut, v_p.id, v_p.nombre,
        'PERSONA_NO_ACTIVA'::text, ('Estado de la persona: ' || coalesce(v_p.estado, ''))::text;
      continue;
    end if;
    if v_id_cargo is null then
      return query select v_rut, v_p.id, v_p.nombre,
        'SIN_CARGO'::text, 'La fila no tiene un cargo asignado.'::text;
      continue;
    end if;

    select c.nombre into v_cargo_nombre from public.cargo c where c.id = v_id_cargo;
    begin
      perform public.asociar_persona_proyecto(v_p.id, p_id_proyecto, v_id_cargo, v_cargo_nombre, p_usuario);
      return query select v_rut, v_p.id, v_p.nombre, 'ASOCIADA'::text, null::text;
    exception when others then
      return query select v_rut, v_p.id, v_p.nombre, 'YA_ASOCIADA'::text, sqlerrm::text;
    end;
  end loop;
end;
$$;

grant execute on function public.asociar_personas_proyecto_masivo(bigint, text, jsonb) to authenticated;
revoke execute on function public.asociar_personas_proyecto_masivo(bigint, text, jsonb) from public, anon;
