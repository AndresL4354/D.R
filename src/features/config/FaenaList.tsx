import { CatalogShell } from './CatalogShell';
import { useFaenas } from './hooks';

export function Component() {
  const { data, isLoading, isError } = useFaenas();
  return (
    <CatalogShell
      title="Faenas"
      rows={data ?? []}
      isLoading={isLoading}
      isError={isError}
      cols={[
        { header: 'Nombre', cell: (r) => r.nombre },
        { header: 'Descripción', cell: (r) => r.descripcion },
        { header: 'Empresa', cell: (r) => r.empresa },
      ]}
    />
  );
}
