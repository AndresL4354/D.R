import { Link, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { usePersonalProyecto, useProyecto } from './hooks';
import { ProyectoEstadoPill } from './ProyectoList';
import { formatDate } from '@/lib/utils';

/** Exportado como `Component` para el `lazy` del router. Detalle de Servicio. */
export function Component() {
  const { id } = useParams();
  const proyectoId = Number(id);
  const { data: p, isLoading, isError } = useProyecto(proyectoId);
  const { data: personal } = usePersonalProyecto(proyectoId);

  if (isLoading) {
    return (
      <div className="app-empty-state">
        <Loader2 className="mx-auto animate-spin" size={24} />
      </div>
    );
  }
  if (isError || !p) {
    return (
      <div>
        <div className="app-empty-state">
          <p className="app-empty-state__title">No se encontró el servicio</p>
          o no tienes permisos.
        </div>
        <div style={{ textAlign: 'center' }}>
          <Link to="/proyecto" className="btn btn-secondary">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  const fields: { label: string; value: string | null }[] = [
    { label: 'Faena', value: p.faena },
    { label: 'Empresa', value: p.razon_social_empresa },
    { label: 'Fecha inicio', value: formatDate(p.fecha_inicio) },
    { label: 'Fecha fin', value: formatDate(p.fecha_fin) },
    { label: 'Descripción', value: p.descripcion },
  ];

  return (
    <div>
      <ol className="app-breadcrumb">
        <li>
          <Link to="/proyecto">Servicios</Link>
        </li>
        <li className="active">· {p.nombre}</li>
      </ol>

      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">{p.nombre}</h1>
            <p className="app-page-subtitle">Servicio · ID {p.id}</p>
          </div>
        </div>
        <div className="app-page-header__actions">
          <ProyectoEstadoPill estado={p.estado} />
          <Link to="/proyecto" className="btn btn-secondary">
            Volver
          </Link>
        </div>
      </div>

      <div className="app-card">
        <div className="app-card-header">
          <h4>Datos del servicio</h4>
        </div>
        <div className="app-card-body">
          <dl className="app-detail-list">
            {fields.map((f) => (
              <div key={f.label} className="app-detail-list__item">
                <dt>{f.label}</dt>
                <dd>{f.value || '—'}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="app-card">
        <div className="app-card-header">
          <h4>Personal asignado ({personal?.length ?? 0})</h4>
        </div>
        <div className="app-card-body">
          {!personal || personal.length === 0 ? (
            <p style={{ color: 'var(--app-text-muted)', margin: 0 }}>Sin personal asignado.</p>
          ) : (
            <div className="app-table-wrap" style={{ marginBottom: 0 }}>
              <table className="app-table app-table--hover">
                <thead>
                  <tr>
                    <th>Persona</th>
                    <th>Cargo</th>
                    <th>Estado</th>
                    <th>Acreditado</th>
                    <th>Nuevo</th>
                  </tr>
                </thead>
                <tbody>
                  {personal.map((t) => (
                    <tr key={t.id}>
                      <td>{t.persona ?? '—'}</td>
                      <td>{t.cargo ?? '—'}</td>
                      <td>{t.estado ?? '—'}</td>
                      <td>
                        {t.acreditado ? (
                          <span className="app-badge app-badge--success">Sí</span>
                        ) : (
                          <span className="app-badge app-badge--muted">No</span>
                        )}
                      </td>
                      <td>
                        {t.nuevo ? <span className="app-badge app-badge--info">Nuevo</span> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
