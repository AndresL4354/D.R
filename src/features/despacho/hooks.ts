import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  agregarTrabajador,
  createDespacho,
  eliminarAccion,
  eliminarDespacho,
  eliminarTrabajador,
  finalizarDespacho,
  getAuditoria,
  getDespacho,
  getDespachoFaenas,
  getDespachoServicios,
  getTrabajadores,
  getTrabajadoresConAcciones,
  listDespachos,
  listDespachosFiltrados,
  puedeEditarEstadosPersonal,
  registrarAccion,
  toggleEstado,
  updateDespacho,
  updateEstadoDespacho,
  type DespachoInput,
  type DespachoListFilters,
  type ListDespachosParams,
} from './api';

export function useDespachos(params: ListDespachosParams) {
  return useQuery({
    queryKey: ['despacho', 'list', params],
    queryFn: () => listDespachos(params),
    placeholderData: (prev) => prev,
  });
}

/** Listado con motor de cumplimiento (RPC despachos_listado). */
export function useDespachosFiltrados(filters: DespachoListFilters, page: number, size: number) {
  return useQuery({
    queryKey: ['despacho', 'listado', filters, page, size],
    queryFn: () => listDespachosFiltrados(filters, page, size),
    placeholderData: (prev) => prev,
  });
}

export function useDespachoFiltrosCatalogos() {
  return useQuery({
    queryKey: ['despacho', 'filtros-catalogos'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [faenas, servicios] = await Promise.all([getDespachoFaenas(), getDespachoServicios()]);
      return { faenas, servicios };
    },
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

// ---- Mutaciones (0027) ----
function useDespachoInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['despacho'] });
}

/** Grilla de acciones por trabajador del despacho. */
export function useTrabajadoresAcciones(idDespacho: number) {
  return useQuery({
    queryKey: ['despacho', 'trabajadores-acciones', idDespacho],
    queryFn: () => getTrabajadoresConAcciones(idDespacho),
    enabled: Number.isFinite(idDespacho) && idDespacho > 0,
  });
}

export function usePuedeEditarEstados() {
  return useQuery({
    queryKey: ['despacho', 'puede-editar-estados'],
    queryFn: puedeEditarEstadosPersonal,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRegistrarAccion() {
  const inv = useDespachoInvalidate();
  return useMutation({
    mutationFn: (a: { idTrabajadorDespacho: number; accion: string; aprobado: boolean; pendiente: boolean; comentario: string | null; usuario: string }) =>
      registrarAccion(a),
    onSuccess: inv,
  });
}

export function useEliminarAccion() {
  const inv = useDespachoInvalidate();
  return useMutation({ mutationFn: (idAccion: number) => eliminarAccion(idAccion), onSuccess: inv });
}

export function useToggleEstado() {
  const inv = useDespachoInvalidate();
  return useMutation({
    mutationFn: (a: { idTrabajadorDespacho: number; accion: string; marcar: boolean; confirmado: boolean }) =>
      toggleEstado(a.idTrabajadorDespacho, a.accion, a.marcar, a.confirmado),
    onSuccess: inv,
  });
}

export function useFinalizarDespacho() {
  const inv = useDespachoInvalidate();
  return useMutation({ mutationFn: (id: number) => finalizarDespacho(id), onSuccess: inv });
}

export function useEliminarDespacho() {
  const inv = useDespachoInvalidate();
  return useMutation({ mutationFn: (id: number) => eliminarDespacho(id), onSuccess: inv });
}

export function useEliminarTrabajador() {
  const inv = useDespachoInvalidate();
  return useMutation({ mutationFn: (idTd: number) => eliminarTrabajador(idTd), onSuccess: inv });
}

export function useCreateDespacho() {
  const inv = useDespachoInvalidate();
  return useMutation({ mutationFn: (input: DespachoInput) => createDespacho(input), onSuccess: inv });
}

export function useUpdateDespacho() {
  const inv = useDespachoInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: DespachoInput }) => updateDespacho(id, input),
    onSuccess: inv,
  });
}

export function useAgregarTrabajador() {
  const inv = useDespachoInvalidate();
  return useMutation({
    mutationFn: ({ idDespacho, idPersona }: { idDespacho: number; idPersona: number }) =>
      agregarTrabajador(idDespacho, idPersona),
    onSuccess: inv,
  });
}
