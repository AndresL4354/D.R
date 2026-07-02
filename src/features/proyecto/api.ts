import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

export type Proyecto = Tables<'proyecto'>;

export const ESTADOS_PROYECTO = ['ACTIVO', 'INACTIVO', 'FINALIZADO'] as const;

export type ProyectoOrderKey = 'nombre' | 'fecha_inicio' | 'fecha_fin' | 'estado';

export interface ListProyectosParams {
  nombre?: string;
  estado?: string;
  faena?: string;
  fechaInicio?: string;
  fechaFin?: string;
  orderBy?: ProyectoOrderKey;
  asc?: boolean;
  page: number;
  size: number;
}

export async function listProyectos(params: ListProyectosParams) {
  let q = supabase.from('proyecto').select('*', { count: 'exact' });
  if (params.nombre) q = q.ilike('nombre', `%${params.nombre}%`);
  if (params.estado) q = q.eq('estado', params.estado);
  if (params.faena) q = q.eq('faena', params.faena);
  if (params.fechaInicio) q = q.gte('fecha_inicio', params.fechaInicio);
  if (params.fechaFin) q = q.lte('fecha_fin', params.fechaFin);

  const from = params.page * params.size;
  const { data, count, error } = await q
    .order(params.orderBy ?? 'nombre', { ascending: params.asc ?? true })
    .range(from, from + params.size - 1);
  if (error) throw error;
  return { rows: data ?? [], total: count ?? 0 };
}

