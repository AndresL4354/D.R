import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acreditarTrabajador,
  activarProyecto,
  asociarPersona,
  backupAsociado,
  buscarPersonas,
  cambiarCargoAsociado,
  createProyecto,
  eliminarAsociado,
  eliminarProyecto,
  finalizarProyecto,
  gestionTempranaToggle,
  getCargosByFaena,
  getCargosProyecto,
  getFaenasParaForm,
  getPersonalProyecto,
  getProyecto,
  getProyectoFaenas,
  guardarCargosProyecto,
  listProyectos,
  oficializarNomina,
  reasociarPersona,
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

// ---- Mutaciones de asociación Persona↔Proyecto (0026) ----
export function useBuscarPersonas(term: string) {
  return useQuery({
    queryKey: ['proyecto', 'buscar-personas', term],
    queryFn: () => buscarPersonas(term),
    enabled: term.trim().length >= 2,
    staleTime: 30 * 1000,
  });
}

export function useAsociarPersona() {
  const inv = useProyectoInvalidate();
  return useMutation({
    mutationFn: (a: { idPersona: number; idProyecto: number; idCargo: number; cargo: string; usuario: string }) =>
      asociarPersona(a.idPersona, a.idProyecto, a.idCargo, a.cargo, a.usuario),
    onSuccess: inv,
  });
}

export function useOficializarNomina() {
  const inv = useProyectoInvalidate();
  return useMutation({
    mutationFn: ({ idProyecto, idsPersona }: { idProyecto: number; idsPersona: number[] }) =>
      oficializarNomina(idProyecto, idsPersona),
    onSuccess: inv,
  });
}

export function useBackupAsociado() {
  const inv = useProyectoInvalidate();
  return useMutation({
    mutationFn: (a: { idPersona: number; idProyecto: number; motivo: string }) =>
      backupAsociado(a.idPersona, a.idProyecto, a.motivo),
    onSuccess: inv,
  });
}

export function useEliminarAsociado() {
  const inv = useProyectoInvalidate();
  return useMutation({
    mutationFn: (a: { idPersona: number; idProyecto: number; motivo: string }) =>
      eliminarAsociado(a.idPersona, a.idProyecto, a.motivo),
    onSuccess: inv,
  });
}

export function useReasociarPersona() {
  const inv = useProyectoInvalidate();
  return useMutation({
    mutationFn: (a: { idPersona: number; idProyecto: number; motivo: string }) =>
      reasociarPersona(a.idPersona, a.idProyecto, a.motivo),
    onSuccess: inv,
  });
}

export function useCambiarCargoAsociado() {
  const inv = useProyectoInvalidate();
  return useMutation({
    mutationFn: (a: { idPersona: number; idProyecto: number; idCargo: number; cargo: string }) =>
      cambiarCargoAsociado(a.idPersona, a.idProyecto, a.idCargo, a.cargo),
    onSuccess: inv,
  });
}

export function useAcreditarTrabajador() {
  const inv = useProyectoInvalidate();
  return useMutation({
    mutationFn: ({ idProyecto, idPersona }: { idProyecto: number; idPersona: number }) =>
      acreditarTrabajador(idProyecto, idPersona),
    onSuccess: inv,
  });
}

export function useGestionTempranaToggle() {
  const inv = useProyectoInvalidate();
  return useMutation({
    mutationFn: ({ idProyecto, idPersona, usuario }: { idProyecto: number; idPersona: number; usuario: string }) =>
      gestionTempranaToggle(idProyecto, idPersona, usuario),
    onSuccess: inv,
  });
}
