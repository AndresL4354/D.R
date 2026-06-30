import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Eraser,
  Eye,
  Filter,
  Loader2,
  MoreVertical,
  Pencil,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useProyectoFaenas, useProyectos } from './hooks';
import { ESTADOS_PROYECTO, type ProyectoOrderKey } from './api';
import { useRole } from '@/features/auth/useRole';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 20;

export function ProyectoEstadoPill({ estado }: { estado: string | null }) {
  const mod =
    estado === 'ACTIVO'
      ? 'app-status-pill--success'
      : estado === 'FINALIZADO'
        ? 'app-status-pill--muted'
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
  fechaInicio: string;
  fechaFin: string;
}
const EMPTY: Filtros = { nombre: '', estado: '', faena: '', fechaInicio: '', fechaFin: '' };

/** Menú kebab del servicio (clon del mat-menu real). */
function RowMenu({ id, estado, canEdit, canFinalizar, canDelete }: {
  id: number;
  estado: string | null;
  canEdit: boolean;
  canFinalizar: boolean;
  canDelete: boolean;
}) {
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
  const finalizado = estado === 'FINALIZADO';
  const activo = estado === 'ACTIVO';
  return (
    <div className="relative inline-block" ref={ref}>
      <button className="btn-icon btn-icon--primary" title="Acciones" onClick={() => setOpen((o) => !o)}>
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="app-navbar__dropdown app-navbar__dropdown--end" style={{ marginTop: 4 }}>
          <button className="app-navbar__dropdown-item" onClick={() => { setOpen(false); navigate(`/proyecto/${id}`); }}>
            <Eye size={16} /> <span>Ver</span>
          </button>
          {canEdit && !finalizado && (
            <button className="app-navbar__dropdown-item" onClick={() => { setOpen(false); navigate(`/proyecto/${id}/editar`); }}>
              <Pencil size={16} /> <span>Editar</span>
            </button>
          )}
          {canFinalizar && activo && (
            <button className="app-navbar__dropdown-item" onClick={() => { setOpen(false); toast.info('Finalizar servicio: disponible al portar la mutación (Fase 3).'); }}>
              <CheckCircle size={16} /> <span>Finalizar</span>
            </button>
          )}
          {finalizado && (
            <button className="app-navbar__dropdown-item" onClick={() => { setOpen(false); toast.info('Activar servicio: disponible al portar la mutación (Fase 3).'); }}>
              <Play size={16} /> <span>Activar</span>
            </button>
          )}
          {canDelete && !finalizado && (
            <button className="app-navbar__dropdown-item" onClick={() => { setOpen(false); toast.info('Eliminar servicio: disponible al portar la mutación (Fase 3).'); }}>
              <Trash2 size={16} /> <span>Eliminar</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Exportado como `Component` para el `lazy` del router. Clon de proyecto.component.html (list). */
export function Component() {
  const { hasAnyRole } = useRole();
  const [draft, setDraft] = useState<Filtros>(EMPTY);
  const [applied, setApplied] = useState<Filtros>(EMPTY);
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState<ProyectoOrderKey>('nombre');
  const [asc, setAsc] = useState(true);

  const { data, isLoading, isError } = useProyectos({
    nombre: applied.nombre || undefined,
    estado: applied.estado || undefined,
    faena: applied.faena || undefined,
    fechaInicio: applied.fechaInicio || undefined,
    fechaFin: applied.fechaFin || undefined,
    orderBy,
    asc,
    page,
    size: PAGE_SIZE,
  });
  const { data: faenas } = useProyectoFaenas();

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
  const fromN = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const toN = Math.min(total, (page + 1) * PAGE_SIZE);

  const canCreate = hasAnyRole([
    'ROLE_ADMIN',
    'SUPERADMINISTRADOR',
    'SUPERADMINISTRADOR BP',
    'ENCARGADO_RRHH',
    'VALIDADOR_RRHH',
    'OPERACIONES',
  ]);
  const canEdit = hasAnyRole(['ROLE_ADMIN', 'ENCARGADO_RRHH', 'VALIDADOR_RRHH', 'OPERACIONES']);
  const canFinalizar = hasAnyRole(['ROLE_ADMIN', 'SUPERADMINISTRADOR', 'SUPERADMINISTRADOR BP', 'OPERACIONES']);
  const canDelete = hasAnyRole(['ROLE_ADMIN', 'SUPERADMINISTRADOR', 'SUPERADMINISTRADOR BP']);

  const filtrar = () => {
    setApplied(draft);
    setPage(0);
  };
  const limpiar = () => {
    setDraft(EMPTY);
    setApplied(EMPTY);
    setPage(0);
  };
  const sortBy = (key: ProyectoOrderKey) => {
    if (orderBy === key) setAsc((a) => !a);
    else {
      setOrderBy(key);
      setAsc(true);
    }
    setPage(0);
  };
  const arrow = (key: ProyectoOrderKey) => (orderBy === key ? (asc ? ' ▲' : ' ▼') : '');
  const sortable = { cursor: 'pointer', userSelect: 'none' as const };

  return (
    <div>
      <ul className="app-breadcrumb">
        <li className="active">Servicios</li>
      </ul>

      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Servicios</h1>
            <p className="app-page-subtitle">
              Listado de servicios registrados
              {total > 0 && (
                <>
                  {' '}
                  · <strong>{total}</strong> resultados
                </>
              )}
            </p>
          </div>
        </div>
        {canCreate && (
          <div className="app-page-header__actions">
            <Link to="/proyecto/nuevo" className="btn btn-primary">
              <Plus size={16} /> Nuevo servicio
            </Link>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="app-card">
        <div className="app-card-header">
          <Filter className="app-card-header__icon" size={18} />
          <h4>Filtros</h4>
        </div>
        <div className="app-card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <input
              className="app-field__control"
              placeholder="Nombre"
              maxLength={150}
              value={draft.nombre}
              onChange={(e) => setDraft({ ...draft, nombre: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && filtrar()}
            />
            <select
              className="app-field__control"
              value={draft.estado}
              onChange={(e) => setDraft({ ...draft, estado: e.target.value })}
            >
              <option value="">Estado</option>
              {ESTADOS_PROYECTO.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="app-field__control"
              value={draft.faena}
              onChange={(e) => setDraft({ ...draft, faena: e.target.value })}
            >
              <option value="">Faena</option>
              {(faenas ?? []).map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <label className="app-field">
              <span className="app-field__label">Fecha inicio</span>
              <input
                type="date"
                className="app-field__control"
                value={draft.fechaInicio}
                onChange={(e) => setDraft({ ...draft, fechaInicio: e.target.value })}
              />
            </label>
            <label className="app-field">
              <span className="app-field__label">Fecha fin</span>
              <input
                type="date"
                className="app-field__control"
                value={draft.fechaFin}
                onChange={(e) => setDraft({ ...draft, fechaFin: e.target.value })}
              />
            </label>
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

      <div className="app-table-wrap">
        <table className="app-table app-table--hover">
          <thead>
            <tr>
              <th style={sortable} onClick={() => sortBy('nombre')}>
                Servicio{arrow('nombre')}
              </th>
              <th>Faena</th>
              <th style={sortable} onClick={() => sortBy('fecha_inicio')}>
                Fecha inicio{arrow('fecha_inicio')}
              </th>
              <th style={sortable} onClick={() => sortBy('fecha_fin')}>
                Fecha fin{arrow('fecha_fin')}
              </th>
              <th style={sortable} onClick={() => sortBy('estado')}>
                Estado{arrow('estado')}
              </th>
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
            {!isLoading && !isError && rows.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="app-empty-state">
                    <p className="app-empty-state__title">No se encontraron servicios</p>
                    Ajusta los filtros o crea uno nuevo.
                  </div>
                </td>
              </tr>
            )}
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link to={`/proyecto/${p.id}`} className="font-semibold text-foreground hover:underline">
                    {p.nombre}
                  </Link>
                </td>
                <td>{p.faena ?? '—'}</td>
                <td>{formatDate(p.fecha_inicio)}</td>
                <td>{formatDate(p.fecha_fin)}</td>
                <td>
                  <ProyectoEstadoPill estado={p.estado} />
                </td>
                <td>
                  <RowMenu
                    id={p.id}
                    estado={p.estado}
                    canEdit={canEdit}
                    canFinalizar={canFinalizar}
                    canDelete={canDelete}
                  />
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
