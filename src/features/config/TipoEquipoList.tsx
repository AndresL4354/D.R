import { CatalogShell } from './CatalogShell';
import { useTiposEquipo } from './hooks';

export function Component() {
  const { data, isLoading, isError } = useTiposEquipo();
  return (
    <CatalogShell
      title="Tipos de Equipo"
      rows={data ?? []}
      isLoading={isLoading}
      isError={isError}
      cols={[
        { header: 'Nombre', cell: (r) => r.nombre },
        { header: 'Tipo', cell: (r) => r.tipo },
      ]}
    />
  );
}
