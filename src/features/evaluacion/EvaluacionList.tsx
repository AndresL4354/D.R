import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Loader2 } from 'lucide-react';
import { useEvaluaciones } from './hooks';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 20;

export function Component() {
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const { data, isLoading, isError } = useEvaluaciones({ page, size: PAGE_SIZE });
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
  const fromN = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const toN = Math.min(total, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Evaluaciones</h1>
            <p className="app-page-subtitle">{total} evaluaciones</p>
          </div>
        </div>
      </div>

      <div className="app-table-wrap">
        <table className="app-table app-table--hover">
          <thead>
            <tr>
              <th>Trabajador</th>
              <th>Servicio</th>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Promedio</th>
              <th style={{ width: 56 }} />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6}>
                  <div className="app-empty-state">
                    <Loader2 className="mx-auto animate-spin" size={22} />
                  </div>
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={6}>
                  <div className="app-empty-state" style={{ color: 'var(--app-color-danger)' }}>
                    Error al cargar evaluaciones.
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && !isError && rows.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="app-empty-state">
                    <p className="app-empty-state__title">Sin resultados</p>
                  </div>
                </td>
              </tr>
            )}
            {rows.map((e) => (
              <tr key={e.id} onClick={() => navigate(`/evaluacion/${e.id}`)} style={{ cursor: 'pointer' }}>
                <td>{e.id_persona != null ? (data?.personas.get(e.id_persona) ?? '—') : '—'}</td>
                <td>{e.id_proyecto != null ? (data?.proyectos.get(e.id_proyecto) ?? '—') : '—'}</td>
                <td>{formatDate(e.fecha)}</td>
                <td>{e.tipo ?? '—'}</td>
                <td>
                  <strong>{e.promedio != null ? e.promedio.toFixed(2) : '—'}</strong>
                </td>
                <td onClick={(ev) => ev.stopPropagation()}>
                  <button className="btn-icon" title="Ver" onClick={() => navigate(`/evaluacion/${e.id}`)}>
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
          Mostrando{' '}
          <strong>
            {fromN}–{toN}
          </strong>{' '}
          de <strong>{total}</strong>
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
