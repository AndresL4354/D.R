import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eraser, Filter, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CatalogoPage } from './CatalogoPage';
import { useCargosListado, useDeleteCatalogo } from './hooks';
import type { CargoListRow } from './api';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { RowActionsMenu } from '@/components/common/RowActionsMenu';
import { useRole } from '@/features/auth/useRole';

/**
 * Clon de cargo.component.html: kebab en PRIMERA columna, Nombre/Descripción/
 * Documentos/Faenas (vacía tras filtrar, quirk fiel). Limpiar SOLO vacía el
 * input sin reconsultar (quirk fiel). Eliminar gated.
 */
export function Component() {
  const navigate = useNavigate();
  const { hasAnyRole } = useRole();
  const [nombre, setNombre] = useState('');
  const [applied, setApplied] = useState<string | null>(null);
  const { data: cargos, isLoading, isError } = useCargosListado(applied);
  const rows = cargos ?? [];
  const canDelete = hasAnyRole(['ROLE_ADMIN', 'SUPERADMINISTRADOR', 'SUPERADMINISTRADOR BP']);
  const del = useDeleteCatalogo('cargo');
  const [aEliminar, setAEliminar] = useState<CargoListRow | null>(null);
  const doEliminar = async () => {
    if (!aEliminar) return;
    try {
      await del.mutateAsync(aEliminar.id);
      toast.success('Cargo eliminado.');
      setAEliminar(null);
    } catch (e) {
      toast.error(`No se pudo eliminar: ${(e as Error).message}`);
    }
  };

  return (
    <CatalogoPage
      breadcrumb="Cargos"
      title="Cargos"
      subtitleBase="Listado de cargos registrados"
      count={rows.length}
      nuevoLabel="Nuevo cargo"
      onNuevo={() => navigate('/cargo/nuevo')}
      isLoading={isLoading}
      isError={isError}
      emptyTitle="No se encontraron cargos"
      emptyHint="Ajusta los filtros o crea uno nuevo."
      filtros={
        <input
          className="app-field__control"
          placeholder="Nombre completo"
          maxLength={150}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setApplied(nombre || null)}
        />
      }
      filtroActions={
        <>
          {/* Fiel al real: Limpiar solo vacía el input, NO reconsulta */}
          <button type="button" className="btn btn-secondary" onClick={() => setNombre('')}>
            <Eraser size={16} /> Limpiar
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setApplied(nombre || null)}>
            <Filter size={16} /> Filtrar
          </button>
        </>
      }
    >
      <table className="app-table app-table--hover">
        <thead>
          <tr>
            {/* Fiel al real: kebab en la PRIMERA columna */}
            <th style={{ width: 56 }} />
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Documentos</th>
            <th>Faenas</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id}>
              <td>
                <RowActionsMenu
                  actions={[
                    { label: 'Editar', icon: <Pencil size={16} />, onClick: () => navigate(`/cargo/${c.id}/editar`) },
                    {
                      label: 'Eliminar',
                      icon: <Trash2 size={16} />,
                      show: canDelete,
                      onClick: () => setAEliminar(c),
                    },
                  ]}
                />
              </td>
              <td className="font-semibold">{c.nombre}</td>
              <td>{c.descripcion}</td>
              <td>{c.documentos}</td>
              <td>{c.faenas}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ConfirmDialog
        open={aEliminar != null}
        title="Eliminar cargo"
        confirmLabel="Eliminar"
        busy={del.isPending}
        onCancel={() => setAEliminar(null)}
        onConfirm={doEliminar}
      >
        <p>
          ¿Confirmas que deseas eliminar el cargo <strong>{aEliminar?.nombre}</strong>?
        </p>
      </ConfirmDialog>
    </CatalogoPage>
  );
}
