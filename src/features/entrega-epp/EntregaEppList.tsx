import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eraser,
  Eye,
  Filter,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useEntregaFiltrosCatalogos, useEntregasFiltradas } from './hooks';
import { BODEGAS_ENTREGA, type EntregaListFilters } from './api';
import { useRole } from '@/features/auth/useRole';
import { formatMediumDatetime } from '@/lib/utils';

const PAGE_SIZE = 20;

interface Draft {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  rut: string;
  nombre: string;
  usuarioEntrega: string;
  idFaena: string;
  idProyecto: string;
}
const EMPTY: Draft = {
  id: '',
  fechaInicio: '',
  fechaFin: '',
  rut: '',
  nombre: '',
  usuarioEntrega: '',
  idFaena: '',
  idProyecto: '',
};

/** Menú kebab de acciones por fila (clon del mat-menu real). */
function RowMenu({ id, canDelete }: { id: number; canDelete: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  return (
    <div className="relative inline-block" ref={ref}>
      <button className="btn-icon btn-icon--primary" title="Acciones" onClick={() => setOpen((o) => !o)}>
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="app-navbar__dropdown app-navbar__dropdown--end" style={{ marginTop: 4 }}>
          <button className="app-navbar__dropdown-item" onClick={() => { setOpen(false); navigate(`/entrega-epp/${id}`); }}>
            <Eye size={16} /> <span>Ver</span>
          </button>
          <button className="app-navbar__dropdown-item" onClick={() => { setOpen(false); navigate(`/entrega-epp/${id}/editar`); }}>
            <Pencil size={16} /> <span>Editar</span>
          </button>
          {canDelete && (
            <button
              className="app-navbar__dropdown-item"
              onClick={() => {
                setOpen(false);
                toast.info('Eliminar entrega: disponible al portar la mutación (Fase 3).');
              }}
            >
              <Trash2 size={16} /> <span>Eliminar</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Exportado como `Component` para el `lazy` del router. Clon de entrega-epp.component.html (list). */
export function Component() {
  const { hasAnyRole } = useRole();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [applied, setApplied] = useState<EntregaListFilters>({});
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, refetch, isFetching } = useEntregasFiltradas(applied, page, PAGE_SIZE);
  const { data: cat } = useEntregaFiltrosCatalogos();

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
  const fromN = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const toN = Math.min(total, (page + 1) * PAGE_SIZE);

  const canDelete = hasAnyRole(['ROLE_ADMIN', 'SUPERADMINISTRADOR', 'SUPERADMINISTRADOR BP']);
  const filtrosActivos = Object.values(draft).filter(Boolean).length;

  const filtrar = () => {
    setApplied({
      id: draft.id,
      fechaInicio: draft.fechaInicio || null,
      fechaFin: draft.fechaFin || null,
      rut: draft.rut,
      nombre: draft.nombre,
      usuarioEntrega: draft.usuarioEntrega || null,
      idFaena: draft.idFaena ? Number(draft.idFaena) : null,
      idProyecto: draft.idProyecto ? Number(draft.idProyecto) : null,
    });
    setPage(0);
  };
  const limpiar = () => {
    setDraft(EMPTY);
    setApplied({});
    setPage(0);
  };
  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') filtrar();
  };

  return (
    <div>
      <ul className="app-breadcrumb">
        <li className="active">Entregas</li>
      </ul>

      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Entregas</h1>
            <p className="app-page-subtitle">
              Listado de entregas registradas
              {rows.length > 0 && (
                <>
                  {' '}
                  · <strong>{total}</strong> resultados
                </>
              )}
            </p>
          </div>
        </div>
        <div className="app-page-header__actions">
          <button type="button" className="btn btn-secondary" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={16} /> Refrescar
          </button>
          <Link to="/entrega-epp/nueva" className="btn btn-primary">
            <Plus size={16} /> Nueva entrega
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="app-card">
        <div className="app-card-header">
          <Filter className="app-card-header__icon" size={18} />
          <h4>Filtros</h4>
          {filtrosActivos > 0 && (
            <span className="app-status-pill app-status-pill--brand" style={{ marginLeft: 'auto' }}>
              {filtrosActivos} activos
            </span>
          )}
        </div>
        <div className="app-card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <input
              className="app-field__control"
              type="number"
              min={1}
              step={1}
              placeholder="ID Entrega"
              value={draft.id}
              onChange={(e) => setDraft({ ...draft, id: e.target.value })}
              onKeyDown={onEnter}
            />
            <label className="app-field">
              <span className="app-field__label">Fecha Inicio</span>
              <input
                type="date"
                className="app-field__control"
                value={draft.fechaInicio}
                max={draft.fechaFin || undefined}
                onChange={(e) => setDraft({ ...draft, fechaInicio: e.target.value })}
              />
            </label>
            <label className="app-field">
              <span className="app-field__label">Fecha Fin</span>
              <input
                type="date"
                className="app-field__control"
                value={draft.fechaFin}
                min={draft.fechaInicio || undefined}
                onChange={(e) => setDraft({ ...draft, fechaFin: e.target.value })}
              />
            </label>
            <input
              className="app-field__control"
              placeholder="RUT Trabajador"
              value={draft.rut}
              onChange={(e) => setDraft({ ...draft, rut: e.target.value })}
              onKeyDown={onEnter}
            />
            <input
              className="app-field__control"
              placeholder="Nombre Trabajador"
              value={draft.nombre}
              onChange={(e) => setDraft({ ...draft, nombre: e.target.value })}
              onKeyDown={onEnter}
            />
            <select
              className="app-field__control"
              value={draft.usuarioEntrega}
              onChange={(e) => setDraft({ ...draft, usuarioEntrega: e.target.value })}
            >
              <option value="">Entregado en — Todas las bodegas</option>
              {BODEGAS_ENTREGA.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select
              className="app-field__control"
              value={draft.idFaena}
              onChange={(e) => setDraft({ ...draft, idFaena: e.target.value })}
            >
              <option value="">Faena — Todas las faenas</option>
              {(cat?.faenas ?? []).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nombre}
                </option>
              ))}
            </select>
            <select
              className="app-field__control"
              value={draft.idProyecto}
              onChange={(e) => setDraft({ ...draft, idProyecto: e.target.value })}
            >
              <option value="">Servicio — Todos los servicios</option>
              {(cat?.servicios ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="app-filter-actions">
            <button type="button" className="btn btn-secondary" onClick={limpiar}>
              <Eraser size={16} /> Limpiar
            </button>
            <button type="button" className="btn btn-primary" onClick={filtrar}>
              <Filter size={16} /> Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="app-table-wrap">
        <table className="app-table app-table--hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Trabajador</th>
              <th>Faena</th>
              <th>Servicio</th>
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
                    Error al cargar entregas (¿tu rol tiene acceso?).
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && !isError && rows.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="app-empty-state">
                    <p className="app-empty-state__title">No se encontraron entregas</p>
                    Ajusta los filtros o crea una nueva.
                  </div>
                </td>
              </tr>
            )}
            {rows.map((e) => (
              <tr key={e.id}>
                <td>
                  <Link to={`/entrega-epp/${e.id}`} className="font-semibold text-foreground hover:underline">
                    #{e.id}
                  </Link>
                </td>
                <td>{formatMediumDatetime(e.fecha_creacion)}</td>
                <td>{e.usuario_entrega}</td>
                <td className="font-semibold">{e.trabajador}</td>
                <td>{e.faena}</td>
                <td>{e.servicio}</td>
                <td>
                  <RowMenu id={e.id} canDelete={canDelete} />
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
