import { useQuery } from '@tanstack/react-query';
import {
  getDetalleEntrega,
  getEntrega,
  getEntregaFiltrosCatalogos,
  listEntregas,
  listEntregasFiltradas,
  resolveEntrega,
  type EntregaListFilters,
  type ListEntregasParams,
} from './api';

export function useEntregas(params: ListEntregasParams) {
  return useQuery({
    queryKey: ['entrega', 'list', params],
    queryFn: () => listEntregas(params),
    placeholderData: (prev) => prev,
  });
}

/** Listado con filtros (RPC entregas_listado). */
export function useEntregasFiltradas(filters: EntregaListFilters, page: number, size: number) {
  return useQuery({
    queryKey: ['entrega', 'listado', filters, page, size],
    queryFn: () => listEntregasFiltradas(filters, page, size),
    placeholderData: (prev) => prev,
  });
}

export function useEntregaFiltrosCatalogos() {
  return useQuery({
    queryKey: ['entrega', 'filtros-catalogos'],
    queryFn: getEntregaFiltrosCatalogos,
    staleTime: 5 * 60 * 1000,
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
