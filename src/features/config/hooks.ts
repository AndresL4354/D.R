import { useQuery } from '@tanstack/react-query';
import {
  listArticulos,
  listAvisos,
  listCargos,
  listDocumentos,
  listEmpresas,
  listEmpresasCliente,
  listFaenas,
  listTiposEquipo,
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
