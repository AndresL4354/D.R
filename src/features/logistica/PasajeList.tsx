import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePasajesProyecto } from './hooks';
import type { TipoPasaje } from './api';
import { RowActionsMenu } from '@/components/common/RowActionsMenu';
import { useRole } from '@/features/auth/useRole';

/**
 * Exportado como `Component` para el `lazy` del router. Clon de
 * pasaje.component.html (list) — vista POR PROYECTO ("Pasajes de Llegada/Retorno",
 * abierta desde Asociar del servicio; tipo vía sessionStorage en el real,
 * aquí query param ?tipo=). Sin filtros/orden/paginación, como el original.
 */
export function Component() {
  const { idProyecto } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { hasAnyRole } = useRole();

  const pid = idProyecto ? Number(idProyecto) : null;
  const tipo: TipoPasaje = search.get('tipo') === 'Retorno' ? 'Retorno' : 'Llegada';
  const { data: pasajes, isLoading, isError } = usePasajesProyecto(pid, tipo);

  const canDelete = hasAnyRole([
    'ROLE_ADMIN',
    'SUPERADMINISTRADOR',
    'SUPERADMINISTRADOR BP',
    'ENCARGADO_PASAJE',
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
        <li className="active">Pasajes</li>
      </ul>

      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Pasajes de {tipo}</h1>
            <p className="app-page-subtitle">
              Listado de pasajes registrados
              {(pasajes?.length ?? 0) > 0 && (
                <>
                  {' '}
                  · <strong>{pasajes!.length}</strong> resultados
                </>
              )}
            </p>
          </div>
        </div>
        <div className="app-page-header__actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Volver
          </button>
          <Link to={pid != null ? `/pasaje/${pid}/nuevo` : '#'} className="btn btn-primary">
            <Plus size={16} /> Nuevo pasaje
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
          Error al cargar pasajes.
        </div>
      )}

      {!isLoading && !isError && (pasajes?.length ?? 0) === 0 && (
        <div className="app-card">
          <div className="app-card-body">
            <div className="app-empty-state">
              <p className="app-empty-state__title">No se encontraron pasajes</p>
              Crea un nuevo pasaje para comenzar.
            </div>
          </div>
        </div>
      )}

      {(pasajes?.length ?? 0) > 0 && (
        <div className="app-table-wrap">
          <table className="app-table app-table--hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>Persona</th>
                <th>Medio de transporte</th>
                <th>Agencia de transporte</th>
                <th>Ciudad origen</th>
                <th>Ciudad destino</th>
                <th>Fecha de salida</th>
                <th>Fecha de llegada</th>
                <th style={{ width: 56 }} />
              </tr>
            </thead>
            <tbody>
              {pasajes!.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td className="font-semibold">{p.personaNombre}</td>
                  <td>{p.medio}</td>
                  <td>{p.agencia}</td>
                  <td>{p.desde}</td>
                  <td>{p.hasta}</td>
                  {/* Fiel al real: fecha cruda sin pipe (llega ISO y se muestra tal cual) */}
                  <td>{p.fecha_salida}</td>
                  <td>{p.fecha_llegada}</td>
                  <td>
                    <RowActionsMenu
                      actions={[
                        {
                          label: 'Ver',
                          icon: <Eye size={16} />,
                          onClick: () => navigate(`/pasaje/${p.id}/ver`),
                        },
                        {
                          label: 'Eliminar',
                          icon: <Trash2 size={16} />,
                          show: canDelete,
                          onClick: () =>
                            toast.info('Eliminar pasaje: disponible al portar la mutación (Fase 4).'),
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
