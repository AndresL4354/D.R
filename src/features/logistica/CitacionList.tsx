import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCitacionesProyecto } from './hooks';
import { RowActionsMenu } from '@/components/common/RowActionsMenu';
import { formatMediumDatetime } from '@/lib/utils';

/**
 * Exportado como `Component` para el `lazy` del router. Clon de
 * citacion.component.html (list) — vista POR PROYECTO. Peculiaridades fieles:
 * el kebab va en la PRIMERA columna y ninguna acción tiene gating de roles.
 */
export function Component() {
  const { idProyecto } = useParams();
  const navigate = useNavigate();
  const pid = idProyecto ? Number(idProyecto) : null;
  const { data: citaciones, isLoading, isError } = useCitacionesProyecto(pid);

  return (
    <div>
      <ul className="app-breadcrumb">
        {pid != null && (
          <>
            <li>
              <Link to={`/proyecto/${pid}`}>Servicio</Link>
            </li>
            <li aria-hidden>›</li>
            <li>
              <Link to={`/proyecto/${pid}`}>Asociar</Link>
            </li>
            <li aria-hidden>›</li>
          </>
        )}
        <li className="active">Citaciones</li>
      </ul>

      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Citaciones</h1>
            <p className="app-page-subtitle">
              Listado de citaciones registradas
              {(citaciones?.length ?? 0) > 0 && (
                <>
                  {' '}
                  · <strong>{citaciones!.length}</strong> resultados
                </>
              )}
            </p>
          </div>
        </div>
        <div className="app-page-header__actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Volver
          </button>
          <Link to={pid != null ? `/citacion/${pid}/nueva` : '#'} className="btn btn-primary">
            <Plus size={16} /> Nueva citación
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
          Error al cargar citaciones.
        </div>
      )}

      {!isLoading && !isError && (citaciones?.length ?? 0) === 0 && (
        <div className="app-card">
          <div className="app-card-body">
            <div className="app-empty-state">
              <p className="app-empty-state__title">No se encontraron citaciones</p>
              Crea una nueva citación para comenzar.
            </div>
          </div>
        </div>
      )}

      {(citaciones?.length ?? 0) > 0 && (
        <div className="app-table-wrap">
          <table className="app-table app-table--hover">
            <thead>
              <tr>
                {/* Fiel al real: el kebab es la PRIMERA columna en este listado */}
                <th style={{ width: 56 }} />
                <th>ID Citación</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {citaciones!.map((c) => (
                <tr key={c.id}>
                  <td>
                    <RowActionsMenu
                      actions={[
                        {
                          label: 'Ver',
                          icon: <Eye size={16} />,
                          onClick: () => navigate(`/citacion/${c.id}/ver`),
                        },
                        {
                          label: 'Editar',
                          icon: <Pencil size={16} />,
                          onClick: () => navigate(`/citacion/${c.id}/editar`),
                        },
                        {
                          label: 'Eliminar',
                          icon: <Trash2 size={16} />,
                          onClick: () =>
                            toast.info('Eliminar citación: disponible al portar la mutación (Fase 4).'),
                        },
                      ]}
                    />
                  </td>
                  <td className="font-semibold">{c.id}</td>
                  <td>{formatMediumDatetime(c.fecha_citacion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
