import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useHospedajesProyecto } from './hooks';
import { RowActionsMenu } from '@/components/common/RowActionsMenu';
import { useRole } from '@/features/auth/useRole';

/**
 * Exportado como `Component` para el `lazy` del router. Clon de
 * hospedaje.component.html (list) — vista POR PROYECTO. Solo 2 columnas de
 * datos (ID con prefijo '#' y Hotel) + kebab; Volver solo si hay idProyecto.
 */
export function Component() {
  const { idProyecto } = useParams();
  const navigate = useNavigate();
  const { hasAnyRole } = useRole();
  const pid = idProyecto ? Number(idProyecto) : null;
  const { data: hospedajes, isLoading, isError } = useHospedajesProyecto(pid);

  const canDelete = hasAnyRole([
    'ROLE_ADMIN',
    'SUPERADMINISTRADOR',
    'SUPERADMINISTRADOR BP',
    'ENCARGADO_HOSPEDAJE',
  ]);

  return (
    <div>
      <ul className="app-breadcrumb">
        {pid != null && (
          <>
            <li>
              <Link to={`/proyecto/${pid}`}>Servicio</Link>
            </li>
            <li aria-hidden>›</li>
          </>
        )}
        <li className="active">Hospedajes</li>
      </ul>

      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Hospedajes</h1>
            <p className="app-page-subtitle">
              Listado de hospedajes registrados
              {(hospedajes?.length ?? 0) > 0 && (
                <>
                  {' '}
                  · <strong>{hospedajes!.length}</strong> resultados
                </>
              )}
            </p>
          </div>
        </div>
        <div className="app-page-header__actions">
          {pid != null && (
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} /> Volver
            </button>
          )}
          <Link to={pid != null ? `/hospedaje/${pid}/nuevo` : '#'} className="btn btn-primary">
            <Plus size={16} /> Nuevo hospedaje
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
          Error al cargar hospedajes.
        </div>
      )}

      {!isLoading && !isError && (hospedajes?.length ?? 0) === 0 && (
        <div className="app-card">
          <div className="app-card-body">
            <div className="app-empty-state">
              <p className="app-empty-state__title">No se encontraron hospedajes</p>
              Crea uno nuevo para comenzar.
            </div>
          </div>
        </div>
      )}

      {(hospedajes?.length ?? 0) > 0 && (
        <div className="app-table-wrap">
          <table className="app-table app-table--hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>Hotel</th>
                <th style={{ width: 56 }} />
              </tr>
            </thead>
            <tbody>
              {hospedajes!.map((h) => (
                <tr key={h.id}>
                  <td className="font-semibold">#{h.id}</td>
                  <td>{h.hotel}</td>
                  <td>
                    <RowActionsMenu
                      actions={[
                        {
                          label: 'Ver',
                          icon: <Eye size={16} />,
                          onClick: () => navigate(`/hospedaje/${h.id}/ver`),
                        },
                        {
                          label: 'Editar',
                          icon: <Pencil size={16} />,
                          onClick: () => navigate(`/hospedaje/${h.id}/editar`),
                        },
                        {
                          label: 'Eliminar',
                          icon: <Trash2 size={16} />,
                          show: canDelete,
                          onClick: () =>
                            toast.info('Eliminar hospedaje: disponible al portar la mutación (Fase 4).'),
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
