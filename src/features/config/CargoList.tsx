import { CatalogShell } from './CatalogShell';
import { useCargos } from './hooks';

export function Component() {
  const { data, isLoading, isError } = useCargos();
  return (
    <CatalogShell
      title="Cargos"
      rows={data ?? []}
      isLoading={isLoading}
      isError={isError}
      cols={[
        { header: 'Nombre', cell: (r) => r.nombre },
        { header: 'Tipo de cargo', cell: (r) => r.tipo_cargo },
        { header: 'Valor turno', cell: (r) => r.valor_turno },
      ]}
    />
  );
}
