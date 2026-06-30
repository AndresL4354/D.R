import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

export type Proyecto = Tables<'proyecto'>;

export const ESTADOS_PROYECTO = ['ACTIVO', 'INACTIVO', 'FINALIZADO'] as const;

export type ProyectoOrderKey = 'nombre' | 'fecha_inicio' | 'fecha_fin' | 'estado';

export interface ListProyectosParams {
  nombre?: string;
  estado?: string;
  faena?: string;
  fechaInicio?: string;
  fechaFin?: string;
  orderBy?: ProyectoOrderKey;
  asc?: boolean;
  page: number;
  size: number;
}

export async function listProyectos(params: ListProyectosParams) {
  let q = supabase.from('proyecto').select('*', { count: 'exact' });
  if (params.nombre) q = q.ilike('nombre', `%${params.nombre}%`);
  if (params.estado) q = q.eq('estado', params.estado);
  if (params.faena) q = q.eq('faena', params.faena);
  if (params.fechaInicio) q = q.gte('fecha_inicio', params.fechaInicio);
  if (params.fechaFin) q = q.lte('fecha_fin', params.fechaFin);

  const from = params.page * params.size;
  const { data, count, error } = await q
    .order(params.orderBy ?? 'nombre', { ascending: params.asc ?? true })
    .range(from, from + params.size - 1);
  if (error) throw error;
  return { rows: data ?? [], total: count ?? 0 };
}

/** Nombres de faena presentes en proyectos (para el filtro Faena). */
export async function getProyectoFaenas(): Promise<string[]> {
  const { data, error } = await supabase.from('proyecto').select('faena').not('faena', 'is', null);
  if (error) throw error;
  const set = new Set<string>();
  for (const r of data ?? []) {
    const f = (r as { faena: string | null }).faena;
    if (f && f.trim()) set.add(f.trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b));
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
