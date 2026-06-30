import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';
import { personasMap, proyectosMap } from '@/lib/lookups';

export type Pasaje = Tables<'pasaje'>;
export type Citacion = Tables<'citacion'>;
export type Hospedaje = Tables<'hospedaje'>;

export async function listPasajes(params: { page: number; size: number }) {
  const from = params.page * params.size;
  const { data, count, error } = await supabase
    .from('pasaje')
    .select('*', { count: 'exact' })
    .range(from, from + params.size - 1)
    .order('fecha_salida', { ascending: false, nullsFirst: false });
  if (error) throw error;
  const rows = data ?? [];
  const [personas, proyectos] = await Promise.all([
    personasMap(rows.map((r) => r.id_persona ?? 0)),
    proyectosMap(rows.map((r) => r.id_proyecto ?? 0)),
  ]);
  return { rows, total: count ?? 0, personas, proyectos };
}

export async function listCitaciones(): Promise<Citacion[]> {
  const { data, error } = await supabase
    .from('citacion')
    .select('*')
    .order('fecha_citacion', { ascending: false, nullsFirst: false })
    .limit(500);
  if (error) throw error;
  return data ?? [];
}

export async function listHospedajes(): Promise<Hospedaje[]> {
  const { data, error } = await supabase
    .from('hospedaje')
    .select('*')
    .order('fecha_ingreso', { ascending: false, nullsFirst: false })
    .limit(500);
  if (error) throw error;
  return data ?? [];
}
