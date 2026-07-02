import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CatalogoPage } from './CatalogoPage';
import { useAvisos, useDeleteCatalogo } from './hooks';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { RowActionsMenu } from '@/components/common/RowActionsMenu';
import { formatMediumDatetime } from '@/lib/utils';

/**
 * Clon de aviso-mantenimiento.component.html: subtítulo 'Banner global…
 * N registrados' (no 'resultados'), Título con fallback 'Mantenimiento
 * programado', pill Activo (--ok/muted SIN dot, fiel), kebab solo
 * Editar/Eliminar (no hay Ver). La ruta completa ya está gateada por rol.
 */
export function Component() {
  const navigate = useNavigate();
  const { data: avisos, isLoading, isError } = useAvisos();
  const rows = avisos ?? [];
  const del = useDeleteCatalogo('aviso_mantenimiento');
  const [aEliminar, setAEliminar] = useState<{ id: number; titulo: string | null } | null>(null);
  const doEliminar = async () => {
    if (!aEliminar) return;
    try {
      await del.mutateAsync(aEliminar.id);
      toast.success('Aviso eliminado.');
      setAEliminar(null);
    } catch (e) {
      toast.error(`No se pudo eliminar: ${(e as Error).message}`);
    }
  };

  return (
    <CatalogoPage
      breadcrumb="Avisos de mantenimiento"
      title="Avisos de mantenimiento"
      subtitleBase="Banner global mostrado a todos los usuarios"
      count={rows.length}
      countLabel="registrados"
      nuevoLabel="Nuevo aviso"
      onNuevo={() => navigate('/aviso-mantenimiento/nuevo')}
      isLoading={isLoading}
      isError={isError}
      emptyTitle="No hay avisos de mantenimiento"
      emptyHint="Crea un nuevo aviso para mostrarlo en todo el sistema."
    >
      <table className="app-table app-table--hover">
        <thead>
          <tr>
            <th>Título</th>
            <th>Mensaje</th>
            <th>Inicio del mantenimiento</th>
            <th>Duración (min)</th>
            <th>Activo</th>
            <th style={{ width: 56 }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id}>
              <td className="font-semibold">{a.titulo || 'Mantenimiento programado'}</td>
              <td>{a.mensaje}</td>
              <td>{formatMediumDatetime(a.fecha_inicio)}</td>
              <td>{a.duracion_minutos}</td>
              <td>
                {/* Fiel al real: pill sin dot, modificador --ok */}
                <span className={`app-status-pill ${a.activo ? 'app-status-pill--ok' : 'app-status-pill--muted'}`}>
                  {a.activo ? 'Sí' : 'No'}
                </span>
              </td>
              <td>
                <RowActionsMenu
                  actions={[
                    {
                      label: 'Editar',
                      icon: <Pencil size={16} />,
                      onClick: () => navigate(`/aviso-mantenimiento/${a.id}/editar`),
                    },
                    {
                      label: 'Eliminar',
                      icon: <Trash2 size={16} />,
                      onClick: () => setAEliminar({ id: a.id, titulo: a.titulo }),
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
        title="Eliminar aviso"
        confirmLabel="Eliminar"
        busy={del.isPending}
        onCancel={() => setAEliminar(null)}
        onConfirm={doEliminar}
      >
        <p>
          ¿Confirmas que deseas eliminar el aviso <strong>{aEliminar?.titulo || 'Mantenimiento programado'}</strong>?
        </p>
      </ConfirmDialog>
    </CatalogoPage>
  );
}
