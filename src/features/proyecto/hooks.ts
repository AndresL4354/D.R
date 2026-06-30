import { useQuery } from '@tanstack/react-query';
import {
  getPersonalProyecto,
  getProyecto,
  getProyectoFaenas,
  listProyectos,
  type ListProyectosParams,
} from './api';

export function useProyectos(params: ListProyectosParams) {
  return useQuery({
    queryKey: ['proyecto', 'list', params],
    queryFn: () => listProyectos(params),
    placeholderData: (prev) => prev,
  });
}

export function useProyectoFaenas() {
  return useQuery({
    queryKey: ['proyecto', 'faenas'],
    queryFn: getProyectoFaenas,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProyecto(id: number) {
  return useQuery({
    queryKey: ['proyecto', 'detail', id],
    queryFn: () => getProyecto(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function usePersonalProyecto(idProyecto: number) {
  return useQuery({
    queryKey: ['proyecto', 'personal', idProyecto],
    queryFn: () => getPersonalProyecto(idProyecto),
    enabled: Number.isFinite(idProyecto) && idProyecto > 0,
  });
}
