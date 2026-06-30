import { useQuery } from '@tanstack/react-query';
import {
  getArticulosMochila,
  getInspecciones,
  getMochila,
  listMochilas,
  type ListMochilasParams,
} from './api';

export function useMochilas(params: ListMochilasParams) {
  return useQuery({
    queryKey: ['mochila', 'list', params],
    queryFn: () => listMochilas(params),
    placeholderData: (prev) => prev,
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
