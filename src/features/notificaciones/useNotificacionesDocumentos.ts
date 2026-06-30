import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface NotificacionesDocumentos {
  /** Documentos vencidos (días <= 0) — campana roja (cantNotificaciones). */
  vencidos: number;
  /** Documentos por vencer (1..45 días) — campana ámbar (cantNotificacionesPorVencer). */
  porVencer: number;
}

/**
 * Conteo de documentos vencidos / por vencer para las campanas del navbar.
 * Replica EXACTO la lógica del backend (PersonaServiceImpl.consultarCantidadPersonasVencimiento):
 *   - personas en estado 'En Revisión' | 'Activo' | 'Reclutamiento'
 *   - documentos con fecha_vencimiento no nula
 *   - vencidos:  días <= 0   ·   por vencer: 1..45 días
 * El alcance por empresa lo aplica RLS (persona_visible) — no se pasa empresa.
 * docnomina hace polling cada 8s; aquí 60s es suficiente para la UI.
 */
export function useNotificacionesDocumentos(enabled = true) {
  return useQuery({
    queryKey: ['notificaciones-documentos'],
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
    queryFn: async (): Promise<NotificacionesDocumentos> => {
      const { data, error } = await supabase.rpc('notificaciones_documentos' as never);
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as
        | { vencidos?: number; por_vencer?: number }
        | undefined;
      return { vencidos: row?.vencidos ?? 0, porVencer: row?.por_vencer ?? 0 };
    },
  });
}
