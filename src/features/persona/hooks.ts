import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPersona,
  getCargosCatalogo,
  getFaenasCatalogo,
  getPersona,
  getPersonaCargos,
  getPersonaComunas,
  getPersonaEmpresas,
  getTiposDocPersona,
  listPersonas,
  listPersonasFiltradas,
  updatePersona,
  type ListPersonasParams,
  type PersonaListFilters,
} from './api';
import type { PersonaInput } from './schema';

export function usePersonas(params: ListPersonasParams) {
  return useQuery({
    queryKey: ['persona', 'list', params],
    queryFn: () => listPersonas(params),
    placeholderData: (prev) => prev,
  });
}

/** Listado con filtros (RPC personas_listado). */
export function usePersonasFiltradas(filters: PersonaListFilters, page: number, size: number) {
  return useQuery({
    queryKey: ['persona', 'listado', filters, page, size],
    queryFn: () => listPersonasFiltradas(filters, page, size),
    placeholderData: (prev) => prev,
  });
}

/** Catálogos de los filtros del listado (comunas, cargos, faenas). */
export function usePersonaFiltrosCatalogos() {
  return useQuery({
    queryKey: ['persona', 'filtros-catalogos'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [comunas, cargos, faenas] = await Promise.all([
        getPersonaComunas(),
        getCargosCatalogo(),
        getFaenasCatalogo(),
      ]);
      return { comunas, cargos, faenas };
    },
  });
}

export function usePersona(id: number) {
  return useQuery({
    queryKey: ['persona', 'detail', id],
    queryFn: () => getPersona(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

/** Datos complementarios de la ficha: cargos, empresas asociadas y tipos de documento. */
export function usePersonaExtras(id: number) {
  return useQuery({
    queryKey: ['persona', 'extras', id],
    enabled: Number.isFinite(id) && id > 0,
    queryFn: async () => {
      const [cargos, empresas, tiposDoc] = await Promise.all([
        getPersonaCargos(id),
        getPersonaEmpresas(id),
        getTiposDocPersona(id),
      ]);
      return { cargos, empresas, tiposDoc };
    },
  });
}

export function useCreatePersona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PersonaInput) => createPersona(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persona'] }),
  });
}

export function useUpdatePersona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: PersonaInput }) => updatePersona(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persona'] }),
  });
}
