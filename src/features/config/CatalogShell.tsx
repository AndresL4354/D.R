import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export interface Col<T> {
  header: string;
  cell: (row: T) => ReactNode;
}

interface Props<T> {
  title: string;
  cols: Col<T>[];
  rows: T[];
  isLoading: boolean;
  isError: boolean;
}

/** Tabla de catálogo de configuración (read-only) con el diseño real .app-*. */
export function CatalogShell<T extends { id: number }>({
  title,
  cols,
  rows,
  isLoading,
  isError,
}: Props<T>) {
  return (
    <div>
      <ol className="app-breadcrumb">
        <li>Configuración</li>
        <li className="active">· {title}</li>
      </ol>

      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">{title}</h1>
            <p className="app-page-subtitle">{rows.length} registros</p>
          </div>
        </div>
      </div>

      <div className="app-table-wrap">
        <table className="app-table app-table--hover">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.header}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={cols.length}>
                  <div className="app-empty-state">
                    <Loader2 className="mx-auto animate-spin" size={22} />
                  </div>
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={cols.length}>
                  <div className="app-empty-state" style={{ color: 'var(--app-color-danger)' }}>
                    Error al cargar.
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && !isError && rows.length === 0 && (
              <tr>
                <td colSpan={cols.length}>
                  <div className="app-empty-state">
                    <p className="app-empty-state__title">Sin registros</p>
                  </div>
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                {cols.map((c) => (
                  <td key={c.header}>{c.cell(r) ?? '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
