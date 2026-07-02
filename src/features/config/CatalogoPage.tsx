import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, Loader2, Plus } from 'lucide-react';

/**
 * Chrome común de los catálogos de Configuraciones (clon del patrón real):
 * breadcrumb → page-header (Volver / Nuevo X) → [card Filtros] → empty state
 * o tabla. Las peculiaridades por catálogo (posición del kebab, pills, quirks
 * de filtros) viven en cada lista.
 */
export function CatalogoPage({
  breadcrumb,
  title,
  subtitleBase,
  count,
  countLabel = 'resultados',
  showVolver = true,
  nuevoLabel,
  onNuevo,
  filtros,
  filtroActions,
  isLoading,
  isError,
  emptyTitle,
  emptyHint,
  children,
}: {
  breadcrumb: string;
  title: string;
  subtitleBase: string;
  count: number;
  countLabel?: string;
  showVolver?: boolean;
  nuevoLabel: string;
  onNuevo: () => void;
  filtros?: ReactNode;
  filtroActions?: ReactNode;
  isLoading: boolean;
  isError: boolean;
  emptyTitle: string;
  emptyHint: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div>
      <ul className="app-breadcrumb">
        <li className="active">{breadcrumb}</li>
      </ul>

      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">{title}</h1>
            <p className="app-page-subtitle">
              {subtitleBase}
              {count > 0 && (
                <>
                  {' '}
                  · <strong>{count}</strong> {countLabel}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="app-page-header__actions">
          {showVolver && (
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} /> Volver
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={onNuevo}>
            <Plus size={16} /> {nuevoLabel}
          </button>
        </div>
      </div>

      {filtros && (
        <div className="app-card">
          <div className="app-card-header">
            <Filter className="app-card-header__icon" size={18} />
            <h4>Filtros</h4>
          </div>
          <div className="app-card-body">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtros}</div>
            {filtroActions && <div className="app-filter-actions">{filtroActions}</div>}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="app-empty-state">
          <Loader2 className="mx-auto animate-spin" size={22} />
        </div>
      )}
      {isError && (
        <div className="app-empty-state" style={{ color: 'var(--app-color-danger)' }}>
          Error al cargar el listado.
        </div>
      )}

      {!isLoading && !isError && count === 0 && (
        <div className="app-card">
          <div className="app-card-body">
            <div className="app-empty-state">
              <p className="app-empty-state__title">{emptyTitle}</p>
              {emptyHint}
            </div>
          </div>
        </div>
      )}

      {!isLoading && !isError && count > 0 && <div className="app-table-wrap">{children}</div>}
    </div>
  );
}
