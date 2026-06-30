import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

export type ReporteFlash = Tables<'reporte_flash'>;

export async function listReportesFlash(params: { page: number; size: number }) {
  const from = params.page * params.size;
  const { data, count, error } = await supabase
    .from('reporte_flash')
    .select('*', { count: 'exact' })
    .range(from, from + params.size - 1)
    .order('fecha_incidente', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return { rows: data ?? [], total: count ?? 0 };
}

export async function getReporteFlash(id: number): Promise<ReporteFlash | null> {
  const { data, error } = await supabase
    .from('reporte_flash')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
