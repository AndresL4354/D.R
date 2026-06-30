import { useQuery } from '@tanstack/react-query';
import { listCitaciones, listHospedajes, listPasajes } from './api';

export function usePasajes(params: { page: number; size: number }) {
  return useQuery({
    queryKey: ['pasaje', 'list', params],
    queryFn: () => listPasajes(params),
    placeholderData: (prev) => prev,
  });
}
export const useCitaciones = () =>
  useQuery({ queryKey: ['citacion', 'list'], queryFn: listCitaciones });
export const useHospedajes = () =>
  useQuery({ queryKey: ['hospedaje', 'list'], queryFn: listHospedajes });
