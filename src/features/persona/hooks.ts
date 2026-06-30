import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPersona,
  getPersona,
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
