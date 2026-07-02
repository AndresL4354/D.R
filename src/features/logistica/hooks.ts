import { useQuery } from '@tanstack/react-query';
import {
  listCitacionesProyecto,
  listHospedajesProyecto,
  listPasajesProyecto,
  type TipoPasaje,
} from './api';

export function usePasajesProyecto(idProyecto: number | null, tipo: TipoPasaje) {
  return useQuery({
    queryKey: ['logistica', 'pasajes', idProyecto, tipo],
    queryFn: () => listPasajesProyecto(idProyecto, tipo),
  });
}

export function useCitacionesProyecto(idProyecto: number | null) {
  return useQuery({
    queryKey: ['logistica', 'citaciones', idProyecto],
    queryFn: () => listCitacionesProyecto(idProyecto),
  });
}

export function useHospedajesProyecto(idProyecto: number | null) {
  return useQuery({
    queryKey: ['logistica', 'hospedajes', idProyecto],
    queryFn: () => listHospedajesProyecto(idProyecto),
  });
}
