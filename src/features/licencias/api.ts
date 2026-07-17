import { supabase } from '@/lib/supabase';

/**
 * Licencias Spot (dominio nuevo del original, commits e46b3b5/983ccf3):
 * licencias MEL + Gesta del personal Spot. El estado MEL se calcula EN VIVO
 * en la RPC (fuente única): SIN_FECHA / VENCIDA / POR_VENCER (≤30d) / VIGENTE.
 */

export const ESTADOS_MEL = ['VIGENTE', 'POR_VENCER', 'VENCIDA', 'SIN_FECHA'] as const;

/** Roles que pueden editar (EDIT_AUTH del Resource; RECLUTADOR es authority nueva). */
export const ROLES_EDITAR_LICENCIAS = ['ROLE_ADMIN', 'SUPERADMINISTRADOR', 'RECLUTADOR'];

export interface LicenciaSpotRow {
  id: number;
  rut: string | null;
  nombre: string | null;
  cargo: string | null;
  vencimiento_mel: string | null;
  vencimiento_texto: string | null;
  licencia_gesta: boolean | null;
  observaciones: string | null;
  updated_at: string | null;
  updated_by: string | null;
  estado_mel: string;
  dias_restantes: number | null;
  puede_conducir: boolean;
  ciudad: string | null;
}

export interface ResumenLicencias {
  total: number;
  vigentes: number;
  porVencer: number;
  vencidas: number;
  sinFecha: number;
  conGesta: number;
  sinGesta: number;
}

export interface LicenciaSpotInput {
  id?: number | null;
  rut?: string | null;
  nombre?: string | null;
  cargo?: string | null;
  vencimiento_mel?: string | null;
  vencimiento_texto?: string | null;
  licencia_gesta?: boolean | null;
  observaciones?: string | null;
}

export async function listLicenciasSpot(): Promise<LicenciaSpotRow[]> {
  const { data, error } = await supabase.rpc('licencias_spot_listar' as never);
  if (error) throw error;
  return (data ?? []) as LicenciaSpotRow[];
}

export async function guardarLicenciaSpot(input: LicenciaSpotInput, usuario: string): Promise<number> {
  const { data, error } = await supabase.rpc('licencia_spot_guardar' as never, {
    p_id: input.id ?? null,
    p_rut: input.rut ?? null,
    p_nombre: input.nombre ?? null,
    p_cargo: input.cargo ?? null,
    p_vencimiento_mel: input.vencimiento_mel || null,
    p_vencimiento_texto: input.vencimiento_texto ?? null,
    p_licencia_gesta: input.licencia_gesta ?? false,
    p_observaciones: input.observaciones ?? null,
    p_usuario: usuario,
  } as never);
  if (error) throw error;
  return Number(data);
}

export async function eliminarLicenciaSpot(id: number) {
  const { error } = await supabase.rpc('licencia_spot_eliminar' as never, { p_id: id } as never);
  if (error) throw error;
}

export interface PersonaBusquedaLicencia {
  rut: string;
  nombre: string | null;
}

/** Typeahead de personas del sistema (≥2 caracteres, límite 20, dedup por RUT). */
export async function buscarPersonasLicencia(q: string): Promise<PersonaBusquedaLicencia[]> {
  const { data, error } = await supabase.rpc('licencias_spot_buscar_personas' as never, {
    p_q: q,
  } as never);
  if (error) throw error;
  return (data ?? []) as PersonaBusquedaLicencia[];
}
