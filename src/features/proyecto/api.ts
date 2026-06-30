import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

export type Proyecto = Tables<'proyecto'>;

export const ESTADOS_PROYECTO = ['ACTIVO', 'INACTIVO', 'FINALIZADO'] as const;

export interface ListProyectosParams {
  nombre?: string;
  estado?: string;
  faena?: string;
  page: number;
  size: number;
}

export async function listProyectos(params: ListProyectosParams) {
  let q = supabase.from('proyecto').select('*', { count: 'exact' });
  if (params.nombre) q = q.ilike('nombre', `%${params.nombre}%`);
  if (params.estado) q = q.eq('estado', params.estado);
  if (params.faena) q = q.ilike('faena', `%${params.faena}%`);

  const from = params.page * params.size;
  const { data, count, error } = await q.range(from, from + params.size - 1).order('nombre');
  if (error) throw error;
  return { rows: data ?? [], total: count ?? 0 };
}

export async function getProyecto(id: number): Promise<Proyecto | null> {
  const { data, error } = await supabase.from('proyecto').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export interface PersonalRow {
  id: number;
  persona: string | null;
  cargo: string | null;
  estado: string | null;
  acreditado: boolean | null;
  nuevo: boolean | null;
}

/** Personal asignado al proyecto (persona_proyecto + nombre de persona). */
export async function getPersonalProyecto(idProyecto: number): Promise<PersonalRow[]> {
  const { data, error } = await supabase
    .from('persona_proyecto')
    .select('id, id_persona, cargo, estado, acreditado, nuevo')
    .eq('id_proyecto', idProyecto)
    .order('id', { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const pids = [...new Set(rows.map((r) => r.id_persona).filter((x): x is number => x != null))];
  const personas = new Map<number, string>();
  if (pids.length) {
    const { data: ps } = await supabase.from('persona').select('id, nombre_completo').in('id', pids);
    (ps ?? []).forEach((p) => personas.set(p.id, p.nombre_completo ?? ''));
  }
  return rows.map((r) => ({
    id: r.id,
    persona: r.id_persona != null ? (personas.get(r.id_persona) ?? null) : null,
    cargo: r.cargo,
    estado: r.estado,
    acreditado: r.acreditado,
    nuevo: r.nuevo,
  }));
}
