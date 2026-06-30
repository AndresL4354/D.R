import { supabase } from './supabase';

/** Mapa id -> nombre_completo de personas (para resolver FKs sin embeds). */
export async function personasMap(ids: number[]): Promise<Map<number, string>> {
  const m = new Map<number, string>();
  const uniq = [...new Set(ids.filter((x): x is number => x != null))];
  if (uniq.length) {
    const { data } = await supabase.from('persona').select('id, nombre_completo').in('id', uniq);
    (data ?? []).forEach((r) => m.set(r.id, r.nombre_completo ?? ''));
  }
  return m;
}

/** Mapa id -> nombre de proyectos. */
export async function proyectosMap(ids: number[]): Promise<Map<number, string>> {
  const m = new Map<number, string>();
  const uniq = [...new Set(ids.filter((x): x is number => x != null))];
  if (uniq.length) {
    const { data } = await supabase.from('proyecto').select('id, nombre').in('id', uniq);
    (data ?? []).forEach((r) => m.set(r.id, r.nombre ?? ''));
  }
  return m;
}
