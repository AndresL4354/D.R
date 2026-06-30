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

/** Cargos asignados a la persona (persona_proyecto) — para subtítulo y campo Cargo. */
export async function getPersonaCargos(id: number): Promise<string[]> {
  const { data, error } = await supabase
    .from('persona_proyecto')
    .select('cargo')
    .eq('id_persona', id);
  if (error) throw error;
  const set = new Set<string>();
  for (const r of data ?? []) {
    const c = (r as { cargo: string | null }).cargo;
    if (c && c.trim()) set.add(c.trim());
  }
  return [...set];
}

/** Empresas asociadas (persona_asociada_empresa). */
export async function getPersonaEmpresas(id: number): Promise<string[]> {
  const { data, error } = await supabase
    .from('persona_asociada_empresa')
    .select('nombre_empresa')
    .eq('id_persona', id);
  if (error) throw error;
  const set = new Set<string>();
  for (const r of data ?? []) {
    const e = (r as { nombre_empresa: string | null }).nombre_empresa;
    if (e && e.trim()) set.add(e.trim());
  }
  return [...set];
}

/** Tipos de documento disponibles para descargar (documentos_persona distinct). */
export async function getTiposDocPersona(id: number): Promise<string[]> {
  const { data, error } = await supabase
    .from('documentos_persona')
    .select('tipo_documento')
    .eq('id_persona', id);
  if (error) throw error;
  const set = new Set<string>();
  for (const r of data ?? []) {
    const t = (r as { tipo_documento: string | null }).tipo_documento;
    if (t && t.trim()) set.add(t.trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

// Los RPC de negocio (asignarPersonaProyecto, guardarBloqueo, oficializar, etc.)
// se portan en Fase 2/3 como funciones Postgres expuestas vía supabase.rpc(...).
