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

// ---- Listado con motor de cumplimiento (RPC despachos_listado, Fase 3) ----
export interface DespachoListFilters {
  idFaena?: number | null;
  idProyecto?: number | null;
  estado?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
}

export interface DespachoListRow {
  id: number;
  proyecto_nombre: string | null;
  faena: string | null;
  nombre_despacho: string | null;
  fecha_despacho: string | null;
  estado: string | null;
  total_personas: number;
  acreditados: number;
  asistencia: number;
  sso: number;
  bodega: number;
  cursos: number;
  transporte: number;
  despachados: number;
  cumplimiento: number;
}

export async function listDespachosFiltrados(f: DespachoListFilters, page: number, size: number) {
  const { data, error } = await supabase.rpc('despachos_listado' as never, {
    p_id_faena: f.idFaena ?? null,
    p_id_proyecto: f.idProyecto ?? null,
    p_estado: f.estado || null,
    p_fecha_inicio: f.fechaInicio || null,
    p_fecha_fin: f.fechaFin ? `${f.fechaFin}T23:59:59` : null,
    p_limit: size,
    p_offset: page * size,
  } as never);
  if (error) throw error;
  const rows = (data ?? []) as Array<DespachoListRow & { total: number }>;
  const total = rows.length ? Number(rows[0]!.total) : 0;
  return { rows: rows as DespachoListRow[], total };
}

export async function getDespachoFaenas(): Promise<{ id: number; nombre: string }[]> {
  const { data, error } = await supabase.from('faena').select('id, nombre').order('nombre');
  if (error) throw error;
  return (data ?? []).map((f) => ({ id: f.id as number, nombre: (f.nombre as string | null) ?? '' }));
}

export async function getDespachoServicios(): Promise<{ id: number; nombre: string }[]> {
  const { data, error } = await supabase.from('proyecto').select('id, nombre').order('nombre');
  if (error) throw error;
  return (data ?? []).map((p) => ({ id: p.id as number, nombre: (p.nombre as string | null) ?? '' }));
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
