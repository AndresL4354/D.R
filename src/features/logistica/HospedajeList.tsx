import { CatalogShell } from '@/features/config/CatalogShell';
import { useHospedajes } from './hooks';
import { formatDate } from '@/lib/utils';

export function Component() {
  const { data, isLoading, isError } = useHospedajes();
  return (
    <CatalogShell
      title="Hospedajes"
      rows={data ?? []}
      isLoading={isLoading}
      isError={isError}
      cols={[
        { header: 'Hotel', cell: (r) => r.hotel },
        { header: 'Dirección', cell: (r) => r.direccion },
        { header: 'Ingreso', cell: (r) => formatDate(r.fecha_ingreso) },
        { header: 'Salida', cell: (r) => formatDate(r.fecha_salida) },
      ]}
    />
  );
}
