import { CatalogShell } from './CatalogShell';
import { useArticulos } from './hooks';

export function Component() {
  const { data, isLoading, isError } = useArticulos();
  return (
    <CatalogShell
      title="Artículos"
      rows={data ?? []}
      isLoading={isLoading}
      isError={isError}
      cols={[
        { header: 'Descripción', cell: (r) => r.descripcion },
        { header: 'Marca', cell: (r) => r.marca },
        { header: 'Clasificación', cell: (r) => r.clasificacion },
        { header: 'Tipo', cell: (r) => r.tipo },
        { header: 'Modelo', cell: (r) => r.modelo },
      ]}
    />
  );
}
