import { useQuery } from '@tanstack/react-query';
import {
  listCargos,
  listDocumentos,
  listEmpresas,
  listEmpresasCliente,
  listFaenas,
} from './api';

export const useFaenas = () => useQuery({ queryKey: ['cfg', 'faena'], queryFn: listFaenas });
export const useCargos = () => useQuery({ queryKey: ['cfg', 'cargo'], queryFn: listCargos });
export const useDocumentos = () =>
  useQuery({ queryKey: ['cfg', 'documento'], queryFn: listDocumentos });
export const useEmpresas = () => useQuery({ queryKey: ['cfg', 'empresa'], queryFn: listEmpresas });
export const useEmpresasCliente = () =>
  useQuery({ queryKey: ['cfg', 'empresa_cliente'], queryFn: listEmpresasCliente });
