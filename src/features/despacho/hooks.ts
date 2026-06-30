import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAuditoria,
  getDespacho,
  getDespachoFaenas,
  getDespachoServicios,
  getTrabajadores,
  listDespachos,
  listDespachosFiltrados,
  updateEstadoDespacho,
  type DespachoListFilters,
  type ListDespachosParams,
} from './api';

export function useDespachos(params: ListDespachosParams) {
  return useQuery({
    queryKey: ['despacho', 'list', params],
    queryFn: () => listDespachos(params),
    placeholderData: (prev) => prev,
  });
}

/** Listado con motor de cumplimiento (RPC despachos_listado). */
export function useDespachosFiltrados(filters: DespachoListFilters, page: number, size: number) {
  return useQuery({
    queryKey: ['despacho', 'listado', filters, page, size],
    queryFn: () => listDespachosFiltrados(filters, page, size),
    placeholderData: (prev) => prev,
  });
}

export function useDespachoFiltrosCatalogos() {
  return useQuery({
    queryKey: ['despacho', 'filtros-catalogos'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [faenas, servicios] = await Promise.all([getDespachoFaenas(), getDespachoServicios()]);
      return { faenas, servicios };
    },
  });
}

export function useDespacho(id: number) {
  return useQuery({
    queryKey: ['despacho', 'detail', id],
    queryFn: () => getDespacho(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useTrabajadores(idDespacho: number) {
  return useQuery({
    queryKey: ['despacho', 'trabajadores', idDespacho],
    queryFn: () => getTrabajadores(idDespacho),
    enabled: Number.isFinite(idDespacho) && idDespacho > 0,
  });
}

export function useAuditoria(idDespacho: number) {
  return useQuery({
    queryKey: ['despacho', 'auditoria', idDespacho],
    queryFn: () => getAuditoria(idDespacho),
    enabled: Number.isFinite(idDespacho) && idDespacho > 0,
  });
}

export function useUpdateEstadoDespacho() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) => updateEstadoDespacho(id, estado),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['despacho'] }),
  });
}
