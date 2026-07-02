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

// ---- Listado con filtros (RPC personas_listado — clon de personasFiltro) ----
export interface PersonaListFilters {
  rut?: string;
  nombre?: string;
  estado?: string | null;
  comuna?: string | null;
  empresa?: string | null;
  idCargo?: number | null;
  idFaena?: number | null;
}

export interface PersonaListRow {
  id: number;
  num_id: string | null;
  nombre_completo: string | null;
  cargos: string;
  comuna: string | null;
  telefono: string | null;
  servicio: string;
  estado_persona: string | null;
}

export async function listPersonasFiltradas(f: PersonaListFilters, page: number, size: number) {
  const { data, error } = await supabase.rpc('personas_listado' as never, {
    p_rut: f.rut?.trim() || null,
    p_nombre: f.nombre?.trim() || null,
    p_estado: f.estado || null,
    p_comuna: f.comuna || null,
    p_empresa: f.empresa || null,
    p_id_cargo: f.idCargo ?? null,
    p_id_faena: f.idFaena ?? null,
    p_limit: size,
    p_offset: page * size,
  } as never);
  if (error) throw error;
  const rows = (data ?? []) as Array<PersonaListRow & { total: number }>;
  const total = rows.length ? Number(rows[0]!.total) : 0;
  return { rows: rows as PersonaListRow[], total };
}

export async function getPersonaComunas(): Promise<string[]> {
  const { data, error } = await supabase.rpc('persona_comunas' as never);
  if (error) throw error;
  return ((data ?? []) as Array<{ comuna: string }>).map((r) => r.comuna).filter(Boolean);
}

export async function getCargosCatalogo(): Promise<{ id: number; nombre: string }[]> {
  const { data, error } = await supabase.from('cargo').select('id, nombre').order('nombre');
  if (error) throw error;
  return (data ?? []).map((c) => ({ id: c.id as number, nombre: (c.nombre as string | null) ?? '' }));
}

export async function getFaenasCatalogo(): Promise<{ id: number; nombre: string }[]> {
  const { data, error } = await supabase.from('faena').select('id, nombre').order('nombre');
  if (error) throw error;
  return (data ?? []).map((c) => ({ id: c.id as number, nombre: (c.nombre as string | null) ?? '' }));
}

export async function getPersona(id: number): Promise<Persona | null> {
  const { data, error } = await supabase.from('persona').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

// =============================================================================
// Mutaciones (Fase 3) — paridad con PersonaServiceImpl (ver 0025).
// =============================================================================

/** Estados del selector "Cambiar estado" (EstadoPersonaEnum del front). */
export const ESTADOS_PERSONA = [
  'Reclutamiento',
  'Exámenes',
  'Capacitaciones',
  'En Revisión',
  'Acreditación',
  'Activo',
  'Inactivo',
  'Desvinculado',
  'Observación',
  'Licencia Médica',
  'Renuncia',
] as const;

/** Áreas de observación del diálogo de bloqueo (hardcode del componente real). */
export const AREAS_OBSERVACION = [
  'OPERACIONES',
  'SSO',
  'RRHH',
  'FINANZAS',
  'ABASTECIMIENTO',
  'LOGISTICA',
  'GERENCIA',
];

/** Cambia estado_persona (con historico + cascada persona_proyecto/despachos si != Activo). */
export async function cambiarEstadoPersona(id: number, estado: string, usuario: string) {
  const { error } = await supabase.rpc('persona_cambiar_estado' as never, {
    p_id: id,
    p_estado: estado,
    p_usuario: usuario,
  } as never);
  if (error) throw error;
}

/** Registra bloqueo/desbloqueo (append-only en bloqueo_persona). */
export async function guardarBloqueoPersona(
  id: number,
  motivo: string | null,
  descripcion: string | null,
  usuario: string,
  estadoBloqueo: 'BLOQUEADO' | 'DESBLOQUEADO',
) {
  const { error } = await supabase.rpc('persona_guardar_bloqueo' as never, {
    p_id: id,
    p_motivo: motivo,
    p_descripcion: descripcion,
    p_usuario: usuario,
    p_estado_bloqueo: estadoBloqueo,
  } as never);
  if (error) throw error;
}

/** Documentos inválidos (requeridos no cargados + vencidos) — gate del paso a 'Activo'. */
export async function verificarDocumentos(id: number, idsCargo: number[]): Promise<string[]> {
  const { data, error } = await supabase.rpc('persona_verificar_documentos' as never, {
    p_id: id,
    p_ids_cargo: idsCargo,
  } as never);
  if (error) throw error;
  return ((data ?? []) as Array<{ documento: string }>).map((r) => r.documento).filter(Boolean);
}

export async function eliminarPersona(id: number) {
  const { error } = await supabase.rpc('persona_eliminar' as never, { p_id: id } as never);
  if (error) throw error;
}

/** ids de cargo de la persona (persona_cargo) — para verificar-documentos. */
export async function getIdsCargoPersona(id: number): Promise<number[]> {
  const { data, error } = await supabase.from('persona_cargo').select('cargo').eq('persona', id);
  if (error) throw error;
  return [...new Set((data ?? []).map((r) => r.cargo).filter((x): x is number => x != null))];
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
