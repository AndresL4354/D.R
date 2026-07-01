import { useQuery } from '@tanstack/react-query';
import { listEquipos } from './api';

export function useEquipos() {
  return useQuery({ queryKey: ['equipo', 'list'], queryFn: listEquipos });
}
