import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';
import { personasMap, proyectosMap } from '@/lib/lookups';

export type Evaluacion = Tables<'evaluacion'>;

export async function listEvaluaciones(params: { page: number; size: number }) {
  const from = params.page * params.size;
  const { data, count, error } = await supabase
    .from('evaluacion')
    .select('*', { count: 'exact' })
    .range(from, from + params.size - 1)
    .order('fecha', { ascending: false, nullsFirst: false });
  if (error) throw error;
  const rows = data ?? [];
  const [personas, proyectos] = await Promise.all([
    personasMap(rows.map((r) => r.id_persona ?? 0)),
    proyectosMap(rows.map((r) => r.id_proyecto ?? 0)),
  ]);
  return { rows, total: count ?? 0, personas, proyectos };
}

export async function getEvaluacion(id: number) {
  const { data, error } = await supabase.from('evaluacion').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [personas, proyectos] = await Promise.all([
    personasMap([data.id_persona ?? 0]),
    proyectosMap([data.id_proyecto ?? 0]),
  ]);
  return {
    ...data,
    _persona: data.id_persona ? (personas.get(data.id_persona) ?? null) : null,
    _proyecto: data.id_proyecto ? (proyectos.get(data.id_proyecto) ?? null) : null,
  };
}

// =============================================================================
// Encuesta / mutación de evaluación (0030) — todo por RPC SECURITY DEFINER.
// =============================================================================

export interface TipoEvaluacion {
  tipo: 'NORMAL' | 'TECNICO_VERTICAL' | 'SUPERVISOR_VERTICAL';
  label: string;
  escala: { valor: number; texto: string }[];
  umbral: number;
}

/** Tipos + escalas de calificación + umbral de motivo (clon de CONFIG_CALIFICACIONES). */
export const TIPOS_EVALUACION: TipoEvaluacion[] = [
  {
    tipo: 'NORMAL',
    label: 'Seguridad',
    umbral: 4,
    escala: [
      { valor: 0, texto: 'Insuficiente' },
      { valor: 1, texto: 'Muy Bajo' },
      { valor: 2, texto: 'Bajo' },
      { valor: 3, texto: 'Medio Bajo' },
      { valor: 4, texto: 'Medio' },
      { valor: 5, texto: 'Medio Alto' },
      { valor: 6, texto: 'Alto' },
      { valor: 7, texto: 'Muy Alto' },
    ],
  },
  {
    tipo: 'TECNICO_VERTICAL',
    label: 'Técnico Vertical',
    umbral: 3,
    escala: [
      { valor: 1, texto: 'Deficiente' },
      { valor: 2, texto: 'Regular' },
      { valor: 3, texto: 'Bueno' },
      { valor: 4, texto: 'Muy Bueno' },
      { valor: 5, texto: 'Excelente' },
    ],
  },
  {
    tipo: 'SUPERVISOR_VERTICAL',
    label: 'Supervisor Vertical',
    umbral: 2,
    escala: [
      { valor: 1, texto: 'Deficiente' },
      { valor: 2, texto: 'Bueno' },
      { valor: 3, texto: 'Excelente' },
    ],
  },
];

export interface Pregunta {
  id: number;
  pregunta: string | null;
  tipo: string | null;
  titulo: string | null;
}
export interface RespuestaEval {
  id_pregunta: number;
  respuesta: string | null;
  motivo: string | null;
}
export interface EvaluacionExistente {
  id: number;
  fecha: string | null;
  promedio: number | null;
  tipo: string;
  observacion: string | null;
  levanta_mano: string | null;
  mejora: string | null;
  peticion: string | null;
  comentario: string | null;
  horas_vertical: number | null;
  respuestas: RespuestaEval[];
}
export interface EvaluacionFilaRow {
  id: number;
  fecha: string | null;
  promedio: number | null;
  tipo: string;
  id_proyecto?: number;
  proyecto_nombre?: string | null;
  id_persona?: number;
  persona_nombre?: string | null;
  num_id?: string | null;
  cargo?: string | null;
  respuestas: RespuestaEval[];
}

export interface EvaluacionHeaderInput {
  id: number | null;
  idPersona: number;
  idProyecto: number;
  tipo: string;
  observacion: string | null;
  levantaMano: string | null;
  mejora: string | null;
  peticion: string | null;
  comentario: string | null;
  horasVertical: number | null;
}

export async function getPreguntasPorTipo(tipo: string): Promise<Pregunta[]> {
  const { data, error } = await supabase.rpc('preguntas_por_tipo' as never, { p_tipo: tipo } as never);
  if (error) throw error;
  return (data ?? []) as Pregunta[];
}

export async function getEvaluacionExistente(
  idPersona: number,
  idProyecto: number,
  tipo: string,
): Promise<EvaluacionExistente | null> {
  const { data, error } = await supabase.rpc('evaluacion_existente' as never, {
    p_id_persona: idPersona,
    p_id_proyecto: idProyecto,
    p_tipo: tipo,
  } as never);
  if (error) throw error;
  return (data as EvaluacionExistente | null) ?? null;
}

export async function getEvaluacionesPersona(idPersona: number, tipo: string): Promise<EvaluacionFilaRow[]> {
  const { data, error } = await supabase.rpc('evaluaciones_persona' as never, {
    p_id_persona: idPersona,
    p_tipo: tipo,
  } as never);
  if (error) throw error;
  return (data ?? []) as EvaluacionFilaRow[];
}

export async function getEvaluacionesProyecto(idProyecto: number, tipo: string): Promise<EvaluacionFilaRow[]> {
  const { data, error } = await supabase.rpc('evaluaciones_proyecto' as never, {
    p_id_proyecto: idProyecto,
    p_tipo: tipo,
  } as never);
  if (error) throw error;
  return (data ?? []) as EvaluacionFilaRow[];
}

export async function guardarEvaluacion(header: EvaluacionHeaderInput, respuestas: RespuestaEval[]): Promise<number> {
  const { data, error } = await supabase.rpc('evaluacion_guardar' as never, {
    p_id: header.id,
    p_id_persona: header.idPersona,
    p_id_proyecto: header.idProyecto,
    p_tipo: header.tipo,
    p_observacion: header.observacion,
    p_levanta_mano: header.levantaMano,
    p_mejora: header.mejora,
    p_peticion: header.peticion,
    p_comentario: header.comentario,
    p_horas_vertical: header.horasVertical,
    p_respuestas: respuestas,
  } as never);
  if (error) throw error;
  return data as number;
}

export async function eliminarEvaluacion(id: number): Promise<void> {
  const { error } = await supabase.rpc('evaluacion_eliminar' as never, { p_id: id } as never);
  if (error) throw error;
}
