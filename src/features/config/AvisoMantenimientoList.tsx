import { CatalogShell } from './CatalogShell';
import { useAvisos } from './hooks';
import { formatDateTime } from '@/lib/utils';

export function Component() {
  const { data, isLoading, isError } = useAvisos();
  return (
    <CatalogShell
      title="Avisos de mantenimiento"
      rows={data ?? []}
      isLoading={isLoading}
      isError={isError}
      cols={[
        { header: 'Título', cell: (r) => r.titulo },
        { header: 'Inicio', cell: (r) => formatDateTime(r.fecha_inicio) },
        { header: 'Duración (min)', cell: (r) => r.duracion_minutos },
        {
          header: 'Activo',
          cell: (r) =>
            r.activo ? (
              <span className="app-badge app-badge--success">Sí</span>
            ) : (
              <span className="app-badge app-badge--muted">No</span>
            ),
        },
      ]}
    />
  );
}
