import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPersona,
  getPersona,
  getPersonaCargos,
  getPersonaEmpresas,
  getTiposDocPersona,
  listPersonas,
  updatePersona,
  type ListPersonasParams,
} from './api';
import type { PersonaInput } from './schema';

export function usePersonas(params: ListPersonasParams) {
  return useQuery({
    queryKey: ['persona', 'list', params],
    queryFn: () => listPersonas(params),
    placeholderData: (prev) => prev,
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
