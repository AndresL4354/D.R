import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CatalogoPage } from './CatalogoPage';
import { useDeleteCatalogo, useEmpresas } from './hooks';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { RowActionsMenu } from '@/components/common/RowActionsMenu';

/**
 * Clon de empresa.component.html: SIN filtros; Estado pill (ACTIVA=success /
 * resto=muted) en primera columna; Editar/Eliminar visibles solo si
 * estado==='ACTIVA' (condición por estado, sin roles — fiel).
 */
export function Component() {
  const navigate = useNavigate();
  const { data: empresas, isLoading, isError } = useEmpresas();
  const rows = empresas ?? [];
  const del = useDeleteCatalogo('empresa');
  const [aEliminar, setAEliminar] = useState<{ id: number; razon_social: string | null } | null>(null);
  const doEliminar = async () => {
    if (!aEliminar) return;
    try {
      await del.mutateAsync(aEliminar.id);
      toast.success('Empresa eliminada.');
      setAEliminar(null);
    } catch (e) {
      toast.error(`No se pudo eliminar: ${(e as Error).message}`);
    }
  };

  return (
    <CatalogoPage
      breadcrumb="Empresas"
      title="Empresas"
      subtitleBase="Listado de empresas registradas"
      count={rows.length}
      nuevoLabel="Nueva empresa"
      onNuevo={() => navigate('/empresa/nueva')}
      isLoading={isLoading}
      isError={isError}
      emptyTitle="No se encontraron empresas"
      emptyHint="Crea una nueva empresa para comenzar."
    >
      <table className="app-table app-table--hover">
        <thead>
          <tr>
            <th>Estado</th>
            <th>Rut</th>
            <th>Razón Social</th>
            <th>Persona Contacto</th>
            <th>Teléfono Contacto</th>
            <th style={{ width: 56 }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => {
            const activa = e.estado === 'ACTIVA';
            return (
              <tr key={e.id}>
                <td>
                  <span className={`app-status-pill ${activa ? 'app-status-pill--success' : 'app-status-pill--muted'}`}>
                    <span className="app-status-pill__dot" />
                    {e.estado || '—'}
                  </span>
                </td>
                <td>{e.nit}</td>
                <td className="font-semibold">{e.razon_social}</td>
                <td>{e.persona_contacto}</td>
                <td>{e.telefono_contacto}</td>
                <td>
                  <RowActionsMenu
                    actions={[
                      {
                        label: 'Editar',
                        icon: <Pencil size={16} />,
                        show: activa,
                        onClick: () => navigate(`/empresa/${e.id}/editar`),
                      },
                      {
                        label: 'Eliminar',
                        icon: <Trash2 size={16} />,
                        show: activa,
                        onClick: () => setAEliminar({ id: e.id, razon_social: e.razon_social }),
                      },
                    ]}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <ConfirmDialog
        open={aEliminar != null}
        title="Eliminar empresa"
        confirmLabel="Eliminar"
        busy={del.isPending}
        onCancel={() => setAEliminar(null)}
        onConfirm={doEliminar}
      >
        <p>
          ¿Confirmas que deseas eliminar la empresa <strong>{aEliminar?.razon_social}</strong>?
        </p>
      </ConfirmDialog>
    </CatalogoPage>
  );
}
