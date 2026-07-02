import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CatalogoPage } from './CatalogoPage';
import { useTiposEquipo } from './hooks';
import { RowActionsMenu } from '@/components/common/RowActionsMenu';
import { useRole } from '@/features/auth/useRole';

/**
 * Clon de tipo-equipo.component.html: sin filtros, columnas Nombre/Tipo +
 * kebab (solo Eliminar gated ADMIN/SUPERADMIN/SUPERADMIN BP).
 */
export function Component() {
  const navigate = useNavigate();
  const { hasAnyRole } = useRole();
  const { data: tipos, isLoading, isError } = useTiposEquipo();
  const rows = tipos ?? [];
  const canDelete = hasAnyRole(['ROLE_ADMIN', 'SUPERADMINISTRADOR', 'SUPERADMINISTRADOR BP']);

  return (
    <CatalogoPage
      breadcrumb="Tipos de equipo"
      title="Tipos de equipo"
      subtitleBase="Listado de tipos de equipo registrados"
      count={rows.length}
      nuevoLabel="Nuevo tipo de equipo"
      onNuevo={() => navigate('/tipo-equipo/nuevo')}
      isLoading={isLoading}
      isError={isError}
      emptyTitle="No se encontraron tipos de equipo"
      emptyHint="Crea un nuevo tipo de equipo para comenzar."
    >
      <table className="app-table app-table--hover">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th style={{ width: 56 }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id}>
              <td className="font-semibold">{t.nombre}</td>
              <td>{t.tipo}</td>
              <td>
                <RowActionsMenu
                  actions={[
                    { label: 'Ver', icon: <Eye size={16} />, onClick: () => navigate(`/tipo-equipo/${t.id}/ver`) },
                    { label: 'Editar', icon: <Pencil size={16} />, onClick: () => navigate(`/tipo-equipo/${t.id}/editar`) },
                    {
                      label: 'Eliminar',
                      icon: <Trash2 size={16} />,
                      show: canDelete,
                      onClick: () => toast.info('Eliminar tipo de equipo: disponible al portar la mutación (Fase 4).'),
                    },
                  ]}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CatalogoPage>
  );
}