/** Nombres de faena presentes en proyectos (para el filtro Faena). */
export async function getProyectoFaenas(): Promise<string[]> {
  const { data, error } = await supabase.from('proyecto').select('faena').not('faena', 'is', null);
  if (error) throw error;
  const set = new Set<string>();
  for (const r of data ?? []) {
    const f = (r as { faena: string | null }).faena;
    if (f && f.trim()) set.add(f.trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export async function getProyecto(id: number): Promise<Proyecto | null> {
  const { data, error } = await supabase.from('proyecto').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export interface PersonalRow {
  id: number;
  idPersona: number;
  numId: string | null;
  persona: string | null;
  cargo: string | null;
  idCargo: number | null;
  estado: string | null;
  motivo: string | null;
  acreditado: boolean | null;
  gestionTemprana: boolean | null;
  nuevo: boolean | null;
}

// =============================================================================
// Mutaciones (Fase 3) — paridad con ProyectoServiceImpl (ver 0024).
// =============================================================================

export interface ProyectoInput {
  nombre: string;
  descripcion: string | null;
  faena: string | null;
  idFaena: number | null;
  fechaInicio: string | null;
  fechaFin: string | null;
}

/** Crear servicio — estado ACTIVO, fecha_sistema=now, empresa del usuario (fiel a save()). */
export async function createProyecto(input: ProyectoInput, usuario: string, empresa: string) {
  const { data, error } = await supabase
    .from('proyecto')
    .insert({
      nombre: input.nombre,
      descripcion: input.descripcion,
      faena: input.faena,
      id_faena: input.idFaena,
      fecha_inicio: input.fechaInicio,
      fecha_fin: input.fechaFin,
      estado: 'ACTIVO',
      fecha_sistema: new Date().toISOString(),
      usuario_sistema: usuario,
      razon_social_empresa: empresa,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as number;
}

/** Editar servicio — usuario_sistema se pisa con el editor; empresa se conserva (fiel). */
export async function updateProyecto(id: number, input: ProyectoInput, usuario: string) {
  const { error } = await supabase
    .from('proyecto')
    .update({
      nombre: input.nombre,
      descripcion: input.descripcion,
      faena: input.faena,
      id_faena: input.idFaena,
      fecha_inicio: input.fechaInicio,
      fecha_fin: input.fechaFin,
      usuario_sistema: usuario,
    })
    .eq('id', id);
  if (error) throw error;
}

/** Personas asociadas sin evaluación (gate del flujo Finalizar). */
export async function getEvaluacionesPendientes(id: number): Promise<number> {
  const { data, error } = await supabase.rpc('proyecto_evaluaciones_pendientes' as never, {
    p_id: id,
  } as never);
  if (error) throw error;
  return Number(data ?? 0);
}

export async function finalizarProyecto(id: number) {
  const { error } = await supabase.rpc('proyecto_finalizar' as never, { p_id: id } as never);
  if (error) throw error;
}

export async function activarProyecto(id: number) {
  const { error } = await supabase.rpc('proyecto_activar' as never, { p_id: id } as never);
  if (error) throw error;
}

export async function eliminarProyecto(id: number) {
  const { error } = await supabase.rpc('proyecto_eliminar' as never, { p_id: id } as never);
  if (error) throw error;
}

// ---- Cargos solicitados (Asociar cargos) ----
export interface CargoSolicitado {
  id?: number;
  idCargo: number;
  nombreCargo: string;
  cantidad: number;
  cantidadNoche: number;
  turnosEfectivos: number | null;
}

export async function getCargosProyecto(id: number): Promise<CargoSolicitado[]> {
  const { data, error } = await supabase.rpc('cargos_proyecto_listar' as never, {
    p_id: id,
  } as never);
  if (error) throw error;
  return ((data ?? []) as Array<{
    id: number;
    id_cargo: number;
    nombre_cargo: string | null;
    cantidad: number | null;
    cantidad_noche: number | null;
    turnos_efectivos: number | null;
  }>).map((r) => ({
    id: r.id,
    idCargo: r.id_cargo,
    nombreCargo: r.nombre_cargo ?? '',
    cantidad: r.cantidad ?? 0,
    cantidadNoche: r.cantidad_noche ?? 0,
    turnosEfectivos: r.turnos_efectivos,
  }));
}

/** Full-replace, como guardarCargosProyecto. */
export async function guardarCargosProyecto(id: number, cargos: CargoSolicitado[]) {
  const { error } = await supabase.rpc('cargos_proyecto_guardar' as never, {
    p_id: id,
    p_cargos: cargos.map((c) => ({
      idCargo: c.idCargo,
      nombreCargo: c.nombreCargo,
      cantidad: c.cantidad,
      cantidadNoche: c.cantidadNoche,
      turnosEfectivos: c.turnosEfectivos,
    })),
  } as never);
  if (error) throw error;
}

/** Catálogo de faenas (id + nombre) para el form. */
export async function getFaenasParaForm(): Promise<{ id: number; nombre: string }[]> {
  const { data, error } = await supabase.from('faena').select('id, nombre').order('nombre');
  if (error) throw error;
  return (data ?? []).map((f) => ({ id: f.id as number, nombre: (f.nombre as string | null) ?? '' }));
}

/** Cargos disponibles para una faena (cargo ⋈ faenas_cargo) — para el autocomplete de Asociar cargos. */
export async function getCargosByFaena(idFaena: number): Promise<{ id: number; nombre: string }[]> {
  const { data, error } = await supabase
    .from('faenas_cargo')
    .select('idcargo')
    .eq('idfaena', idFaena);
  if (error) throw error;
  const ids = [...new Set((data ?? []).map((r) => r.idcargo).filter((x): x is number => x != null))];
  if (!ids.length) return [];
  const { data: cargos, error: e2 } = await supabase
    .from('cargo')
    .select('id, nombre')
    .in('id', ids)
    .order('nombre');
  if (e2) throw e2;
  return (cargos ?? []).map((c) => ({ id: c.id as number, nombre: (c.nombre as string | null) ?? '' }));
}

/** Personal asignado al proyecto (persona_proyecto + nombre de persona). Todos los estados. */
export async function getPersonalProyecto(idProyecto: number): Promise<PersonalRow[]> {
  const { data, error } = await supabase
    .from('persona_proyecto')
    .select('id, id_persona, cargo, id_cargo, estado, motivo, acreditado, gestion_temprana, nuevo')
    .eq('id_proyecto', idProyecto)
    .order('id', { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const pids = [...new Set(rows.map((r) => r.id_persona).filter((x): x is number => x != null))];
  const personas = new Map<number, { nombre: string; numId: string | null }>();
  if (pids.length) {
    const { data: ps } = await supabase.from('persona').select('id, nombre_completo, numero_id').in('id', pids);
    (ps ?? []).forEach((p) => personas.set(p.id, { nombre: p.nombre_completo ?? '', numId: p.numero_id ?? null }));
  }
  return rows
    .filter((r) => r.id_persona != null)
    .map((r) => {
      const info = r.id_persona != null ? personas.get(r.id_persona) : undefined;
      return {
        id: r.id,
        idPersona: r.id_persona as number,
        numId: info?.numId ?? null,
        persona: info?.nombre ?? null,
        cargo: r.cargo,
        idCargo: r.id_cargo,
        estado: r.estado,
        motivo: r.motivo,
        acreditado: r.acreditado,
        gestionTemprana: r.gestion_temprana,
        nuevo: r.nuevo,
      };
    });
}

// ---- Mutaciones de asociación (0026) ----

/** Búsqueda de personas Activas para el autocomplete de "Asignar persona". */
export interface PersonaBusqueda {
  id: number;
  nombre: string | null;
  numId: string | null;
  estado: string | null;
}
export async function buscarPersonas(term: string): Promise<PersonaBusqueda[]> {
  const t = term.trim();
  if (!t) return [];
  const { data, error } = await supabase
    .from('persona')
    .select('id, nombre_completo, numero_id, estado_persona')
    .or(`nombre_completo.ilike.%${t}%,numero_id.ilike.%${t}%`)
    .limit(20);
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id as number,
    nombre: (p.nombre_completo as string | null) ?? null,
    numId: (p.numero_id as string | null) ?? null,
    estado: (p.estado_persona as string | null) ?? null,
  }));
}

export async function asociarPersona(
  idPersona: number,
  idProyecto: number,
  idCargo: number,
  cargo: string,
  usuario: string,
) {
  const { error } = await supabase.rpc('asociar_persona_proyecto' as never, {
    p_id_persona: idPersona,
    p_id_proyecto: idProyecto,
    p_id_cargo: idCargo,
    p_cargo: cargo,
    p_usuario: usuario,
  } as never);
  if (error) throw error;
}

/** Devuelve los nombres bloqueados (oficializados en otro proyecto); '' si todos ok. */
export async function oficializarNomina(idProyecto: number, idsPersona: number[]): Promise<string> {
  const { data, error } = await supabase.rpc('oficializar_nomina' as never, {
    p_id_proyecto: idProyecto,
    p_ids_persona: idsPersona,
  } as never);
  if (error) throw error;
  return (data as string | null) ?? '';
}

export async function backupAsociado(idPersona: number, idProyecto: number, motivo: string) {
  const { error } = await supabase.rpc('backup_asociado' as never, {
    p_id_persona: idPersona,
    p_id_proyecto: idProyecto,
    p_motivo: motivo,
  } as never);
  if (error) throw error;
}

export async function eliminarAsociado(idPersona: number, idProyecto: number, motivo: string) {
  const { error } = await supabase.rpc('eliminar_asociado' as never, {
    p_id_persona: idPersona,
    p_id_proyecto: idProyecto,
    p_motivo: motivo,
  } as never);
  if (error) throw error;
}

export async function reasociarPersona(idPersona: number, idProyecto: number, motivo: string) {
  const { error } = await supabase.rpc('reasociar_persona' as never, {
    p_id_persona: idPersona,
    p_id_proyecto: idProyecto,
    p_motivo: motivo,
  } as never);
  if (error) throw error;
}

export async function cambiarCargoAsociado(idPersona: number, idProyecto: number, idCargo: number, cargo: string) {
  const { error } = await supabase.rpc('cambiar_cargo_asociado' as never, {
    p_id_persona: idPersona,
    p_id_proyecto: idProyecto,
    p_id_cargo: idCargo,
    p_cargo: cargo,
  } as never);
  if (error) throw error;
}

export async function acreditarTrabajador(idProyecto: number, idPersona: number) {
  const { error } = await supabase.rpc('acreditar_trabajador' as never, {
    p_id_proyecto: idProyecto,
    p_id_persona: idPersona,
  } as never);
  if (error) throw error;
}

/** Toggle de asistencia a gestión temprana; devuelve el nuevo valor del flag. */
export async function gestionTempranaToggle(idProyecto: number, idPersona: number, usuario: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('gestion_temprana_toggle' as never, {
    p_id_proyecto: idProyecto,
    p_id_persona: idPersona,
    p_usuario: usuario,
  } as never);
  if (error) throw error;
  return Boolean(data);
}

/** ¿La persona está en un despacho de este servicio? (gate de eliminar / texto de backup). */
export async function personaEnDespacho(idPersona: number, idProyecto: number): Promise<boolean> {
  const { data, error } = await supabase.rpc('persona_en_despacho' as never, {
    p_id_persona: idPersona,
    p_id_proyecto: idProyecto,
  } as never);
  if (error) throw error;
  return Boolean(data);
}
