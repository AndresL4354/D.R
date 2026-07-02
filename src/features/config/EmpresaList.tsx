import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CatalogoPage } from './CatalogoPage';
import { useEmpresas } from './hooks';
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
                      { label: 'Ver', icon: <Eye size={16} />, onClick: () => navigate(`/empresa/${e.id}/ver`) },
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
                        onClick: () => toast.info('Eliminar empresa: disponible al portar la mutación (Fase 4).'),
                      },
                    ]}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </CatalogoPage>
  );
}
