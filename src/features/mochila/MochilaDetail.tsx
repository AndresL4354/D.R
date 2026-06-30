import { Link, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useArticulosMochila, useInspecciones, useMochila } from './hooks';
import { formatDate, formatDateTime } from '@/lib/utils';

/** Exportado como `Component` para el `lazy` del router. */
export function Component() {
  const { id } = useParams();
  const mochilaId = Number(id);
  const { data: m, isLoading, isError } = useMochila(mochilaId);
  const { data: articulos } = useArticulosMochila(mochilaId);
  const { data: inspecciones } = useInspecciones(mochilaId);

  if (isLoading) {
    return (
      <div className="app-empty-state">
        <Loader2 className="mx-auto animate-spin" size={24} />
      </div>
    );
  }
  if (isError || !m) {
    return (
      <div>
        <div className="app-empty-state">
          <p className="app-empty-state__title">No se encontró la mochila</p>
          o no tienes permisos (dominio ALTA).
        </div>
        <div style={{ textAlign: 'center' }}>
          <Link to="/mochila-spdc" className="btn btn-secondary">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Mochila SPDC {m.numero ?? `#${m.id}`}</h1>
            <p className="app-page-subtitle">Creada {formatDate(m.fecha_creacion)}</p>
          </div>
        </div>
        <div className="app-page-header__actions">
          <Link to="/mochila-spdc" className="btn btn-secondary">
            Volver
          </Link>
        </div>
      </div>

      <div className="app-card">
        <div className="app-card-header">
          <h4>Artículos ({articulos?.length ?? 0})</h4>
        </div>
        <div className="app-card-body">
          {!articulos || articulos.length === 0 ? (
            <p style={{ color: 'var(--app-text-muted)', margin: 0 }}>Sin artículos.</p>
          ) : (
            <div className="app-table-wrap" style={{ marginBottom: 0 }}>
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Marca</th>
                    <th>Clasificación</th>
                  </tr>
                </thead>
                <tbody>
                  {articulos.map((a) => (
                    <tr key={a.id}>
                      <td>{a.descripcion ?? '—'}</td>
                      <td>{a.marca ?? '—'}</td>
                      <td>{a.clasificacion ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="app-card">
        <div className="app-card-header">
          <h4>Inspecciones ({inspecciones?.length ?? 0})</h4>
        </div>
        <div className="app-card-body">
          {!inspecciones || inspecciones.length === 0 ? (
            <p style={{ color: 'var(--app-text-muted)', margin: 0 }}>Sin inspecciones.</p>
          ) : (
            <div className="app-table-wrap" style={{ marginBottom: 0 }}>
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Mantención</th>
                    <th>Exposición</th>
                    <th>Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {inspecciones.map((i) => (
                    <tr key={i.id}>
                      <td>{formatDateTime(i.fecha)}</td>
                      <td>
                        {i.mantencion ? (
                          <span className="app-badge app-badge--info">Sí</span>
                        ) : (
                          <span className="app-badge app-badge--muted">No</span>
                        )}
                      </td>
                      <td>{i.exposicion ?? '—'}</td>
                      <td>{i.observaciones ?? '—'}</td>
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
