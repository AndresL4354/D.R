import { CatalogShell } from './CatalogShell';
import { useDocumentos } from './hooks';

export function Component() {
  const { data, isLoading, isError } = useDocumentos();
  return (
    <CatalogShell
      title="Documentos"
      rows={data ?? []}
      isLoading={isLoading}
      isError={isError}
      cols={[
        { header: 'Nombre', cell: (r) => r.nombre },
        { header: 'Categoría', cell: (r) => r.categoria_documento },
        {
          header: 'Requerido',
          cell: (r) =>
            r.requerido ? (
              <span className="app-badge app-badge--info">Sí</span>
            ) : (
              <span className="app-badge app-badge--muted">No</span>
            ),
        },
        { header: 'Tipo resultado', cell: (r) => r.tipo_resultado },
        { header: 'Empresa', cell: (r) => r.empresa },
      ]}
    />
  );
}
