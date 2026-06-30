import { Link, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useDetalleEntrega, useEntrega } from './hooks';
import { formatDate } from '@/lib/utils';

/** Exportado como `Component` para el `lazy` del router. */
export function Component() {
  const { id } = useParams();
  const entregaId = Number(id);
  const { data: e, isLoading, isError } = useEntrega(entregaId);
  const { data: detalle } = useDetalleEntrega(entregaId);

  if (isLoading) {
    return (
      <div className="app-empty-state">
        <Loader2 className="mx-auto animate-spin" size={24} />
      </div>
    );
  }
  if (isError || !e) {
    return (
      <div>
        <div className="app-empty-state">
          <p className="app-empty-state__title">No se encontró la entrega</p>
          o no tienes permisos.
        </div>
        <div style={{ textAlign: 'center' }}>
          <Link to="/entrega-epp" className="btn btn-secondary">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  const fields: { label: string; value: string | null }[] = [
    { label: 'Trabajador', value: e._resolved.persona },
    { label: 'Servicio', value: e._resolved.proyecto },
    { label: 'Faena', value: e._resolved.faena },
    { label: 'Usuario entrega', value: e.usuario_entrega },
    { label: 'Fecha', value: formatDate(e.fecha_creacion) },
    { label: 'Empresa', value: e.razon_social_empresa },
    { label: 'Comentarios', value: e.comentarios },
  ];

  return (
    <div>
      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Entrega EPP #{e.id}</h1>
            <p className="app-page-subtitle">
              {e._resolved.persona ?? '—'} · {formatDate(e.fecha_creacion)}
            </p>
          </div>
        </div>
        <div className="app-page-header__actions">
          <Link to="/entrega-epp" className="btn btn-secondary">
            Volver
          </Link>
        </div>
      </div>

      <div className="app-card">
        <div className="app-card-header">
          <h4>Datos de la entrega</h4>
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
          <h4>Artículos entregados ({detalle?.length ?? 0})</h4>
        </div>
        <div className="app-card-body">
          {!detalle || detalle.length === 0 ? (
            <p style={{ color: 'var(--app-text-muted)', margin: 0 }}>Sin artículos.</p>
          ) : (
            <div className="app-table-wrap" style={{ marginBottom: 0 }}>
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Artículo</th>
                    <th>Cantidad</th>
                    <th>Talla</th>
                    <th>Color</th>
                    <th>Marca</th>
                    <th>Entregado</th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.map((d) => (
                    <tr key={d.id}>
                      <td>{d.articulo ?? '—'}</td>
                      <td>{d.cantidad ?? '—'}</td>
                      <td>{d.talla ?? '—'}</td>
                      <td>{d.color ?? '—'}</td>
                      <td>{d.marca ?? '—'}</td>
                      <td>
                        {d.entregado ? (
                          <span className="app-badge app-badge--success">Sí</span>
                        ) : (
                          <span className="app-badge app-badge--muted">No</span>
                        )}
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
