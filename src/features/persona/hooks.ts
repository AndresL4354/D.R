import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cambiarEstadoPersona,
  createPersona,
  eliminarPersona,
  getCargosCatalogo,
  getDocumentosPersona,
  getDocumentosRequeridos,
  getFaenasCatalogo,
  getIdsCargoPersona,
  getPersona,
  getPersonaCargos,
  getPersonaComunas,
  getPersonaEmpresas,
  getServiciosPersona,
  getTiposDocPersona,
  guardarBloqueoPersona,
  listPersonas,
  listPersonasFiltradas,
  updatePersona,
  verificarDocumentos,
  type CategoriaDocumento,
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

// ---- Sub-páginas de la ficha: Servicios / Documentos (0031) ----

/** Historial de servicios del trabajador (RPC persona_servicios). */
export function useServiciosPersona(id: number) {
  return useQuery({
    queryKey: ['persona', 'servicios', id],
    queryFn: () => getServiciosPersona(id),
    enabled: Number.isFinite(id) && id > 0,
    // La página muestra el mensaje literal del original en cada fallo.
    meta: { suppressGlobalError: true },
  });
}

/** ids de cargo de la persona (consultarPersonaCargo del real). */
export function useIdsCargoPersona(id: number) {
  return useQuery({
    queryKey: ['persona', 'ids-cargo', id],
    queryFn: () => getIdsCargoPersona(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

/**
 * Docs subidos + catálogo requerido de UNA categoría (las dos consultas que el
 * original hace por card). El merge con placeholders y el semáforo se hacen en
 * la página (son estado mutable in-place, fiel al componente Angular).
 */
export function useDocumentosCategoria(
  personaId: number,
  categoria: CategoriaDocumento,
  soloPublicos: boolean,
  idsCargo: number[] | undefined,
) {
  return useQuery({
    queryKey: ['persona', 'documentos', personaId, categoria, soloPublicos, idsCargo],
    enabled: Number.isFinite(personaId) && personaId > 0 && idsCargo != null,
    // El original re-consulta TODO en cada entrada a la página (ngOnInit);
    // sin esto, un doc eliminado/editado "resucitaría" del cache al volver.
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const [docsRes, reqRes] = await Promise.allSettled([
        getDocumentosPersona(personaId, categoria, soloPublicos),
        // El original dedupea el catálogo por nombre tras la respuesta.
        getDocumentosRequeridos(categoria, idsCargo ?? [], soloPublicos).then((rs) => {
          const vistos = new Set<string>();
          return rs.filter((r) => {
            const n = r.nombre ?? '';
            if (vistos.has(n)) return false;
            vistos.add(n);
            return true;
          });
        }),
      ]);
      // Fiel al original: si falla el catálogo la card desaparece; si fallan
      // solo los docs de la persona, la card muestra los placeholders.
      if (reqRes.status === 'rejected') throw reqRes.reason;
      return {
        docs: docsRes.status === 'fulfilled' ? docsRes.value : [],
        requeridos: reqRes.value,
      };
    },
  });
}
