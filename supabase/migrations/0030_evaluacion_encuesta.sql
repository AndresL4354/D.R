-- =============================================================================
-- 0030_evaluacion_encuesta.sql — Mutación de Evaluación / encuesta (Fase 3/4).
-- Porta EvaluacionServiceImpl.save()/delete() + lecturas. Las tablas preguntas
-- y respuestas tienen RLS SIN policies (deny-all al front), así que TODO va por
-- RPC SECURITY DEFINER. Paridad:
--   promedio = media aritmética SIMPLE de respuestas[].respuesta (sin redondeo;
--     vacío → 0). Se guarda tal cual (el redondeo del original era solo para PDF).
--   crear   → INSERT evaluacion (fecha=now) + INSERT respuestas (solo id_evaluacion,
--             id_pregunta, respuesta, motivo — el resto de columnas quedan NULL, fiel).
--   editar  → UPDATE evaluacion (preserva fecha existente — corrige el bug de fecha
--             NULL del original) + DIFF/UPSERT de respuestas por id_pregunta (inserta
--             nuevas, actualiza cambiadas conservando id, borra las removidas).
--   eliminar→ DELETE respuestas + DELETE evaluacion (atómico).
-- Gating (endurecido al gating de UI del original, que no gateaba el backend):
--   crear → ROLE_ADMIN/SUPERADMINISTRADOR/SUPERADMINISTRADOR BP/OPERACIONES;
--   editar/eliminar → ROLE_ADMIN. Lecturas → cualquier autenticado.
-- =============================================================================

