import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CatalogoPage } from './CatalogoPage';
import { useDeleteCatalogo, useTiposEquipo } from './hooks';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
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
  const del = useDeleteCatalogo('tipo_equipo');
  const [aEliminar, setAEliminar] = useState<{ id: number; nombre: string | null } | null>(null);
  const doEliminar = async () => {
    if (!aEliminar) return;
    try {
      await del.mutateAsync(aEliminar.id);
      toast.success('Tipo de equipo eliminado.');
      setAEliminar(null);
    } catch (e) {
      toast.error(`No se pudo eliminar: ${(e as Error).message}`);
    }
  };

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
                    { label: 'Editar', icon: <Pencil size={16} />, onClick: () => navigate(`/tipo-equipo/${t.id}/editar`) },
                    {
                      label: 'Eliminar',
                      icon: <Trash2 size={16} />,
                      show: canDelete,
                      onClick: () => setAEliminar({ id: t.id, nombre: t.nombre }),
                    },
                  ]}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ConfirmDialog
        open={aEliminar != null}
        title="Eliminar tipo de equipo"
        confirmLabel="Eliminar"
        busy={del.isPending}
        onCancel={() => setAEliminar(null)}
        onConfirm={doEliminar}
      >
        <p>
          ¿Confirmas que deseas eliminar el tipo de equipo <strong>{aEliminar?.nombre}</strong>?
        </p>
      </ConfirmDialog>
    </CatalogoPage>
  );
}
