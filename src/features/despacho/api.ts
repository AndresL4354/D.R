import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

export type Despacho = Tables<'despacho'>;
export type AuditoriaEstado = Tables<'auditoria_estado_despacho'>;

export const ESTADOS_DESPACHO = ['ACTIVO', 'INACTIVO', 'FINALIZADO'] as const;

export interface ListDespachosParams {
  search?: string;
  page: number;
  size: number;
}

/** Lista de despachos + mapa id_proyecto -> nombre (no hay FK; lookup aparte). */
export async function listDespachos(params: ListDespachosParams) {
  let q = supabase.from('despacho').select('*', { count: 'exact' });
  if (params.search) q = q.ilike('nombre_despacho', `%${params.search}%`);
  const from = params.page * params.size;
  const { data, count, error } = await q
    .range(from, from + params.size - 1)
    .order('fecha_despacho', { ascending: false, nullsFirst: false });
  if (error) throw error;

  const rows = data ?? [];
  const ids = [...new Set(rows.map((r) => r.id_proyecto).filter((x): x is number => x != null))];
  const proyectos = new Map<number, string>();
  if (ids.length) {
    const { data: ps } = await supabase.from('proyecto').select('id, nombre').in('id', ids);
    (ps ?? []).forEach((p) => proyectos.set(p.id, p.nombre ?? ''));
  }
  return { rows, total: count ?? 0, proyectos };
}

// ---- Listado con motor de cumplimiento (RPC despachos_listado, Fase 3) ----
export interface DespachoListFilters {
  idFaena?: number | null;
  idProyecto?: number | null;
  estado?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
}

export interface DespachoListRow {
  id: number;
  proyecto_nombre: string | null;
  faena: string | null;
  nombre_despacho: string | null;
  fecha_despacho: string | null;
  estado: string | null;
  total_personas: number;
  acreditados: number;
  asistencia: number;
  sso: number;
  bodega: number;
  cursos: number;
  transporte: number;
  despachados: number;
  cumplimiento: number;
}

export async function listDespachosFiltrados(f: DespachoListFilters, page: number, size: number) {
  const { data, error } = await supabase.rpc('despachos_listado' as never, {
    p_id_faena: f.idFaena ?? null,
    p_id_proyecto: f.idProyecto ?? null,
    p_estado: f.estado || null,
    p_fecha_inicio: f.fechaInicio || null,
    p_fecha_fin: f.fechaFin ? `${f.fechaFin}T23:59:59` : null,
    p_limit: size,
    p_offset: page * size,
  } as never);
  if (error) throw error;
  const rows = (data ?? []) as Array<DespachoListRow & { total: number }>;
  const total = rows.length ? Number(rows[0]!.total) : 0;
  return { rows: rows as DespachoListRow[], total };
}

export async function getDespachoFaenas(): Promise<{ id: number; nombre: string }[]> {
  const { data, error } = await supabase.from('faena').select('id, nombre').order('nombre');
  if (error) throw error;
  return (data ?? []).map((f) => ({ id: f.id as number, nombre: (f.nombre as string | null) ?? '' }));
}

export async function getDespachoServicios(): Promise<{ id: number; nombre: string }[]> {
  const { data, error } = await supabase.from('proyecto').select('id, nombre').order('nombre');
  if (error) throw error;
  return (data ?? []).map((p) => ({ id: p.id as number, nombre: (p.nombre as string | null) ?? '' }));
}

