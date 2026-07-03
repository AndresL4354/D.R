import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Download,
  Eraser,
  Eye,
  Filter,
  Loader2,
  MoreVertical,
  Pencil,
  PieChart,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDespachoFiltrosCatalogos, useDespachosFiltrados, useEliminarDespacho, useFinalizarDespacho } from './hooks';
import { ESTADOS_DESPACHO, listDespachosFiltrados, type DespachoListFilters, type DespachoListRow } from './api';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { downloadCsv } from '@/lib/export';
import { useRole } from '@/features/auth/useRole';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 20;

/** Pill de estado (reutilizada por DespachoDetail). */
export function EstadoPill({ estado }: { estado: string | null }) {
  const mod =
    estado === 'ACTIVO' || estado === 'FINALIZADO'
      ? 'app-status-pill--success'
      : estado === 'Cerrado'
        ? 'app-status-pill--muted'
        : estado === 'Borrador'
          ? 'app-status-pill--warning'
          : '';
  return (
    <span className={`app-status-pill ${mod}`}>
      <span className="app-status-pill__dot" />
      {estado ?? '—'}
    </span>
  );
}

function pctColor(pct: number) {
  return pct >= 80 ? 'var(--app-color-success)' : pct >= 40 ? 'var(--app-color-warning)' : 'var(--app-color-danger)';
}
function conteoColor(aprobados: number, total: number): string {
  if (total === 0) return 'muted';
  const pct = (aprobados / total) * 100;
  return pct >= 80 ? 'success' : pct >= 40 ? 'warning' : 'danger';
}

function Donut({ pct, label, value }: { pct: number; label: string; value: string }) {
  const style = { '--donut-percent': `${pct}%`, '--donut-color': pctColor(pct) } as CSSProperties;
  return (
    <div className="app-mini-kpi">
      <div className="app-donut app-donut--sm" style={style}>
        <span className="app-donut__value">{pct}%</span>
      </div>
      <div className="app-mini-kpi__body">
        <span className="app-mini-kpi__label">{label}</span>
        <span className="app-mini-kpi__value">{value}</span>
      </div>
    </div>
  );
}

interface Draft {
  idFaena: string;
  idProyecto: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
}
const EMPTY: Draft = { idFaena: '', idProyecto: '', estado: '', fechaInicio: '', fechaFin: '' };

