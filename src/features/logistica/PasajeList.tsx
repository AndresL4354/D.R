import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { usePasajes } from './hooks';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 20;

export function Component() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError } = usePasajes({ page, size: PAGE_SIZE });
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  return (
    <div>
      <ol className="app-breadcrumb">
        <li>Logística</li>
        <li className="active">· Pasajes</li>
      </ol>
      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Pasajes</h1>
            <p className="app-page-subtitle">{total} pasajes</p>
          </div>
        </div>
      </div>

      <div className="app-table-wrap">
        <table className="app-table app-table--hover">
          <thead>
            <tr>
              <th>Trabajador</th>
              <th>Servicio</th>
              <th>Tipo</th>
              <th>Medio</th>
              <th>Ruta</th>
              <th>Salida</th>
              <th>Llegada</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7}>
                  <div className="app-empty-state">
                    <Loader2 className="mx-auto animate-spin" size={22} />
                  </div>
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={7}>
                  <div className="app-empty-state" style={{ color: 'var(--app-color-danger)' }}>
                    Error al cargar pasajes.
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && !isError && rows.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="app-empty-state">
                    <p className="app-empty-state__title">Sin resultados</p>
                  </div>
                </td>
              </tr>
            )}
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.id_persona != null ? (data?.personas.get(p.id_persona) ?? '—') : '—'}</td>
                <td>{p.id_proyecto != null ? (data?.proyectos.get(p.id_proyecto) ?? '—') : '—'}</td>
                <td>{p.tipo ?? '—'}</td>
                <td>{p.medio ?? '—'}</td>
                <td>
                  {(p.desde ?? '—') + ' → ' + (p.hasta ?? '—')}
                </td>
                <td>{formatDate(p.fecha_salida)}</td>
                <td>{formatDate(p.fecha_llegada)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="app-pagination-bar">
        <div className="app-pagination-bar__meta">
          <strong>{total}</strong> pasajes
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            Anterior
          </button>
          <span>
            {page + 1} / {lastPage + 1}
          </span>
          <button className="btn btn-secondary btn-sm" disabled={page >= lastPage} onClick={() => setPage((p) => Math.min(lastPage, p + 1))}>
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
