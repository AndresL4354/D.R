import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cambiarEstadoPersona,
  createPersona,
  eliminarPersona,
  getCargosCatalogo,
  getFaenasCatalogo,
  getIdsCargoPersona,
  getPersona,
  getPersonaCargos,
  getPersonaComunas,
  getPersonaEmpresas,
  getTiposDocPersona,
  guardarBloqueoPersona,
  listPersonas,
  listPersonasFiltradas,
  updatePersona,
  verificarDocumentos,
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

// ---- Mutaciones de estado / bloqueo / eliminar (Fase 3) ----
export function useCambiarEstadoPersona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado, usuario }: { id: number; estado: string; usuario: string }) =>
      cambiarEstadoPersona(id, estado, usuario),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persona'] }),
  });
}

export function useGuardarBloqueoPersona() {
  return useMutation({
    mutationFn: (args: {
      id: number;
      motivo: string | null;
      descripcion: string | null;
      usuario: string;
      estadoBloqueo: 'BLOQUEADO' | 'DESBLOQUEADO';
    }) => guardarBloqueoPersona(args.id, args.motivo, args.descripcion, args.usuario, args.estadoBloqueo),
  });
}

export function useEliminarPersona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eliminarPersona(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persona'] }),
  });
}

/** Verifica documentos + devuelve inválidos (para el flujo de paso a 'Activo'). */
export async function verificarDocumentosPersona(id: number): Promise<string[]> {
  const ids = await getIdsCargoPersona(id);
  return verificarDocumentos(id, ids);
}
