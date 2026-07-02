import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CatalogoPage } from './CatalogoPage';
import { useEmpresasCliente } from './hooks';
import { RowActionsMenu } from '@/components/common/RowActionsMenu';

/**
 * Clon de empresa-cliente.component.html: sin filtros, columnas Rut(nit)/
 * Razón social/Persona contacto/Teléfono contacto + kebab sin gating.
 */
export function Component() {
  const navigate = useNavigate();
  const { data: empresas, isLoading, isError } = useEmpresasCliente();
  const rows = empresas ?? [];

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
                    { label: 'Ver', icon: <Eye size={16} />, onClick: () => navigate(`/empresa-cliente/${e.id}/ver`) },
                    { label: 'Editar', icon: <Pencil size={16} />, onClick: () => navigate(`/empresa-cliente/${e.id}/editar`) },
                    {
                      label: 'Eliminar',
                      icon: <Trash2 size={16} />,
                      onClick: () => toast.info('Eliminar empresa cliente: disponible al portar la mutación (Fase 4).'),
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
