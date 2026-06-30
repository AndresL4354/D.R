import { CatalogShell } from '@/features/config/CatalogShell';
import { useCitaciones } from './hooks';
import { formatDateTime } from '@/lib/utils';

export function Component() {
  const { data, isLoading, isError } = useCitaciones();
  return (
    <CatalogShell
      title="Citaciones"
      rows={data ?? []}
      isLoading={isLoading}
      isError={isError}
      cols={[
        { header: 'ID', cell: (r) => r.id },
        { header: 'Fecha citación', cell: (r) => formatDateTime(r.fecha_citacion) },
      ]}
    />
  );
}
