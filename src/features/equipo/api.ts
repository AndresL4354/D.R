import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

export type Equipo = Tables<'equipo'>;

export interface EquipoRow {
  id: number;
  tipoEquipo: string | null;
  persona: string | null;
  tipoPropiedad: string | null;
}

/**
 * Listado de equipos — clon de EquipoServiceImpl.findAll(): findAll() sin
 * filtro, sin sort y sin paginación; el mapper resuelve tipoEquipo.nombre y
 * personaAsignada.nombreCompleto.
 */
export async function listEquipos(): Promise<EquipoRow[]> {
  const { data, error } = await supabase
    .from('equipo')
    .select('id, id_tipo_equipo, id_persona_asignada, tipo_propiedad');
  if (error) throw error;
  const rows = data ?? [];

  const uniq = (arr: (number | null)[]) => [...new Set(arr.filter((x): x is number => x != null))];
  const [tipos, personas] = await Promise.all([
    (async () => {
      const ids = uniq(rows.map((r) => r.id_tipo_equipo));
      const m = new Map<number, string>();
      if (ids.length) {
        const { data: ts } = await supabase.from('tipo_equipo').select('id, nombre').in('id', ids);
        (ts ?? []).forEach((t) => m.set(t.id as number, (t.nombre as string | null) ?? ''));
      }
      return m;
    })(),
    (async () => {
      const ids = uniq(rows.map((r) => r.id_persona_asignada));
      const m = new Map<number, string>();
      if (ids.length) {
        const { data: ps } = await supabase.from('persona').select('id, nombre_completo').in('id', ids);
        (ps ?? []).forEach((p) => m.set(p.id, p.nombre_completo ?? ''));
      }
      return m;
    })(),
  ]);

  return rows.map((r) => ({
    id: r.id,
    tipoEquipo: r.id_tipo_equipo != null ? (tipos.get(r.id_tipo_equipo) ?? null) : null,
    persona: r.id_persona_asignada != null ? (personas.get(r.id_persona_asignada) ?? null) : null,
    tipoPropiedad: r.tipo_propiedad,
  }));
}
