import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

export type Despacho = Tables<'despacho'>;
export type AuditoriaEstado = Tables<'auditoria_estado_despacho'>;

export const ESTADOS_DESPACHO = ['ACTIVO', 'INACTIVO', 'FINALIZADO'] as const;

export interface ListDespachosParams {
  search?: string;
  page: number;
  size: number;
}

/** Lista de despachos + mapa id_proyecto -> nombre (no hay FK; lookup aparte). */
export async function listDespachos(params: ListDespachosParams) {
  let q = supabase.from('despacho').select('*', { count: 'exact' });
  if (params.search) q = q.ilike('nombre_despacho', `%${params.search}%`);
  const from = params.page * params.size;
  const { data, count, error } = await q
    .range(from, from + params.size - 1)
    .order('fecha_despacho', { ascending: false, nullsFirst: false });
  if (error) throw error;

  const rows = data ?? [];
  const ids = [...new Set(rows.map((r) => r.id_proyecto).filter((x): x is number => x != null))];
  const proyectos = new Map<number, string>();
  if (ids.length) {
    const { data: ps } = await supabase.from('proyecto').select('id, nombre').in('id', ids);
    (ps ?? []).forEach((p) => proyectos.set(p.id, p.nombre ?? ''));
  }
  return { rows, total: count ?? 0, proyectos };
}

export async function getDespacho(id: number): Promise<Despacho | null> {
  const { data, error } = await supabase.from('despacho').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export interface TrabajadorRow {
  id: number;
  id_persona: number | null;
  persona: string | null;
}

/** Trabajadores del despacho con el nombre de la persona resuelto. */
export async function getTrabajadores(idDespacho: number): Promise<TrabajadorRow[]> {
  const { data, error } = await supabase
    .from('trabajador_despacho')
    .select('id, id_persona')
    .eq('id_despacho', idDespacho);
  if (error) throw error;
  const tds = data ?? [];
  const pids = [...new Set(tds.map((t) => t.id_persona).filter((x): x is number => x != null))];
  const personas = new Map<number, string>();
  if (pids.length) {
    const { data: ps } = await supabase
      .from('persona')
      .select('id, nombre_completo')
      .in('id', pids);
    (ps ?? []).forEach((p) => personas.set(p.id, p.nombre_completo ?? ''));
  }
  return tds.map((t) => ({
    id: t.id,
    id_persona: t.id_persona,
    persona: t.id_persona != null ? (personas.get(t.id_persona) ?? null) : null,
  }));
}

export async function getAuditoria(idDespacho: number): Promise<AuditoriaEstado[]> {
  const { data, error } = await supabase
    .from('auditoria_estado_despacho')
    .select('*')
    .eq('id_despacho', idDespacho)
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateEstadoDespacho(id: number, estado: string): Promise<void> {
  const { error } = await supabase.from('despacho').update({ estado }).eq('id', id);
  if (error) throw error;
}
