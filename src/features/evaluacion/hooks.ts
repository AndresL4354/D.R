import { useQuery } from '@tanstack/react-query';
import { getEvaluacion, listEvaluaciones } from './api';

export function useEvaluaciones(params: { page: number; size: number }) {
  return useQuery({
    queryKey: ['evaluacion', 'list', params],
    queryFn: () => listEvaluaciones(params),
    placeholderData: (prev) => prev,
  });
}

export function useEvaluacion(id: number) {
  return useQuery({
    queryKey: ['evaluacion', 'detail', id],
    queryFn: () => getEvaluacion(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}
