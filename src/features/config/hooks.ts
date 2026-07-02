import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCatalogo,
  deleteCatalogo,
  getCatalogo,
  getEmpresaClienteNombres,
  listArticulos,
  listAvisos,
  listCargos,
  listDocumentos,
  listEmpresas,
  listEmpresasCliente,
  listFaenas,
  listTiposEquipo,
  updateCatalogo,
  type CatalogoRow,
  type CatalogoTabla,
} from './api';

export const useFaenas = () => useQuery({ queryKey: ['cfg', 'faena'], queryFn: listFaenas });
export const useCargos = () => useQuery({ queryKey: ['cfg', 'cargo'], queryFn: listCargos });
export const useDocumentos = () =>
  useQuery({ queryKey: ['cfg', 'documento'], queryFn: listDocumentos });
export const useEmpresas = () => useQuery({ queryKey: ['cfg', 'empresa'], queryFn: listEmpresas });
export const useEmpresasCliente = () =>
  useQuery({ queryKey: ['cfg', 'empresa_cliente'], queryFn: listEmpresasCliente });
export const useArticulos = () => useQuery({ queryKey: ['cfg', 'articulo'], queryFn: listArticulos });
export const useTiposEquipo = () =>
  useQuery({ queryKey: ['cfg', 'tipo_equipo'], queryFn: listTiposEquipo });
export const useAvisos = () => useQuery({ queryKey: ['cfg', 'aviso'], queryFn: listAvisos });

// ---- Listados clon ----
import {
  listArticulosFiltro,
  listCargosListado,
  listDocumentosCatalogo,
  listFaenasListado,
  type ArticuloFiltros,
  type DocumentoFiltros,
} from './api';

export const useFaenasListado = (nombre: string | null) =>
  useQuery({ queryKey: ['cfg', 'faena-listado', nombre], queryFn: () => listFaenasListado(nombre) });

export const useCargosListado = (nombre: string | null) =>
  useQuery({ queryKey: ['cfg', 'cargo-listado', nombre], queryFn: () => listCargosListado(nombre) });

export const useDocumentosCatalogo = (canPrivado: boolean, filtros: DocumentoFiltros) =>
  useQuery({
    queryKey: ['cfg', 'documento-catalogo', canPrivado, filtros],
    queryFn: () => listDocumentosCatalogo(canPrivado, filtros),
  });

export const useArticulosFiltro = (filtros: ArticuloFiltros) =>
  useQuery({
    queryKey: ['cfg', 'articulo-filtro', filtros],
    queryFn: () => listArticulosFiltro(filtros),
  });

// ---- CRUD de catálogos (Fase 4) ----
export const useCatalogo = (tabla: CatalogoTabla, id: number) =>
  useQuery({
    queryKey: ['cfg', tabla, 'detail', id],
    queryFn: () => getCatalogo(tabla, id),
    enabled: Number.isFinite(id) && id > 0,
  });

export function useSaveCatalogo(tabla: CatalogoTabla) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, row }: { id: number | null; row: CatalogoRow }) =>
      id != null ? updateCatalogo(tabla, id, row).then(() => id) : createCatalogo(tabla, row),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cfg'] }),
  });
}

export function useDeleteCatalogo(tabla: CatalogoTabla) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCatalogo(tabla, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cfg'] }),
  });
}

export const useEmpresaClienteNombres = () =>
  useQuery({ queryKey: ['cfg', 'empresa-cliente-nombres'], queryFn: getEmpresaClienteNombres, staleTime: 5 * 60 * 1000 });
