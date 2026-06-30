import { useQuery } from '@tanstack/react-query';
import {
  getDetalleEntrega,
  getEntrega,
  listEntregas,
  resolveEntrega,
  type ListEntregasParams,
} from './api';

export function useEntregas(params: ListEntregasParams) {
  return useQuery({
    queryKey: ['entrega', 'list', params],
    queryFn: () => listEntregas(params),
    placeholderData: (prev) => prev,
  });
}

export function useEntrega(id: number) {
  return useQuery({
    queryKey: ['entrega', 'detail', id],
    queryFn: async () => {
      const e = await getEntrega(id);
      if (!e) return null;
      const resolved = await resolveEntrega(e);
      return { ...e, _resolved: resolved };
    },
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useDetalleEntrega(idEntrega: number) {
  return useQuery({
    queryKey: ['entrega', 'detalle', idEntrega],
    queryFn: () => getDetalleEntrega(idEntrega),
    enabled: Number.isFinite(idEntrega) && idEntrega > 0,
  });
}
