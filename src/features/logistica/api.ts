import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';
import { personasMap } from '@/lib/lookups';

export type Pasaje = Tables<'pasaje'>;
export type Citacion = Tables<'citacion'>;
export type Hospedaje = Tables<'hospedaje'>;

export type TipoPasaje = 'Llegada' | 'Retorno';

export interface PasajeRow extends Pasaje {
  personaNombre: string | null;
}

/**
 * Pasajes de un proyecto por tipo — clon de PasajeRepository.consultarPasajesByTipo:
 * SELECT p FROM Pasaje p WHERE p.proyecto.id = :id AND p.tipo = :tipoPasaje
 * (sin orden ni paginación). idProyecto null = fallback global (no existe en el real).
 */
export async function listPasajesProyecto(
  idProyecto: number | null,
  tipo: TipoPasaje,
): Promise<PasajeRow[]> {
  let q = supabase.from('pasaje').select('*').eq('tipo', tipo);
  if (idProyecto != null) q = q.eq('id_proyecto', idProyecto);
  const { data, error } = await q;
  if (error) throw error;
  const rows = data ?? [];
  const personas = await personasMap(rows.map((r) => r.id_persona ?? 0));
  return rows.map((r) => ({
    ...r,
    personaNombre: r.id_persona != null ? (personas.get(r.id_persona) ?? null) : null,
  }));
}

/**
 * Citaciones de un proyecto — clon de CitacionRepository.consultarCitacionesProyecto:
 * SELECT c FROM Citacion c INNER JOIN TrabajadorCitacion tc ON tc.idCitacion = c.id
 * WHERE tc.idProyecto = :idProyecto (dedup con HashSet en el service).
 */
export async function listCitacionesProyecto(idProyecto: number | null): Promise<Citacion[]> {
  if (idProyecto == null) {
    const { data, error } = await supabase.from('citacion').select('*');
    if (error) throw error;
    return data ?? [];
  }
  const { data: tcs, error: e1 } = await supabase
    .from('trabajador_citacion')
    .select('id_citacion')
    .eq('id_proyecto', idProyecto);
  if (e1) throw e1;
  const ids = [...new Set((tcs ?? []).map((t) => t.id_citacion).filter((x): x is number => x != null))];
  if (!ids.length) return [];
  const { data, error } = await supabase.from('citacion').select('*').in('id', ids);
  if (error) throw error;
  return data ?? [];
}

/**
 * Hospedajes de un proyecto — clon de HospedajeRepository.consultarHospedajesProyecto:
 * SELECT h FROM Hospedaje h INNER JOIN TrabajadorHospedaje th ON th.idHospedaje = h.id
 * WHERE th.idProyecto = :idProyecto (dedup con HashSet en el service).
 */
export async function listHospedajesProyecto(idProyecto: number | null): Promise<Hospedaje[]> {
  if (idProyecto == null) {
    const { data, error } = await supabase.from('hospedaje').select('*');
    if (error) throw error;
    return data ?? [];
  }
  const { data: ths, error: e1 } = await supabase
    .from('trabajador_hospedaje')
    .select('id_hospedaje')
    .eq('id_proyecto', idProyecto);
  if (e1) throw e1;
  const ids = [...new Set((ths ?? []).map((t) => t.id_hospedaje).filter((x): x is number => x != null))];
  if (!ids.length) return [];
  const { data, error } = await supabase.from('hospedaje').select('*').in('id', ids);
  if (error) throw error;
  return data ?? [];
}