export async function getDespacho(id: number): Promise<Despacho | null> {
  const { data, error } = await supabase.from('despacho').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export interface TrabajadorRow {
  id: number;
  id_persona: number | null;
  persona: string | null;
}

/** Trabajadores del despacho con el nombre de la persona resuelto. */
export async function getTrabajadores(idDespacho: number): Promise<TrabajadorRow[]> {
  const { data, error } = await supabase
    .from('trabajador_despacho')
    .select('id, id_persona')
    .eq('id_despacho', idDespacho);
  if (error) throw error;
  const tds = data ?? [];
  const pids = [...new Set(tds.map((t) => t.id_persona).filter((x): x is number => x != null))];
  const personas = new Map<number, string>();
  if (pids.length) {
    const { data: ps } = await supabase
      .from('persona')
      .select('id, nombre_completo')
      .in('id', pids);
    (ps ?? []).forEach((p) => personas.set(p.id, p.nombre_completo ?? ''));
  }
  return tds.map((t) => ({
    id: t.id,
    id_persona: t.id_persona,
    persona: t.id_persona != null ? (personas.get(t.id_persona) ?? null) : null,
  }));
}

/** Fila de auditoría: cambio de estado del despacho o edición de una acción (0027). */
export interface AuditoriaRow {
  id: number;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  columna: string | null;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  rut: string | null;
  usuario: string | null;
  fecha: string | null;
}

export async function getAuditoria(idDespacho: number): Promise<AuditoriaRow[]> {
  const { data, error } = await supabase
    .from('auditoria_estado_despacho')
    .select('*')
    .eq('id_despacho', idDespacho)
    .order('fecha', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AuditoriaRow[];
}

export async function updateEstadoDespacho(id: number, estado: string): Promise<void> {
  const { error } = await supabase.from('despacho').update({ estado }).eq('id', id);
  if (error) throw error;
}

// =============================================================================
// Mutaciones de Despacho (0027) — paridad con DespachoServiceImpl.
// =============================================================================

/** Acciones editables por trabajador (AccionDespachoEnum, sin 'Acreditacion'). */
export const ACCIONES_DESPACHO = ['Asistencia', 'SSO', 'Bodega', 'Cursos', 'Transporte', 'En Faena'] as const;
export type AccionDespacho = (typeof ACCIONES_DESPACHO)[number];

/** Sub-rol DESPACHO_* que habilita registrar cada categoría (+ DESPACHO_ADMINISTRADOR/ROLE_ADMIN). */
export const ROL_POR_ACCION: Record<AccionDespacho, string> = {
  Asistencia: 'DESPACHO_RECEPCION',
  SSO: 'DESPACHO_SSO',
  Bodega: 'DESPACHO_BODEGA',
  Cursos: 'DESPACHO_CURSOS',
  Transporte: 'DESPACHO_TRANSPORTE',
  'En Faena': 'DESPACHO_ACREDITACION',
};

export interface AccionEstado {
  id: number;
  aprobado: boolean | null;
  pendiente: boolean | null;
  comentario: string | null;
}
export interface TrabajadorAccionesRow {
  id: number;
  idPersona: number | null;
  persona: string | null;
  numId: string | null;
  acreditado: boolean;
  acciones: Record<string, AccionEstado>;
}

/** Trabajadores del despacho + su grilla de acciones (accion_despacho). */
export async function getTrabajadoresConAcciones(idDespacho: number): Promise<TrabajadorAccionesRow[]> {
  const { data: tds, error } = await supabase
    .from('trabajador_despacho')
    .select('id, id_persona')
    .eq('id_despacho', idDespacho)
    .order('id');
  if (error) throw error;
  const rows = tds ?? [];
  const tdIds = rows.map((t) => t.id);

  let acciones: Array<{
    id: number;
    id_trabajador_despacho: number | null;
    accion: string | null;
    aprobado: boolean | null;
    pendiente: boolean | null;
    comentario: string | null;
  }> = [];
  if (tdIds.length) {
    const { data, error: e2 } = await supabase
      .from('accion_despacho')
      .select('id, id_trabajador_despacho, accion, aprobado, pendiente, comentario')
      .in('id_trabajador_despacho', tdIds);
    if (e2) throw e2;
    acciones = data ?? [];
  }

  const pids = [...new Set(rows.map((t) => t.id_persona).filter((x): x is number => x != null))];
  const personas = new Map<number, { nombre: string; numId: string | null }>();
  if (pids.length) {
    const { data: ps } = await supabase.from('persona').select('id, nombre_completo, numero_id').in('id', pids);
    (ps ?? []).forEach((p) => personas.set(p.id, { nombre: p.nombre_completo ?? '', numId: p.numero_id ?? null }));
  }

  return rows.map((t) => {
    const acc: Record<string, AccionEstado> = {};
    for (const a of acciones) {
      if (a.id_trabajador_despacho === t.id && a.accion) {
        acc[a.accion] = { id: a.id, aprobado: a.aprobado, pendiente: a.pendiente, comentario: a.comentario };
      }
    }
    const info = t.id_persona != null ? personas.get(t.id_persona) : undefined;
    return {
      id: t.id,
      idPersona: t.id_persona,
      persona: info?.nombre ?? null,
      numId: info?.numId ?? null,
      acreditado: Boolean(acc['Acreditacion']?.aprobado),
      acciones: acc,
    };
  });
}

/** ¿El usuario actual es el editor autorizado del toggle in-line? (match por email) */
export async function puedeEditarEstadosPersonal(): Promise<boolean> {
  const { data, error } = await supabase.rpc('puede_editar_estados_personal' as never);
  if (error) return false;
  return Boolean(data);
}

export async function registrarAccion(args: {
  idTrabajadorDespacho: number;
  accion: string;
  aprobado: boolean;
  pendiente: boolean;
  comentario: string | null;
  usuario: string;
}) {
  const { error } = await supabase.rpc('despacho_registrar_accion' as never, {
    p_id_trabajador_despacho: args.idTrabajadorDespacho,
    p_accion: args.accion,
    p_aprobado: args.aprobado,
    p_pendiente: args.pendiente,
    p_comentario: args.comentario,
    p_usuario: args.usuario,
  } as never);
  if (error) throw error;
}

export async function eliminarAccion(idAccion: number) {
  const { error } = await supabase.rpc('despacho_eliminar_accion' as never, { p_id_accion: idAccion } as never);
  if (error) throw error;
}

export async function toggleEstado(idTrabajadorDespacho: number, accion: string, marcar: boolean, confirmado: boolean) {
  const { error } = await supabase.rpc('despacho_toggle_estado' as never, {
    p_id_trabajador_despacho: idTrabajadorDespacho,
    p_accion: accion,
    p_marcar: marcar,
    p_confirmado: confirmado,
  } as never);
  if (error) throw error;
}

export async function finalizarDespacho(id: number) {
  const { error } = await supabase.rpc('despacho_finalizar' as never, { p_id: id } as never);
  if (error) throw error;
}

export async function eliminarDespacho(id: number) {
  const { error } = await supabase.rpc('despacho_eliminar' as never, { p_id: id } as never);
  if (error) throw error;
}

export async function eliminarTrabajador(idTrabajadorDespacho: number) {
  const { error } = await supabase.rpc('despacho_eliminar_trabajador' as never, {
    p_id_trabajador_despacho: idTrabajadorDespacho,
  } as never);
  if (error) throw error;
}

// ---- Crear / editar despacho + agregar trabajador (PostgREST, RLS = tiene_rol_despacho) ----
export interface DespachoInput {
  nombreDespacho: string;
  estado: string;
  fechaDespacho: string | null; // ISO
  idProyecto: number | null;
}

export async function createDespacho(input: DespachoInput): Promise<number> {
  const { data, error } = await supabase
    .from('despacho')
    .insert({
      nombre_despacho: input.nombreDespacho,
      estado: input.estado,
      fecha_despacho: input.fechaDespacho,
      id_proyecto: input.idProyecto,
    } as never)
    .select('id')
    .single();
  if (error) throw error;
  return data.id as number;
}

export async function updateDespacho(id: number, input: DespachoInput): Promise<void> {
  const { error } = await supabase
    .from('despacho')
    .update({
      nombre_despacho: input.nombreDespacho,
      estado: input.estado,
      fecha_despacho: input.fechaDespacho,
      id_proyecto: input.idProyecto,
    } as never)
    .eq('id', id);
  if (error) throw error;
}

export async function agregarTrabajador(idDespacho: number, idPersona: number): Promise<void> {
  const { error } = await supabase
    .from('trabajador_despacho')
    .insert({ id_despacho: idDespacho, id_persona: idPersona });
  if (error) throw error;
}
