import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Loader2 } from 'lucide-react';
import { useReportesFlash } from './hooks';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 20;

export function Component() {
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const { data, isLoading, isError } = useReportesFlash({ page, size: PAGE_SIZE });
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  return (
    <div>
      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Reportes Flash</h1>
            <p className="app-page-subtitle">{total} reportes de incidente</p>
          </div>
        </div>
      </div>

      <div className="app-table-wrap">
        <table className="app-table app-table--hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha incidente</th>
              <th>Clasificación</th>
              <th>Faena</th>
              <th>Empresa cliente</th>
              <th>Estado</th>
              <th style={{ width: 56 }} />
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
                    Error al cargar (solo admin puede ver reportes por ahora).
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && !isError && rows.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="app-empty-state">
                    <p className="app-empty-state__title">Sin reportes</p>
                  </div>
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} onClick={() => navigate(`/reporte-flash/${r.id}`)} style={{ cursor: 'pointer' }}>
                <td>{r.id}</td>
                <td>{formatDate(r.fecha_incidente)}</td>
                <td>{r.clasificacion ?? '—'}</td>
                <td>{r.faena ?? '—'}</td>
                <td>{r.empresa_cliente ?? '—'}</td>
                <td>
                  <span className="app-badge app-badge--info">{r.estado ?? '—'}</span>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button className="btn-icon" title="Ver" onClick={() => navigate(`/reporte-flash/${r.id}`)}>
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="app-pagination-bar">
        <div className="app-pagination-bar__meta">
          <strong>{total}</strong> reportes
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
