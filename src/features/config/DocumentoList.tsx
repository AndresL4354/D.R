import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eraser, Filter, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CatalogoPage } from './CatalogoPage';
import { useDeleteCatalogo, useDocumentosCatalogo, useEmpresasCliente } from './hooks';
import { CATEGORIAS_DOCUMENTO, type DocumentoFiltros } from './api';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { RowActionsMenu } from '@/components/common/RowActionsMenu';
import { useRole } from '@/features/auth/useRole';

/**
 * Clon de documento.component.html ('Documentos asociados al cargo'):
 * visibilidad por DOC_PRIVADO (sin él solo públicos), badge Privado
 * (app-badge warning SI / muted NO), filtros Nombre/Empresa(clientes)/
 * Categoría (hardcode). Limpiar resetea Y recarga (fiel). Eliminar gated.
 */
export function Component() {
  const navigate = useNavigate();
  const { hasRole, hasAnyRole } = useRole();
  const canPrivado = hasRole('DOC_PRIVADO') || hasRole('ROLE_ADMIN');
  const canDelete = hasAnyRole(['ROLE_ADMIN', 'SUPERADMINISTRADOR', 'SUPERADMINISTRADOR BP']);

  const [draft, setDraft] = useState({ nombre: '', empresa: '', categoria: '' });
  const [applied, setApplied] = useState<DocumentoFiltros>({});
  const { data: documentos, isLoading, isError } = useDocumentosCatalogo(canPrivado, applied);
  const { data: empresasCliente } = useEmpresasCliente();
  const rows = documentos ?? [];
  const del = useDeleteCatalogo('documento');
  const [aEliminar, setAEliminar] = useState<{ id: number; nombre: string | null } | null>(null);
  const doEliminar = async () => {
    if (!aEliminar) return;
    try {
      await del.mutateAsync(aEliminar.id);
      toast.success('Documento eliminado.');
      setAEliminar(null);
    } catch (e) {
      toast.error(`No se pudo eliminar: ${(e as Error).message}`);
    }
  };

  const filtrar = () =>
    setApplied({ nombre: draft.nombre, empresa: draft.empresa || null, categoria: draft.categoria || null });
  const limpiar = () => {
    setDraft({ nombre: '', empresa: '', categoria: '' });
    setApplied({});
  };

  return (
    <CatalogoPage
      breadcrumb="Documentos"
      title="Documentos asociados al cargo"
      subtitleBase="Listado de documentos registrados"
      count={rows.length}
      nuevoLabel="Nuevo documento"
      onNuevo={() => navigate('/documento/nuevo')}
      isLoading={isLoading}
      isError={isError}
      emptyTitle="No se encontraron documentos"
      emptyHint="Ajusta los filtros o crea uno nuevo."
      filtros={
        <>
          <input
            className="app-field__control"
            placeholder="Nombre"
            maxLength={150}
            value={draft.nombre}
            onChange={(e) => setDraft({ ...draft, nombre: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && filtrar()}
          />
          <select
            className="app-field__control"
            value={draft.empresa}
            onChange={(e) => setDraft({ ...draft, empresa: e.target.value })}
          >
            <option value="">Empresa — Todas las empresas</option>
            {(empresasCliente ?? []).map((ec) => (
              <option key={ec.id} value={ec.razon_social ?? ''}>
                {ec.razon_social}
              </option>
            ))}
          </select>
          <select
            className="app-field__control"
            value={draft.categoria}
            onChange={(e) => setDraft({ ...draft, categoria: e.target.value })}
          >
            <option value="">Categoría — Todas las categorías</option>
            {CATEGORIAS_DOCUMENTO.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </>
      }
      filtroActions={
        <>
          <button type="button" className="btn btn-secondary" onClick={limpiar}>
            <Eraser size={16} /> Limpiar
          </button>
          <button type="button" className="btn btn-primary" onClick={filtrar}>
            <Filter size={16} /> Filtrar
          </button>
        </>
      }
    >
      <table className="app-table app-table--hover">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Empresa</th>
            <th>Privado</th>
            <th>Categoría</th>
            <th>Descripción</th>
            <th style={{ width: 56 }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.id}>
              <td className="font-semibold">{d.nombre}</td>
              <td>{d.todas ? 'Todas' : d.empresa}</td>
              <td>
                <span className={`app-badge ${d.privado ? 'app-badge--warning' : 'app-badge--muted'}`}>
                  {d.privado ? 'SI' : 'NO'}
                </span>
              </td>
              <td>{d.categoria_documento}</td>
              <td>{d.descripcion}</td>
              <td>
                <RowActionsMenu
                  actions={[
                    { label: 'Editar', icon: <Pencil size={16} />, onClick: () => navigate(`/documento/${d.id}/editar`) },
                    {
                      label: 'Eliminar',
                      icon: <Trash2 size={16} />,
                      show: canDelete,
                      onClick: () => setAEliminar({ id: d.id, nombre: d.nombre }),
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
        title="Eliminar documento"
        confirmLabel="Eliminar"
        busy={del.isPending}
        onCancel={() => setAEliminar(null)}
        onConfirm={doEliminar}
      >
        <p>
          ¿Confirmas que deseas eliminar el documento <strong>{aEliminar?.nombre}</strong>?
        </p>
      </ConfirmDialog>
    </CatalogoPage>
  );
}
