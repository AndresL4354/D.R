import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

export type MochilaSpdc = Tables<'mochila_spdc'>;
export type InspeccionMochila = Tables<'inspeccion_mochila'>;

export interface ListMochilasParams {
  page: number;
  size: number;
}

export async function listMochilas(params: ListMochilasParams) {
  const from = params.page * params.size;
  const { data, count, error } = await supabase
    .from('mochila_spdc')
    .select('*', { count: 'exact' })
    .range(from, from + params.size - 1)
    .order('numero', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return { rows: data ?? [], total: count ?? 0 };
}

export async function getMochila(id: number): Promise<MochilaSpdc | null> {
  const { data, error } = await supabase.from('mochila_spdc').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export interface ArticuloMochilaRow {
  id: number;
  descripcion: string | null;
  marca: string | null;
  clasificacion: string | null;
}

export async function getArticulosMochila(idMochila: number): Promise<ArticuloMochilaRow[]> {
  const { data, error } = await supabase
    .from('mochila_articulo_spdc')
    .select('id, id_articulo')
    .eq('id_mochila_spdc', idMochila);
  if (error) throw error;
  const rows = data ?? [];
  const aids = [...new Set(rows.map((r) => r.id_articulo).filter((x): x is number => x != null))];
  const arts = new Map<number, { descripcion: string | null; marca: string | null; clasificacion: string | null }>();
  if (aids.length) {
    const { data: a } = await supabase
      .from('articulo')
      .select('id, descripcion, marca, clasificacion')
      .in('id', aids);
    (a ?? []).forEach((x) =>
      arts.set(x.id, { descripcion: x.descripcion, marca: x.marca, clasificacion: x.clasificacion }),
    );
  }
  return rows.map((r) => {
    const art = r.id_articulo != null ? arts.get(r.id_articulo) : undefined;
    return {
      id: r.id,
      descripcion: art?.descripcion ?? null,
      marca: art?.marca ?? null,
      clasificacion: art?.clasificacion ?? null,
    };
  });
}

export async function getInspecciones(idMochila: number): Promise<InspeccionMochila[]> {
  const { data, error } = await supabase
    .from('inspeccion_mochila')
    .select('*')
    .eq('id_mochila', idMochila)
    .order('fecha', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}
