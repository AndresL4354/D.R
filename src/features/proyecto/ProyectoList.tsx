import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Filter, Loader2 } from 'lucide-react';
import { useProyectos } from './hooks';
import { ESTADOS_PROYECTO } from './api';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 20;

export function ProyectoEstadoPill({ estado }: { estado: string | null }) {
  const mod =
    estado === 'ACTIVO'
      ? 'app-status-pill--success'
      : estado === 'FINALIZADO'
        ? ''
        : estado === 'INACTIVO'
          ? 'app-status-pill--warning'
          : '';
  return (
    <span className={`app-status-pill ${mod}`}>
      <span className="app-status-pill__dot" />
      {estado ?? '—'}
    </span>
  );
}

interface Filtros {
  nombre: string;
  estado: string;
  faena: string;
}
const EMPTY_FILTROS: Filtros = { nombre: '', estado: '', faena: '' };

/** Exportado como `Component` para el `lazy` del router. Lista de Servicios. */
export function Component() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Filtros>(EMPTY_FILTROS);
  const [applied, setApplied] = useState<Filtros>(EMPTY_FILTROS);
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useProyectos({ ...applied, page, size: PAGE_SIZE });
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
  const fromN = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const toN = Math.min(total, (page + 1) * PAGE_SIZE);

  const filtrar = () => {
    setApplied(draft);
    setPage(0);
  };
  const limpiar = () => {
    setDraft(EMPTY_FILTROS);
    setApplied(EMPTY_FILTROS);
    setPage(0);
  };

  return (
    <div>
      <ol className="app-breadcrumb">
        <li className="active">Servicios</li>
      </ol>

      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Servicios</h1>
            <p className="app-page-subtitle">
              Listado de servicios registrados · <strong>{total}</strong> resultados
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="app-card">
        <div className="app-card-header">
          <Filter size={16} className="app-card-header__icon" />
          <h4>Filtros</h4>
        </div>
        <div className="app-card-body">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--app-space-4)',
            }}
          >
            <div className="app-field">
              <label className="app-field__label">Nombre</label>
              <input
                className="app-field__control"
                value={draft.nombre}
                onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && filtrar()}
              />
            </div>
            <div className="app-field">
              <label className="app-field__label">Estado</label>
              <select
                className="app-field__control"
                value={draft.estado}
                onChange={(e) => setDraft((d) => ({ ...d, estado: e.target.value }))}
              >
                <option value="">Todos</option>
                {ESTADOS_PROYECTO.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="app-field">
              <label className="app-field__label">Faena</label>
              <input
                className="app-field__control"
                value={draft.faena}
                onChange={(e) => setDraft((d) => ({ ...d, faena: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && filtrar()}
              />
            </div>
          </div>

          <div className="app-filter-actions">
            <button type="button" className="btn btn-secondary" onClick={limpiar}>
              Limpiar
            </button>
            <button type="button" className="btn btn-primary" onClick={filtrar}>
              <Filter size={16} /> Filtrar
            </button>
          </div>
        </div>
      </div>

      {!isLoading && !isError && rows.length === 0 ? (
        <div className="app-card">
          <div className="app-card-body">
            <div className="app-empty-state">
              <p className="app-empty-state__title">No se encontraron servicios</p>
              <p>Ajusta los filtros o crea uno nuevo.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="app-table-wrap">
          <table className="app-table app-table--hover">
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Faena</th>
                <th>Fecha inicio</th>
                <th>Fecha fin</th>
                <th>Estado</th>
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
                      Error al cargar servicios.
                    </div>
                  </td>
                </tr>
              )}
              {rows.map((p) => (
                <tr key={p.id} onClick={() => navigate(`/proyecto/${p.id}`)} style={{ cursor: 'pointer' }}>
                  <td>
                    <strong>{p.nombre}</strong>
                  </td>
                  <td>{p.faena ?? '—'}</td>
                  <td>{formatDate(p.fecha_inicio)}</td>
                  <td>{formatDate(p.fecha_fin)}</td>
                  <td>
                    <ProyectoEstadoPill estado={p.estado} />
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button className="btn-icon" title="Ver" onClick={() => navigate(`/proyecto/${p.id}`)}>
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
