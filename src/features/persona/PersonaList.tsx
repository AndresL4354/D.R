import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Loader2, Pencil, Plus } from 'lucide-react';
import { usePersonas } from './hooks';
import { useDebounce } from '@/hooks/useDebounce';
import { formatRut } from '@/lib/utils';

const PAGE_SIZE = 20;

/** Exportado como `Component` para el `lazy` del router. */
export function Component() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const debounced = useDebounce(search);
  const navigate = useNavigate();

  const { data, isLoading, isError } = usePersonas({ search: debounced, page, size: PAGE_SIZE });
  const total = data?.total ?? 0;
  const rows = data?.rows ?? [];
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
  const fromN = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const toN = Math.min(total, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Personas</h1>
            <p className="app-page-subtitle">{total} registros</p>
          </div>
        </div>
        <div className="app-page-header__actions">
          <Link to="/persona/nueva" className="btn btn-primary">
            <Plus size={16} /> Nueva persona
          </Link>
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
              <th>Nombre</th>
              <th>RUT</th>
              <th>Empresa</th>
              <th>Email</th>
              <th style={{ width: 92 }} />
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
                    Error al cargar personas (¿credenciales / permisos?).
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
            {rows.map((p) => (
              <tr key={p.id} onClick={() => navigate(`/persona/${p.id}`)} style={{ cursor: 'pointer' }}>
                <td>{p.nombre_completo}</td>
                <td>{formatRut(p.numero_id)}</td>
                <td>{p.empresa}</td>
                <td>{p.email}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="app-row-actions">
                    <button className="btn-icon" title="Ver" onClick={() => navigate(`/persona/${p.id}`)}>
                      <Eye size={16} />
                    </button>
                    <button
                      className="btn-icon btn-icon--primary"
                      title="Editar"
                      onClick={() => navigate(`/persona/${p.id}/editar`)}
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
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
