import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eraser, Eye, Filter, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CatalogoPage } from './CatalogoPage';
import { useArticulosFiltro } from './hooks';
import { CLASIFICACIONES_ARTICULO, type ArticuloFiltros } from './api';
import { RowActionsMenu } from '@/components/common/RowActionsMenu';
import { useRole } from '@/features/auth/useRole';

/** '' (tras trim) → 'N/A', null/undefined → vacío (quirk fiel del template). */
function naSiVacio(v: string | null | undefined): string {
  if (v == null) return '';
  return v.trim() === '' ? 'N/A' : v;
}

/**
 * Clon de articulo.component.html: kebab en PRIMERA columna, sin botón Volver,
 * filtros Descripción/Clasificación (enum), pill 'Tiene identificador'
 * (success Sí / muted No). Permiso por fila: SPDC→ADMIN_VERTICAL,
 * resto→ROLE_ADMIN (fiel a validarPermiso). Limpiar recarga todo.
 */
export function Component() {
  const navigate = useNavigate();
  const { hasRole } = useRole();
  const [draft, setDraft] = useState({ descripcion: '', clasificacion: '' });
  const [applied, setApplied] = useState<ArticuloFiltros>({});
  const { data: articulos, isLoading, isError } = useArticulosFiltro(applied);
  const rows = articulos ?? [];

  const validarPermiso = (clasificacion: string | null) =>
    clasificacion === 'SPDC' ? hasRole('ADMIN_VERTICAL') : hasRole('ROLE_ADMIN');

  const filtrar = () =>
    setApplied({ descripcion: draft.descripcion, clasificacion: draft.clasificacion || null });
  const limpiar = () => {
    setDraft({ descripcion: '', clasificacion: '' });
    setApplied({});
  };

  return (
    <CatalogoPage
      breadcrumb="Artículos"
      title="Artículos"
      subtitleBase="Listado de artículos registrados"
      count={rows.length}
      showVolver={false}
      nuevoLabel="Nuevo artículo"
      onNuevo={() => navigate('/articulo/nuevo')}
      isLoading={isLoading}
      isError={isError}
      emptyTitle="No se encontraron artículos"
      emptyHint="Ajusta los filtros o crea uno nuevo."
      filtros={
        <>
          <input
            className="app-field__control"
            placeholder="Descripción"
            maxLength={150}
            value={draft.descripcion}
            onChange={(e) => setDraft({ ...draft, descripcion: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && filtrar()}
          />
          <select
            className="app-field__control"
            value={draft.clasificacion}
            onChange={(e) => setDraft({ ...draft, clasificacion: e.target.value })}
          >
            <option value="">Clasificación</option>
            {CLASIFICACIONES_ARTICULO.map((c) => (
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
            {/* Fiel al real: kebab en la PRIMERA columna */}
            <th style={{ width: 56 }} />
            <th>ID</th>
            <th>Descripción</th>
            <th>Clasificación</th>
            <th>Marcas</th>
            <th>Tallas</th>
            <th>Colores</th>
            <th>Tipos</th>
            <th>Tiene identificador</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const permitido = validarPermiso(a.clasificacion);
            return (
              <tr key={a.id}>
                <td>
                  <RowActionsMenu
                    actions={[
                      { label: 'Ver', icon: <Eye size={16} />, onClick: () => navigate(`/articulo/${a.id}/ver`) },
                      {
                        label: 'Editar',
                        icon: <Pencil size={16} />,
                        show: permitido,
                        onClick: () => navigate(`/articulo/${a.id}/editar`),
                      },
                      {
                        label: 'Eliminar',
                        icon: <Trash2 size={16} />,
                        show: permitido,
                        onClick: () => toast.info('Eliminar artículo: disponible al portar la mutación (Fase 4).'),
                      },
                    ]}
                  />
                </td>
                <td className="font-semibold">{a.id}</td>
                <td>{a.descripcion}</td>
                <td>{a.clasificacion}</td>
                <td>{naSiVacio(a.marca)}</td>
                <td>{naSiVacio(a.talla)}</td>
                <td>{naSiVacio(a.color)}</td>
                <td>{naSiVacio(a.tipo)}</td>
                <td>
                  <span
                    className={`app-status-pill ${a.identificador ? 'app-status-pill--success' : 'app-status-pill--muted'}`}
                  >
                    <span className="app-status-pill__dot" />
                    {a.identificador ? 'Sí' : 'No'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </CatalogoPage>
  );
}