function RowMenu({
  row,
  canFinalizar,
  canDelete,
  onFinalizar,
  onDelete,
}: {
  row: DespachoListRow;
  canFinalizar: boolean;
  canDelete: boolean;
  onFinalizar: (r: DespachoListRow) => void;
  onDelete: (r: DespachoListRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const id = row.id;
  const finalizado = row.estado === 'FINALIZADO';
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
          <button className="app-navbar__dropdown-item" onClick={() => { setOpen(false); navigate(`/despacho/${id}`); }}>
            <Eye size={16} /> <span>Ver</span>
          </button>
          {canFinalizar && !finalizado && (
            <button className="app-navbar__dropdown-item" onClick={() => { setOpen(false); onFinalizar(row); }}>
              <CheckCircle size={16} /> <span>Finalizar</span>
            </button>
          )}
          <button className="app-navbar__dropdown-item" onClick={() => { setOpen(false); navigate(`/despacho/${id}/editar`); }}>
            <Pencil size={16} /> <span>Editar</span>
          </button>
          {canDelete && (
            <button className="app-navbar__dropdown-item" onClick={() => { setOpen(false); onDelete(row); }}>
              <Trash2 size={16} /> <span>Eliminar</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const CATEGORIAS: { label: string; key: keyof DespachoListRow }[] = [
  { label: 'Acred', key: 'acreditados' },
  { label: 'Asis', key: 'asistencia' },
  { label: 'SSO', key: 'sso' },
  { label: 'Bod', key: 'bodega' },
  { label: 'Cur', key: 'cursos' },
  { label: 'Tra', key: 'transporte' },
];

/** Exportado como `Component` para el `lazy` del router. Clon de despacho.component.html (list). */
export function Component() {
  const { hasAnyRole } = useRole();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [applied, setApplied] = useState<DespachoListFilters>({});
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, refetch, isFetching } = useDespachosFiltrados(applied, page, PAGE_SIZE);
  const { data: cat } = useDespachoFiltrosCatalogos();

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
  const fromN = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const toN = Math.min(total, (page + 1) * PAGE_SIZE);

  const canFinalizar = hasAnyRole(['ROLE_ADMIN', 'DESPACHO_ADMINISTRADOR']);
  const canDelete = hasAnyRole(['ROLE_ADMIN', 'SUPERADMINISTRADOR', 'SUPERADMINISTRADOR BP']);

  const finalizarMut = useFinalizarDespacho();
  const eliminarMut = useEliminarDespacho();
  const [aEliminar, setAEliminar] = useState<DespachoListRow | null>(null);
  const onFinalizar = async (r: DespachoListRow) => {
    try {
      await finalizarMut.mutateAsync(r.id);
      toast.success(`Despacho con id ${r.id} ha sido FINALIZADO correctamente.`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const doEliminar = async () => {
    if (!aEliminar) return;
    try {
      await eliminarMut.mutateAsync(aEliminar.id);
      toast.success('Despacho eliminado.');
      setAEliminar(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  // Exporta TODOS los despachos del filtro actual (con cumplimiento) a CSV/Excel.
  const [exportando, setExportando] = useState(false);
  const onDescargar = async () => {
    setExportando(true);
    try {
      const { rows: all } = await listDespachosFiltrados(applied, 0, 100000);
      downloadCsv<DespachoListRow>(
        'despachos',
        [
          { header: 'Servicio', value: (r) => r.proyecto_nombre },
          { header: 'Faena', value: (r) => r.faena },
          { header: 'Despacho', value: (r) => r.nombre_despacho },
          { header: 'Fecha', value: (r) => (r.fecha_despacho ?? '').slice(0, 10) },
          { header: 'Estado', value: (r) => r.estado },
          { header: 'Total personas', value: (r) => r.total_personas },
          { header: 'Acreditados', value: (r) => r.acreditados },
          { header: 'Asistencia', value: (r) => r.asistencia },
          { header: 'SSO', value: (r) => r.sso },
          { header: 'Bodega', value: (r) => r.bodega },
          { header: 'Cursos', value: (r) => r.cursos },
          { header: 'Transporte', value: (r) => r.transporte },
          { header: 'Despachados', value: (r) => r.despachados },
          { header: 'Cumplimiento %', value: (r) => r.cumplimiento },
        ],
        all,
      );
      toast.success(`${all.length} despachos exportados.`);
    } catch (e) {
      toast.error(`No se pudo exportar: ${(e as Error).message}`);
    } finally {
      setExportando(false);
    }
  };

  // KPIs del día (recomputados sobre la página actual, como el real).
  const hoy = new Date();
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  const hoyRows = rows.filter((r) => (r.fecha_despacho ?? '').slice(0, 10) === hoyStr);
  const totalDia = hoyRows.length;
  const completadosDia = hoyRows.filter((r) => (r.cumplimiento ?? 0) >= 100).length;
  const pctDespachos = totalDia > 0 ? Math.round((completadosDia / totalDia) * 100) : 0;
  const personasProg = hoyRows.reduce((a, r) => a + (r.total_personas ?? 0), 0);
  const personasDesp = hoyRows.reduce((a, r) => a + (r.despachados ?? 0), 0);
  const pctPersonas = personasProg > 0 ? Math.round((personasDesp / personasProg) * 100) : 0;

  const filtrosActivos = [draft.idFaena, draft.idProyecto, draft.estado, draft.fechaInicio, draft.fechaFin].filter(Boolean).length;

  const filtrar = () => {
    setApplied({
      idFaena: draft.idFaena ? Number(draft.idFaena) : null,
      idProyecto: draft.idProyecto ? Number(draft.idProyecto) : null,
      estado: draft.estado || null,
      fechaInicio: draft.fechaInicio || null,
      fechaFin: draft.fechaFin || null,
    });
    setPage(0);
  };
  const limpiar = () => {
    setDraft(EMPTY);
    setApplied({});
    setPage(0);
  };

  const rowClass = (r: DespachoListRow) =>
    r.estado === 'FINALIZADO'
      ? 'app-table-row--success'
      : r.estado === 'ACTIVO' && (r.cumplimiento ?? 0) < 50
        ? 'app-table-row--danger'
        : '';

  return (
    <div>
      <ul className="app-breadcrumb">
        <li className="active">Despachos</li>
      </ul>

      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Despachos</h1>
            <p className="app-page-subtitle">
              Listado de despachos registrados
              {total > 0 && (
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
          <button type="button" className="btn btn-secondary" onClick={onDescargar} disabled={exportando}>
            <Download size={16} /> {exportando ? 'Exportando…' : 'Descargar'}
          </button>
          <Link to="/despacho/nuevo" className="btn btn-primary">
            <Plus size={16} /> Nuevo despacho
          </Link>
        </div>
      </div>

      {/* Resumen cumplimiento despachos del día */}
      <div className="app-card">
        <div className="app-card-header">
          <PieChart className="app-card-header__icon" size={18} />
          <h4>Resumen cumplimiento despachos del día</h4>
          <span className="app-card-header__meta">{totalDia} despachos hoy</span>
        </div>
        <div className="app-card-body">
          <div className="app-mini-kpi-grid">
            <Donut pct={pctDespachos} label="Despachos" value={`${completadosDia} / ${totalDia}`} />
            <Donut pct={pctPersonas} label="Personas despachadas" value={`${personasDesp} / ${personasProg}`} />
          </div>
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
            <select
              className="app-field__control"
              value={draft.idFaena}
              onChange={(e) => setDraft({ ...draft, idFaena: e.target.value })}
            >
              <option value="">Faena</option>
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
              <option value="">Servicio</option>
              {(cat?.servicios ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
            <select
              className="app-field__control"
              value={draft.estado}
              onChange={(e) => setDraft({ ...draft, estado: e.target.value })}
            >
              <option value="">Estado</option>
              {ESTADOS_DESPACHO.map((s) => (
                <option key={s} value={s}>
                  {s}
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

      {/* Tabla */}
      <div className="app-table-wrap">
        <table className="app-table app-table--hover">
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Faena</th>
              <th>Despacho</th>
              <th>Fecha</th>
              <th>Estado</th>
              {CATEGORIAS.map((c) => (
                <th key={c.label}>{c.label}</th>
              ))}
              <th>Cumplimiento</th>
              <th style={{ width: 56 }} />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={13}>
                  <div className="app-empty-state">
                    <Loader2 className="mx-auto animate-spin" size={22} />
                  </div>
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={13}>
                  <div className="app-empty-state" style={{ color: 'var(--app-color-danger)' }}>
                    Error al cargar despachos (¿tu rol tiene acceso?).
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && !isError && rows.length === 0 && (
              <tr>
                <td colSpan={13}>
                  <div className="app-empty-state">
                    <p className="app-empty-state__title">No se encontraron despachos</p>
                    Ajusta los filtros o crea uno nuevo.
                  </div>
                </td>
              </tr>
            )}
            {rows.map((d) => {
              const tp = d.total_personas ?? 0;
              const cmp = d.cumplimiento ?? 0;
              const barMod = cmp >= 80 ? 'app-progress__bar--success' : cmp >= 40 ? 'app-progress__bar--warning' : 'app-progress__bar--danger';
              return (
                <tr key={d.id} className={rowClass(d)}>
                  <td>
                    <Link to={`/despacho/${d.id}`} className="font-semibold text-foreground hover:underline">
                      {d.proyecto_nombre}
                    </Link>
                  </td>
                  <td>{d.faena}</td>
                  <td className="font-semibold">{d.nombre_despacho ?? `#${d.id}`}</td>
                  <td>{formatDate(d.fecha_despacho)}</td>
                  <td>
                    <EstadoPill estado={d.estado} />
                  </td>
                  {CATEGORIAS.map((c) => {
                    const ap = (d[c.key] as number) ?? 0;
                    return (
                      <td key={c.label}>
                        <span className="app-conteo" data-color={conteoColor(ap, tp)}>
                          {tp === 0 ? '—' : `${ap}/${tp}`}
                        </span>
                      </td>
                    );
                  })}
                  <td>
                    <div className="app-progress-cell">
                      <div className="app-progress" style={{ ['--progress' as string]: `${cmp}%` } as CSSProperties}>
                        <div className={`app-progress__bar ${barMod}`} />
                      </div>
                      <span className="app-progress-cell__pct">{cmp}%</span>
                    </div>
                  </td>
                  <td>
                    <RowMenu row={d} canFinalizar={canFinalizar} canDelete={canDelete} onFinalizar={onFinalizar} onDelete={setAEliminar} />
                  </td>
                </tr>
              );
            })}
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

      <ConfirmDialog
        open={aEliminar != null}
        title="Eliminar despacho"
        confirmLabel="Eliminar"
        busy={eliminarMut.isPending}
        onCancel={() => setAEliminar(null)}
        onConfirm={doEliminar}
      >
        <p>
          ¿Confirmas que deseas eliminar el despacho <strong>{aEliminar?.nombre_despacho ?? `#${aEliminar?.id}`}</strong>?
        </p>
      </ConfirmDialog>
    </div>
  );
}