-- Guardar (crear si p_id IS NULL; editar si no). Devuelve el id de la evaluación.
create or replace function public.evaluacion_guardar(
  p_id bigint,
  p_id_persona bigint,
  p_id_proyecto bigint,
  p_tipo text,
  p_observacion text,
  p_levanta_mano text,
  p_mejora text,
  p_peticion text,
  p_comentario text,
  p_horas_vertical int,
  p_respuestas jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
  v_promedio numeric;
  v_ids_pregunta bigint[];
begin
  if p_id is null then
    if not (has_role('ROLE_ADMIN') or has_role('SUPERADMINISTRADOR') or has_role('SUPERADMINISTRADOR BP') or has_role('OPERACIONES')) then
      raise exception 'permiso denegado para crear la evaluación';
    end if;
  else
    if not has_role('ROLE_ADMIN') then
      raise exception 'permiso denegado para editar la evaluación';
    end if;
  end if;

  -- promedio = media simple de respuestas (sin redondeo); si no hay valores → 0
  select coalesce(avg((elem ->> 'respuesta')::numeric), 0)
    into v_promedio
    from jsonb_array_elements(coalesce(p_respuestas, '[]'::jsonb)) elem
   where nullif(elem ->> 'respuesta', '') is not null;

  if p_id is null then
    insert into public.evaluacion
      (id_persona, id_proyecto, fecha, promedio, tipo, observacion, levanta_mano, mejora, peticion, comentario, horas_vertical)
    values
      (p_id_persona, p_id_proyecto, now(), v_promedio, p_tipo, p_observacion, p_levanta_mano, p_mejora, p_peticion, p_comentario, p_horas_vertical)
    returning id into v_id;
  else
    update public.evaluacion set
      id_persona = p_id_persona,
      id_proyecto = p_id_proyecto,
      promedio = v_promedio,
      tipo = p_tipo,
      observacion = p_observacion,
      levanta_mano = p_levanta_mano,
      mejora = p_mejora,
      peticion = p_peticion,
      comentario = p_comentario,
      horas_vertical = p_horas_vertical
      -- fecha se preserva (no se toca): corrige el quirk de fecha NULL del original
    where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'evaluación no encontrada';
    end if;
  end if;

  -- ids de pregunta entrantes
  select array_agg((elem ->> 'id_pregunta')::bigint)
    into v_ids_pregunta
    from jsonb_array_elements(coalesce(p_respuestas, '[]'::jsonb)) elem;

  -- borrar respuestas removidas (las que ya no vienen en el payload)
  delete from public.respuestas r
   where r.id_evaluacion = v_id
     and (v_ids_pregunta is null or r.id_pregunta <> all(v_ids_pregunta));

  -- actualizar las que cambiaron (conservando id)
  update public.respuestas r
     set respuesta = e.respuesta, motivo = e.motivo
    from (
      select (elem ->> 'id_pregunta')::bigint as id_pregunta,
             elem ->> 'respuesta' as respuesta,
             elem ->> 'motivo' as motivo
      from jsonb_array_elements(coalesce(p_respuestas, '[]'::jsonb)) elem
    ) e
   where r.id_evaluacion = v_id
     and r.id_pregunta = e.id_pregunta
     and (r.respuesta is distinct from e.respuesta or r.motivo is distinct from e.motivo);

  -- insertar las nuevas (id_pregunta aún no presente para esta evaluación)
  insert into public.respuestas (id_evaluacion, id_pregunta, respuesta, motivo)
  select v_id, e.id_pregunta, e.respuesta, e.motivo
  from (
    select (elem ->> 'id_pregunta')::bigint as id_pregunta,
           elem ->> 'respuesta' as respuesta,
           elem ->> 'motivo' as motivo
    from jsonb_array_elements(coalesce(p_respuestas, '[]'::jsonb)) elem
  ) e
  where not exists (
    select 1 from public.respuestas r where r.id_evaluacion = v_id and r.id_pregunta = e.id_pregunta
  );

  return v_id;
end;
$$;

grant execute on function public.evaluacion_guardar(bigint, bigint, bigint, text, text, text, text, text, text, int, jsonb) to authenticated;

-- Eliminar (respuestas hijas primero, luego cabecera; atómico).
create or replace function public.evaluacion_eliminar(p_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_role('ROLE_ADMIN') then
    raise exception 'permiso denegado para eliminar la evaluación';
  end if;
  if not exists (select 1 from public.evaluacion where id = p_id) then
    raise exception 'La evaluacion no existe o ya fue eliminada.';
  end if;
  delete from public.respuestas where id_evaluacion = p_id;
  delete from public.evaluacion where id = p_id;
end;
$$;

grant execute on function public.evaluacion_eliminar(bigint) to authenticated;

-- Preguntas por tipo (preguntas es deny-all → SECURITY DEFINER).
create or replace function public.preguntas_por_tipo(p_tipo text)
returns table(id bigint, pregunta text, tipo text, titulo text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.pregunta::text, p.tipo::text, p.titulo::text
  from public.preguntas p
  where p.tipo = p_tipo
  order by p.id;
$$;

grant execute on function public.preguntas_por_tipo(text) to authenticated;

-- Evaluación existente para (persona, proyecto, tipo) con sus respuestas (para editar/precargar).
create or replace function public.evaluacion_existente(p_id_persona bigint, p_id_proyecto bigint, p_tipo text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', e.id, 'id_persona', e.id_persona, 'id_proyecto', e.id_proyecto, 'fecha', e.fecha,
    'promedio', e.promedio, 'tipo', e.tipo, 'observacion', e.observacion, 'levanta_mano', e.levanta_mano,
    'mejora', e.mejora, 'peticion', e.peticion, 'comentario', e.comentario, 'horas_vertical', e.horas_vertical,
    'respuestas', coalesce(
      (select jsonb_agg(jsonb_build_object('id_pregunta', r.id_pregunta, 'respuesta', r.respuesta, 'motivo', r.motivo) order by r.id_pregunta)
       from public.respuestas r where r.id_evaluacion = e.id), '[]'::jsonb)
  )
  from public.evaluacion e
  where e.id_persona = p_id_persona and e.id_proyecto = p_id_proyecto and e.tipo = p_tipo
  order by e.id
  limit 1;
$$;

grant execute on function public.evaluacion_existente(bigint, bigint, text) to authenticated;

-- Evaluaciones de una persona (por tipo) con respuestas embebidas — vista persona.
create or replace function public.evaluaciones_persona(p_id_persona bigint, p_tipo text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(x.obj order by x.fecha desc nulls last), '[]'::jsonb)
  from (
    select e.fecha,
      jsonb_build_object(
        'id', e.id, 'fecha', e.fecha, 'promedio', e.promedio, 'tipo', e.tipo,
        'id_proyecto', e.id_proyecto,
        'proyecto_nombre', (select p.nombre from public.proyecto p where p.id = e.id_proyecto),
        'cargo', (select pp.cargo from public.persona_proyecto pp where pp.id_persona = e.id_persona and pp.id_proyecto = e.id_proyecto limit 1),
        'respuestas', coalesce(
          (select jsonb_agg(jsonb_build_object('id_pregunta', r.id_pregunta, 'respuesta', r.respuesta, 'motivo', r.motivo) order by r.id_pregunta)
           from public.respuestas r where r.id_evaluacion = e.id), '[]'::jsonb)
      ) obj
    from public.evaluacion e
    where e.id_persona = p_id_persona and e.tipo = p_tipo
  ) x;
$$;

grant execute on function public.evaluaciones_persona(bigint, text) to authenticated;

-- Evaluaciones de un proyecto (por tipo) con persona + respuestas — vista proyecto (solo lectura).
create or replace function public.evaluaciones_proyecto(p_id_proyecto bigint, p_tipo text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(x.obj order by x.fecha desc nulls last), '[]'::jsonb)
  from (
    select e.fecha,
      jsonb_build_object(
        'id', e.id, 'fecha', e.fecha, 'promedio', e.promedio, 'tipo', e.tipo,
        'id_persona', e.id_persona,
        'persona_nombre', (select p.nombre_completo from public.persona p where p.id = e.id_persona),
        'num_id', (select p.numero_id from public.persona p where p.id = e.id_persona),
        'cargo', (select pp.cargo from public.persona_proyecto pp where pp.id_persona = e.id_persona and pp.id_proyecto = e.id_proyecto limit 1),
        'respuestas', coalesce(
          (select jsonb_agg(jsonb_build_object('id_pregunta', r.id_pregunta, 'respuesta', r.respuesta, 'motivo', r.motivo) order by r.id_pregunta)
           from public.respuestas r where r.id_evaluacion = e.id), '[]'::jsonb)
      ) obj
    from public.evaluacion e
    where e.id_proyecto = p_id_proyecto and e.tipo = p_tipo
  ) x;
$$;

grant execute on function public.evaluaciones_proyecto(bigint, text) to authenticated;
