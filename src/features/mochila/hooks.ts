import { useQuery } from '@tanstack/react-query';
import {
  getArticulosMochila,
  getInspecciones,
  getMochila,
  listInspeccionesMochila,
  listMochilas,
  listMochilasListado,
  type ListMochilasParams,
} from './api';

export function useMochilas(params: ListMochilasParams) {
  return useQuery({
    queryKey: ['mochila', 'list', params],
    queryFn: () => listMochilas(params),
    placeholderData: (prev) => prev,
  });
}

/** Listado clon (RPC mochilas_listado). */
export function useMochilasListado() {
  return useQuery({ queryKey: ['mochila', 'listado'], queryFn: listMochilasListado });
}

/** Inspecciones clon (RPC inspecciones_mochila). */
export function useInspeccionesMochila(idMochila: number) {
  return useQuery({
    queryKey: ['mochila', 'inspecciones-listado', idMochila],
    queryFn: () => listInspeccionesMochila(idMochila),
    enabled: Number.isFinite(idMochila) && idMochila > 0,
  });
}

export function useMochila(id: number) {
  return useQuery({
    queryKey: ['mochila', 'detail', id],
    queryFn: () => getMochila(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useArticulosMochila(id: number) {
  return useQuery({
    queryKey: ['mochila', 'articulos', id],
    queryFn: () => getArticulosMochila(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useInspecciones(id: number) {
  return useQuery({
    queryKey: ['mochila', 'inspecciones', id],
    queryFn: () => getInspecciones(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}
