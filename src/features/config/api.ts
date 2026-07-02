import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

const LIMIT = 500;

// ---- Listados clon (con quirks del backend documentados en 0023) ----

export interface FaenaListRow {
  id: number;
  nombre: string | null;
  empresa: string | null;
  descripcion: string | null;
  usuarios: string | null;
}

/** Clon de findAll/faenasFiltro — filtro por nombre = IGUALDAD EXACTA (fiel). */
export async function listFaenasListado(nombre: string | null): Promise<FaenaListRow[]> {
  const { data, error } = await supabase.rpc('faenas_listado' as never, {
    p_nombre: nombre?.trim() || null,
  } as never);
  if (error) throw error;
  return (data ?? []) as FaenaListRow[];
}

export interface CargoListRow {
  id: number;
  nombre: string | null;
  descripcion: string | null;
  documentos: string;
  faenas: string;
}

/** Clon de getAllCargos/cargoFiltro — filtrado: LIKE sensible, sin orden, Faenas vacía. */
export async function listCargosListado(nombre: string | null): Promise<CargoListRow[]> {
  const { data, error } = await supabase.rpc('cargos_listado' as never, {
    p_nombre: nombre?.trim() || null,
  } as never);
  if (error) throw error;
  return (data ?? []) as CargoListRow[];
}

/** Categorías hardcodeadas del componente real ('acreditacion' sin tilde, fiel). */
export const CATEGORIAS_DOCUMENTO = [
  'Documentos generales',
  'Cursos',
  'Documentos de acreditacion',
  'Documentos legales',
];

export interface DocumentoFiltros {
  nombre?: string;
  empresa?: string | null;
  categoria?: string | null;
}

/**
 * Clon de documentos/documentospublicos + documentosFiltro: sin DOC_PRIVADO
 * solo ve públicos; nombre UPPER LIKE, empresa/categoría igualdad exacta,
 * ORDER BY nombre.
 */
export async function listDocumentosCatalogo(
  canPrivado: boolean,
  f: DocumentoFiltros,
): Promise<Tables<'documento'>[]> {
  let q = supabase.from('documento').select('*');
  if (!canPrivado) q = q.eq('privado', false);
  if (f.nombre?.trim()) q = q.ilike('nombre', `%${f.nombre.trim()}%`);
  if (f.empresa) q = q.eq('empresa', f.empresa);
  if (f.categoria) q = q.eq('categoria_documento', f.categoria);
  const { data, error } = await q.order('nombre');
  if (error) throw error;
  return data ?? [];
}

/** Enum frontend real (articulo-enums.model.ts). */
export const CLASIFICACIONES_ARTICULO = ['EPP', 'Ropa Corporativa', 'EPP ALTURA', 'SPDC'];

export interface ArticuloFiltros {
  descripcion?: string;
  clasificacion?: string | null;
}

/** Clon de consultarArticulosFiltro: UPPER LIKE descripción, clasificación exacta, ORDER BY id. */
export async function listArticulosFiltro(f: ArticuloFiltros): Promise<Tables<'articulo'>[]> {
  let q = supabase.from('articulo').select('*');
  if (f.descripcion?.trim()) q = q.ilike('descripcion', `%${f.descripcion.trim()}%`);
  if (f.clasificacion) q = q.eq('clasificacion', f.clasificacion);
  const { data, error } = await q.order('id');
  if (error) throw error;
  return data ?? [];
}

export async function listFaenas(): Promise<Tables<'faena'>[]> {
  const { data, error } = await supabase.from('faena').select('*').order('nombre').limit(LIMIT);
  if (error) throw error;
  return data ?? [];
}

export async function listCargos(): Promise<Tables<'cargo'>[]> {
  const { data, error } = await supabase.from('cargo').select('*').order('nombre').limit(LIMIT);
  if (error) throw error;
  return data ?? [];
}

export async function listDocumentos(): Promise<Tables<'documento'>[]> {
  const { data, error } = await supabase.from('documento').select('*').order('nombre').limit(LIMIT);
  if (error) throw error;
  return data ?? [];
}

export async function listEmpresas(): Promise<Tables<'empresa'>[]> {
  const { data, error } = await supabase
    .from('empresa')
    .select('*')
    .order('razon_social')
    .limit(LIMIT);
  if (error) throw error;
  return data ?? [];
}

export async function listEmpresasCliente(): Promise<Tables<'empresa_cliente'>[]> {
  const { data, error } = await supabase
    .from('empresa_cliente')
    .select('*')
    .order('razon_social')
    .limit(LIMIT);
  if (error) throw error;
  return data ?? [];
}

export async function listArticulos(): Promise<Tables<'articulo'>[]> {
  const { data, error } = await supabase
    .from('articulo')
    .select('*')
    .order('descripcion')
    .limit(LIMIT);
  if (error) throw error;
  return data ?? [];
}

export async function listTiposEquipo(): Promise<Tables<'tipo_equipo'>[]> {
  const { data, error } = await supabase.from('tipo_equipo').select('*').order('nombre').limit(LIMIT);
  if (error) throw error;
  return data ?? [];
}

export async function listAvisos(): Promise<Tables<'aviso_mantenimiento'>[]> {
  const { data, error } = await supabase
    .from('aviso_mantenimiento')
    .select('*')
    .order('fecha_inicio', { ascending: false, nullsFirst: false })
    .limit(LIMIT);
  if (error) throw error;
  return data ?? [];
}
