import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Loader2, Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { RowActionsMenu } from '@/components/common/RowActionsMenu';
import { useRole } from '@/features/auth/useRole';
import { formatMediumDatetime } from '@/lib/utils';

/**
 * Exportado como `Component` para el `lazy` del router. Clon de
 * reporte-incidentes.component.html (/investigacion, título 'Investigaciones').
 * Nota de paridad: en el real loadAll() está COMENTADO (vista dormida); aquí
 * usamos el endpoint vivo equivalente (GET api/reporteInvestigacions = findAll).
 * 'Eliminar' es inerte también en el real (delete() comentado).
 */
export function Component() {
  const navigate = useNavigate();
  const { hasAnyRole } = useRole();
  const canCreate = hasAnyRole(['ROLE_ADMIN', 'SUPERADMINISTRADOR', 'SUPERADMINISTRADOR BP', 'OPERACIONES']);
  const canDelete = hasAnyRole(['ROLE_ADMIN', 'SUPERADMINISTRADOR', 'SUPERADMINISTRADOR BP']);

  const { data: investigaciones, isLoading, isError } = useQuery({
    queryKey: ['investigacion', 'list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('reporte_investigacion').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Investigaciones</h1>
            <p className="app-page-subtitle">
              Listado de investigaciones de incidentes
              {(investigaciones?.length ?? 0) > 0 && (
                <>
                  {' '}
                  · <strong>{investigaciones!.length}</strong> resultados
                </>
              )}
            </p>
          </div>
        </div>
        <div className="app-page-header__actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Volver
          </button>
          {canCreate && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/investigacion/nueva')}
            >
              <Plus size={16} /> Nueva investigación
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="app-empty-state">
          <Loader2 className="mx-auto animate-spin" size={22} />
        </div>
      )}
      {isError && (
        <div className="app-empty-state" style={{ color: 'var(--app-color-danger)' }}>
          Error al cargar investigaciones.
        </div>
      )}

      {!isLoading && !isError && (investigaciones?.length ?? 0) === 0 && (
        <div className="app-card">
          <div className="app-card-body">
            <div className="app-empty-state">
              <p className="app-empty-state__title">No se encontraron resultados</p>
              Crea una nueva investigación para comenzar.
            </div>
          </div>
        </div>
      )}

      {(investigaciones?.length ?? 0) > 0 && (
        <div className="app-table-wrap">
          <table className="app-table app-table--hover">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Aprendizaje</th>
                <th style={{ width: 56 }} />
              </tr>
            </thead>
            <tbody>
              {investigaciones!.map((r) => (
                <tr key={r.id}>
                  <td>{r.estado}</td>
                  <td>{formatMediumDatetime(r.fecha_creacion)}</td>
                  <td>{r.aprendizaje}</td>
                  <td>
                    <RowActionsMenu
                      actions={[
                        {
                          label: 'Ver',
                          icon: <Eye size={16} />,
                          onClick: () => navigate(`/investigacion/${r.id}/ver`),
                        },
                        {
                          label: 'Eliminar',
                          icon: <Trash2 size={16} />,
                          show: canDelete,
                          // Fiel al real: el botón Eliminar es inerte (delete() comentado)
                          onClick: () => {},
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
