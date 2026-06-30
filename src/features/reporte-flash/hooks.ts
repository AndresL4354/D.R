import { useQuery } from '@tanstack/react-query';
import { getReporteFlash, listReportesFlash } from './api';

export function useReportesFlash(params: { page: number; size: number }) {
  return useQuery({
    queryKey: ['reporte-flash', 'list', params],
    queryFn: () => listReportesFlash(params),
    placeholderData: (prev) => prev,
  });
}

export function useReporteFlash(id: number) {
  return useQuery({
    queryKey: ['reporte-flash', 'detail', id],
    queryFn: () => getReporteFlash(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}
