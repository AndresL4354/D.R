import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

export type EntregaEpp = Tables<'entrega_epp'>;
export type DetalleEntrega = Tables<'detalle_entrega_epp'>;

export interface ListEntregasParams {
  search?: string;
  page: number;
  size: number;
}

async function personasMap(ids: number[]) {
  const m = new Map<number, string>();
  if (ids.length) {
    const { data } = await supabase.from('persona').select('id, nombre_completo').in('id', ids);
    (data ?? []).forEach((r) => m.set(r.id, r.nombre_completo ?? ''));
  }
  return m;
}
async function proyectosMap(ids: number[]) {
  const m = new Map<number, string>();
  if (ids.length) {
    const { data } = await supabase.from('proyecto').select('id, nombre').in('id', ids);
    (data ?? []).forEach((r) => m.set(r.id, r.nombre ?? ''));
  }
  return m;
}
async function faenasMap(ids: number[]) {
  const m = new Map<number, string>();
  if (ids.length) {
    const { data } = await supabase.from('faena').select('id, nombre').in('id', ids);
    (data ?? []).forEach((r) => m.set(r.id, r.nombre ?? ''));
  }
  return m;
}

export async function listEntregas(params: ListEntregasParams) {
  let q = supabase.from('entrega_epp').select('*', { count: 'exact' });
  if (params.search) q = q.ilike('usuario_entrega', `%${params.search}%`);
  const from = params.page * params.size;
  const { data, count, error } = await q
    .range(from, from + params.size - 1)
    .order('fecha_creacion', { ascending: false, nullsFirst: false });
  if (error) throw error;
  const rows = data ?? [];

  const uniq = (arr: (number | null)[]) => [...new Set(arr.filter((x): x is number => x != null))];
  const [personas, proyectos, faenas] = await Promise.all([
    personasMap(uniq(rows.map((r) => r.id_persona))),
    proyectosMap(uniq(rows.map((r) => r.id_proyecto))),
    faenasMap(uniq(rows.map((r) => r.id_faena))),
  ]);
  return { rows, total: count ?? 0, personas, proyectos, faenas };
}

export async function getEntrega(id: number): Promise<EntregaEpp | null> {
  const { data, error } = await supabase.from('entrega_epp').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export interface DetalleRow {
  id: number;
  articulo: string | null;
  cantidad: number | null;
  talla: string | null;
  color: string | null;
  marca: string | null;
  entregado: boolean | null;
}

export async function getDetalleEntrega(idEntrega: number): Promise<DetalleRow[]> {
  const { data, error } = await supabase
    .from('detalle_entrega_epp')
    .select('id, id_articulo, cantidad, talla, color, marca, entregado')
    .eq('id_entrega', idEntrega);
  if (error) throw error;
  const rows = data ?? [];
  const aids = [...new Set(rows.map((r) => r.id_articulo).filter((x): x is number => x != null))];
  const arts = new Map<number, string>();
  if (aids.length) {
    const { data: a } = await supabase.from('articulo').select('id, descripcion').in('id', aids);
    (a ?? []).forEach((x) => arts.set(x.id, x.descripcion ?? ''));
  }
  return rows.map((r) => ({
    id: r.id,
    articulo: r.id_articulo != null ? (arts.get(r.id_articulo) ?? null) : null,
    cantidad: r.cantidad,
    talla: r.talla,
    color: r.color,
    marca: r.marca,
    entregado: r.entregado,
  }));
}

export interface EntregaResolved {
  persona: string | null;
  proyecto: string | null;
  faena: string | null;
}
export async function resolveEntrega(e: EntregaEpp): Promise<EntregaResolved> {
  const [p, pr, f] = await Promise.all([
    personasMap(e.id_persona ? [e.id_persona] : []),
    proyectosMap(e.id_proyecto ? [e.id_proyecto] : []),
    faenasMap(e.id_faena ? [e.id_faena] : []),
  ]);
  return {
    persona: e.id_persona ? (p.get(e.id_persona) ?? null) : null,
    proyecto: e.id_proyecto ? (pr.get(e.id_proyecto) ?? null) : null,
    faena: e.id_faena ? (f.get(e.id_faena) ?? null) : null,
  };
}
