import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useInspeccionesMochila, useMochila } from './hooks';
import { RowActionsMenu } from '@/components/common/RowActionsMenu';
import { useRole } from '@/features/auth/useRole';
import { formatMediumDatetime } from '@/lib/utils';

/**
 * Exportado como `Component` para el `lazy` del router. Clon de
 * inspeccion-mochila.component.html: título 'Inspecciones de mochila N.º {numero}',
 * pill ¿Mantención? (info Sí / muted No), Servicio/Trabajador vía entrega ('N/A').
 */
export function Component() {
  const { id } = useParams();
  const idMochila = Number(id);
  const navigate = useNavigate();
  const { hasAnyRole } = useRole();
  const { data: mochila } = useMochila(idMochila);
  const { data: inspecciones, isLoading, isError } = useInspeccionesMochila(idMochila);
  const canDelete = hasAnyRole(['ROLE_ADMIN', 'SUPERADMINISTRADOR', 'SUPERADMINISTRADOR BP']);

  return (
    <div>
      <ul className="app-breadcrumb">
        <li>
          <Link to="/mochila-spdc">Mochilas SPDC</Link>
        </li>
        <li aria-hidden>›</li>
        <li className="active">Inspecciones de mochila N.º {mochila?.numero ?? ''}</li>
      </ul>

      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Inspecciones de mochila N.º {mochila?.numero ?? ''}</h1>
            <p className="app-page-subtitle">
              Listado de inspecciones registradas
              {(inspecciones?.length ?? 0) > 0 && (
                <>
                  {' '}
                  · <strong>{inspecciones!.length}</strong> resultados
                </>
              )}
            </p>
          </div>
        </div>
        <div className="app-page-header__actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Volver
          </button>
          <Link to={`/mochila-spdc/${idMochila}/inspeccion/nueva`} className="btn btn-primary">
            <Plus size={16} /> Nueva inspección
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="app-empty-state">
          <Loader2 className="mx-auto animate-spin" size={22} />
        </div>
      )}
      {isError && (
        <div className="app-empty-state" style={{ color: 'var(--app-color-danger)' }}>
          Error al cargar inspecciones.
        </div>
      )}

      {!isLoading && !isError && (inspecciones?.length ?? 0) === 0 && (
        <div className="app-card">
          <div className="app-card-body">
            <div className="app-empty-state">
              <p className="app-empty-state__title">No se encontraron inspecciones</p>
              Crea una nueva para comenzar.
            </div>
          </div>
        </div>
      )}

      {(inspecciones?.length ?? 0) > 0 && (
        <div className="app-table-wrap">
          <table className="app-table app-table--hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>¿Mantención?</th>
                <th>Servicio</th>
                <th>Trabajador</th>
                <th>Usuario creación</th>
                <th>Fecha</th>
                <th style={{ width: 56 }} />
              </tr>
            </thead>
            <tbody>
              {inspecciones!.map((i) => (
                <tr key={i.id}>
                  <td className="font-semibold">#{i.id}</td>
                  <td>
                    <span
                      className={`app-status-pill ${i.mantencion ? 'app-status-pill--info' : 'app-status-pill--muted'}`}
                    >
                      <span className="app-status-pill__dot" />
                      {i.mantencion ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td>{i.servicio || 'N/A'}</td>
                  <td>{i.trabajador || 'N/A'}</td>
                  <td>{i.usuario_creacion || 'N/A'}</td>
                  <td>{formatMediumDatetime(i.fecha)}</td>
                  <td>
                    <RowActionsMenu
                      actions={[
                        {
                          label: 'Ver',
                          icon: <Eye size={16} />,
                          onClick: () => navigate(`/mochila-spdc/${idMochila}/inspeccion/${i.id}/ver`),
                        },
                        {
                          label: 'Editar',
                          icon: <Pencil size={16} />,
                          onClick: () => navigate(`/mochila-spdc/${idMochila}/inspeccion/${i.id}/editar`),
                        },
                        {
                          label: 'Eliminar',
                          icon: <Trash2 size={16} />,
                          show: canDelete,
                          onClick: () =>
                            toast.info('Eliminar inspección: disponible al portar la mutación (Fase 3).'),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
