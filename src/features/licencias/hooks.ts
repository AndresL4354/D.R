import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  buscarPersonasLicencia,
  eliminarLicenciaSpot,
  guardarLicenciaSpot,
  listLicenciasSpot,
  type LicenciaSpotInput,
} from './api';

export function useLicenciasSpot() {
  return useQuery({
    queryKey: ['licencias-spot', 'list'],
    queryFn: listLicenciasSpot,
  });
}

export function useGuardarLicenciaSpot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, usuario }: { input: LicenciaSpotInput; usuario: string }) =>
      guardarLicenciaSpot(input, usuario),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['licencias-spot'] }),
  });
}

export function useEliminarLicenciaSpot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eliminarLicenciaSpot(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['licencias-spot'] }),
  });
}

/** Typeahead con debounce vía enabled + staleTime corto. */
export function useBuscarPersonasLicencia(q: string) {
  return useQuery({
    queryKey: ['licencias-spot', 'personas', q],
    queryFn: () => buscarPersonasLicencia(q),
    enabled: q.trim().length >= 2,
    staleTime: 30 * 1000,
  });
}
