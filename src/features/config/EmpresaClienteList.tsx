import { CatalogShell } from './CatalogShell';
import { useEmpresasCliente } from './hooks';

export function Component() {
  const { data, isLoading, isError } = useEmpresasCliente();
  return (
    <CatalogShell
      title="Empresas cliente"
      rows={data ?? []}
      isLoading={isLoading}
      isError={isError}
      cols={[
        { header: 'Razón social', cell: (r) => r.razon_social },
        { header: 'NIT', cell: (r) => r.nit },
        { header: 'Teléfono', cell: (r) => r.telefono },
        { header: 'Estado', cell: (r) => r.estado },
      ]}
    />
  );
}
