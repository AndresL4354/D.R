import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAuditoria,
  getDespacho,
  getTrabajadores,
  listDespachos,
  updateEstadoDespacho,
  type ListDespachosParams,
} from './api';

export function useDespachos(params: ListDespachosParams) {
  return useQuery({
    queryKey: ['despacho', 'list', params],
    queryFn: () => listDespachos(params),
    placeholderData: (prev) => prev,
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
