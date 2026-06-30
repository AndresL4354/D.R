import { supabase } from '@/lib/supabase';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types';
import type { PersonaInput } from './schema';

export type Persona = Tables<'persona'>;

export interface ListPersonasParams {
  search?: string;
  page: number;
  size: number;
}

/**
 * Lista de personas (PostgREST). El filtro por empresa lo refuerza RLS; aquí es UX.
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

export async function getPersona(id: number): Promise<Persona | null> {
  const { data, error } = await supabase.from('persona').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

/** Convierte '' -> null para no persistir cadenas vacías. */
function toRow(input: PersonaInput): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const [k, v] of Object.entries(input)) out[k] = v === '' ? null : (v as string);
  return out;
}

export async function createPersona(input: PersonaInput): Promise<Persona> {
  const { data, error } = await supabase
    .from('persona')
    .insert(toRow(input) as TablesInsert<'persona'>)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePersona(id: number, input: PersonaInput): Promise<void> {
  const { error } = await supabase
    .from('persona')
    .update(toRow(input) as TablesUpdate<'persona'>)
    .eq('id', id);
  if (error) throw error;
}

// Los RPC de negocio (asignarPersonaProyecto, guardarBloqueo, oficializar, etc.)
// se portan en Fase 2/3 como funciones Postgres expuestas vía supabase.rpc(...).
