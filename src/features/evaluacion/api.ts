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
