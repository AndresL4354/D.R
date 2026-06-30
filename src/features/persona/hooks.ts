import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listPersonas, updatePersona, type ListPersonasParams } from './api';

export function usePersonas(params: ListPersonasParams) {
  return useQuery({
    queryKey: ['persona', params],
    queryFn: () => listPersonas(params),
    placeholderData: (prev) => prev, // mantiene la página previa mientras carga la nueva
  });
}

export function useUpdatePersona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updatePersona,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persona'] }),
  });
}
