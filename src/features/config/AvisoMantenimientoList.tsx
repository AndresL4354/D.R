import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CatalogoPage } from './CatalogoPage';
import { useAvisos } from './hooks';
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
                      onClick: () => toast.info('Eliminar aviso: disponible al portar la mutación (Fase 4).'),
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
