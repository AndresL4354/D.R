import { supabase } from '@/lib/supabase';
import type { Tables, TablesUpdate } from '@/types/database.types';

export type Persona = Tables<'persona'>;

export interface ListPersonasParams {
  empresa?: string;
  search?: string;
  page: number;
  size: number;
}

/**
 * Equivalente a PersonaService.query() de Angular, pero contra PostgREST.
 * El filtro por empresa es solo UX: la autoridad real la impone RLS (§9).
 */
export async function listPersonas(params: ListPersonasParams) {
  let q = supabase.from('persona').select('*', { count: 'exact' });
  if (params.search) q = q.ilike('nombre_completo', `%${params.search}%`);

  const from = params.page * params.size;
  const { data, count, error } = await q
    .range(from, from + params.size - 1)
    .order('nombre_completo');

  if (error) throw error;
  return { rows: data ?? [], total: count ?? 0 };
}

export async function updatePersona(p: TablesUpdate<'persona'> & { id: number }) {
  const { error } = await supabase.from('persona').update(p).eq('id', p.id);
  if (error) throw error;
}

// Los RPC de negocio (los 40+ de persona.service.ts: asignarPersonaProyecto,
// guardarBloqueo, oficializar, etc.) se portan en Fase 2 como funciones Postgres
// expuestas vía supabase.rpc(...), y aparecerán tipados en database.types.ts al
// regenerar (npm run gen:types) una vez creados.
