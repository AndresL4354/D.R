import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  activarProyecto,
  createProyecto,
  eliminarProyecto,
  finalizarProyecto,
  getCargosByFaena,
  getCargosProyecto,
  getFaenasParaForm,
  getPersonalProyecto,
  getProyecto,
  getProyectoFaenas,
  guardarCargosProyecto,
  listProyectos,
  updateProyecto,
  type CargoSolicitado,
  type ListProyectosParams,
  type ProyectoInput,
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

// ---- Mutaciones (Fase 3) ----
function useProyectoInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['proyecto'] });
}

export function useCreateProyecto() {
  const inv = useProyectoInvalidate();
  return useMutation({
    mutationFn: ({ input, usuario, empresa }: { input: ProyectoInput; usuario: string; empresa: string }) =>
      createProyecto(input, usuario, empresa),
    onSuccess: inv,
  });
}

export function useUpdateProyecto() {
  const inv = useProyectoInvalidate();
  return useMutation({
    mutationFn: ({ id, input, usuario }: { id: number; input: ProyectoInput; usuario: string }) =>
      updateProyecto(id, input, usuario),
    onSuccess: inv,
  });
}

export function useFinalizarProyecto() {
  const inv = useProyectoInvalidate();
  return useMutation({ mutationFn: (id: number) => finalizarProyecto(id), onSuccess: inv });
}

export function useActivarProyecto() {
  const inv = useProyectoInvalidate();
  return useMutation({ mutationFn: (id: number) => activarProyecto(id), onSuccess: inv });
}

export function useEliminarProyecto() {
  const inv = useProyectoInvalidate();
  return useMutation({ mutationFn: (id: number) => eliminarProyecto(id), onSuccess: inv });
}

export function useCargosProyecto(id: number) {
  return useQuery({
    queryKey: ['proyecto', 'cargos', id],
    queryFn: () => getCargosProyecto(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useGuardarCargosProyecto() {
  const inv = useProyectoInvalidate();
  return useMutation({
    mutationFn: ({ id, cargos }: { id: number; cargos: CargoSolicitado[] }) =>
      guardarCargosProyecto(id, cargos),
    onSuccess: inv,
  });
}

export function useFaenasParaForm() {
  return useQuery({ queryKey: ['proyecto', 'faenas-form'], queryFn: getFaenasParaForm, staleTime: 5 * 60 * 1000 });
}

export function useCargosByFaena(idFaena: number | null | undefined) {
  return useQuery({
    queryKey: ['proyecto', 'cargos-faena', idFaena],
    queryFn: () => getCargosByFaena(idFaena as number),
    enabled: idFaena != null && idFaena > 0,
    staleTime: 5 * 60 * 1000,
  });
}
