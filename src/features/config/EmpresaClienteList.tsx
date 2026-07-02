import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CatalogoPage } from './CatalogoPage';
import { useDeleteCatalogo, useEmpresasCliente } from './hooks';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { RowActionsMenu } from '@/components/common/RowActionsMenu';

/**
 * Clon de empresa-cliente.component.html: sin filtros, columnas Rut(nit)/
 * Razón social/Persona contacto/Teléfono contacto + kebab sin gating.
 */
export function Component() {
  const navigate = useNavigate();
  const { data: empresas, isLoading, isError } = useEmpresasCliente();
  const rows = empresas ?? [];
  const del = useDeleteCatalogo('empresa_cliente');
  const [aEliminar, setAEliminar] = useState<{ id: number; razon_social: string | null } | null>(null);
  const doEliminar = async () => {
    if (!aEliminar) return;
    try {
      await del.mutateAsync(aEliminar.id);
      toast.success('Empresa cliente eliminada.');
      setAEliminar(null);
    } catch (e) {
      toast.error(`No se pudo eliminar: ${(e as Error).message}`);
    }
  };

  return (
    <CatalogoPage
      breadcrumb="Empresas clientes"
      title="Empresas clientes"
      subtitleBase="Listado de empresas clientes registradas"
      count={rows.length}
      nuevoLabel="Nueva empresa"
      onNuevo={() => navigate('/empresa-cliente/nueva')}
      isLoading={isLoading}
      isError={isError}
      emptyTitle="No se encontraron empresas clientes"
      emptyHint="Crea una nueva empresa cliente para comenzar."
    >
      <table className="app-table app-table--hover">
        <thead>
          <tr>
            <th>Rut</th>
            <th>Razón social</th>
            <th>Persona contacto</th>
            <th>Teléfono contacto</th>
            <th style={{ width: 56 }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id}>
              <td>{e.nit}</td>
              <td className="font-semibold">{e.razon_social}</td>
              <td>{e.persona_contacto}</td>
              <td>{e.telefono_contacto}</td>
              <td>
                <RowActionsMenu
                  actions={[
                    { label: 'Editar', icon: <Pencil size={16} />, onClick: () => navigate(`/empresa-cliente/${e.id}/editar`) },
                    {
                      label: 'Eliminar',
                      icon: <Trash2 size={16} />,
                      onClick: () => setAEliminar({ id: e.id, razon_social: e.razon_social }),
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
        title="Eliminar empresa cliente"
        confirmLabel="Eliminar"
        busy={del.isPending}
        onCancel={() => setAEliminar(null)}
        onConfirm={doEliminar}
      >
        <p>
          ¿Confirmas que deseas eliminar la empresa cliente <strong>{aEliminar?.razon_social}</strong>?
        </p>
      </ConfirmDialog>
    </CatalogoPage>
  );
}
