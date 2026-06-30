import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Loader2 } from 'lucide-react';
import { useDespachos } from './hooks';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 20;

export function EstadoPill({ estado }: { estado: string | null }) {
  const mod =
    estado === 'ACTIVO'
      ? 'app-status-pill--success'
      : estado === 'INACTIVO'
        ? 'app-status-pill--warning'
        : estado === 'FINALIZADO'
          ? 'app-status-pill--info'
          : '';
  return (
    <span className={`app-status-pill ${mod}`}>
      <span className="app-status-pill__dot" />
      {estado ?? '—'}
    </span>
  );
}

/** Exportado como `Component` para el `lazy` del router. */
export function Component() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const debounced = useDebounce(search);
  const navigate = useNavigate();

  const { data, isLoading, isError } = useDespachos({ search: debounced, page, size: PAGE_SIZE });
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const proyectos = data?.proyectos;
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
  const fromN = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const toN = Math.min(total, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Despachos</h1>
            <p className="app-page-subtitle">{total} despachos</p>
          </div>
        </div>
      </div>

      <div className="app-toolbar">
        <div className="app-toolbar__filters">
          <input
            className="app-field__control"
            style={{ maxWidth: 300 }}
            placeholder="Buscar por nombre…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>
      </div>

      <div className="app-table-wrap">
        <table className="app-table app-table--hover">
          <thead>
            <tr>
              <th>Despacho</th>
              <th>Proyecto</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th style={{ width: 60 }} />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5}>
                  <div className="app-empty-state">
                    <Loader2 className="mx-auto animate-spin" size={22} />
                  </div>
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={5}>
                  <div className="app-empty-state" style={{ color: 'var(--app-color-danger)' }}>
                    Error al cargar despachos (¿tu rol tiene acceso?).
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && !isError && rows.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="app-empty-state">
                    <p className="app-empty-state__title">Sin resultados</p>
                  </div>
                </td>
              </tr>
            )}
            {rows.map((d) => (
              <tr key={d.id} onClick={() => navigate(`/despacho/${d.id}`)} style={{ cursor: 'pointer' }}>
                <td>{d.nombre_despacho ?? `#${d.id}`}</td>
                <td>{d.id_proyecto != null ? (proyectos?.get(d.id_proyecto) ?? d.id_proyecto) : '—'}</td>
                <td>
                  <EstadoPill estado={d.estado} />
                </td>
                <td>{formatDate(d.fecha_despacho)}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button className="btn-icon" title="Ver" onClick={() => navigate(`/despacho/${d.id}`)}>
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
          <button
            className="btn btn-secondary btn-sm"
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Anterior
          </button>
          <span>
            {page + 1} / {lastPage + 1}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page >= lastPage}
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
