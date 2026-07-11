import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Ban,
  ClipboardList,
  Filter,
  Loader2,
  RefreshCw,
  Star,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePersona, useServiciosPersona } from './hooks';
import type { ServicioHistoricoRow } from './api';
import { formatDate } from '@/lib/utils';

/**
 * Sub-página "Servicios" de la ficha (clon de persona/servicios/servicios.component):
 * historial read-only de asociaciones persona_proyecto (excluye ELIMINADO,
 * incluye BACKUP; orden backend = pp.id DESC y la primera fila es `actual`).
 * KPIs + filtros client-side (selects autopoblados con distinct del dataset) +
 * tabla ordenable por columna. Sin gating por rol (solo autenticación), fiel.
 * Quirks replicados: opciones de filtro trim() pero comparación sin trim,
 * filtros de fecha excluyen filas sin fecha, badge Estado siempre muted,
 * card Filtros oculta sin datos, pill "X de Y registros" siempre visible.
 */

type SortKey = 'servicio' | 'faena' | 'cargo' | 'fecha' | 'estado' | 'acred';

function distinct(values: Array<string | null | undefined>): string[] {
  const set = new Set<string>();
  for (const v of values) {
    const t = (v ?? '').trim();
    if (t) set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

function valorColumna(s: ServicioHistoricoRow, key: SortKey): string | number {
  switch (key) {
    case 'servicio':
      return (s.nombre_servicio ?? '').toLowerCase();
    case 'faena':
      return (s.faena ?? '').toLowerCase();
    case 'cargo':
      return (s.nombre_cargo ?? '').toLowerCase();
    case 'estado':
      return (s.estado ?? '').toLowerCase();
    case 'fecha':
      return s.fecha_creacion ? new Date(s.fecha_creacion).valueOf() : 0;
    case 'acred':
      return s.acreditado ? 1 : 0;
    default:
      return '';
  }
}

const FILTROS_VACIOS = {
  servicio: '',
  faena: '',
  cargo: '',
  estado: '',
  acred: '',
  fechaDesde: '',
  fechaHasta: '',
};

/** Exportado como `Component` para el `lazy` del router. */
export function Component() {
  const { id } = useParams();
  const personaId = Number(id);
  const { data: persona } = usePersona(personaId);
  const { data, isLoading, isError, errorUpdatedAt, refetch, isFetching } =
    useServiciosPersona(personaId);

  const [f, setF] = useState(FILTROS_VACIOS);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  // En error el original alerta EN CADA intento fallido (y conserva lo que
  // hubiera). errorUpdatedAt cambia en cada fetch fallido, incluidos los
  // reintentos del botón Refrescar; el toast global se suprime vía meta.
  useEffect(() => {
    if (isError) toast.warning('Se presentó un error al cargar los servicios del trabajador');
  }, [isError, errorUpdatedAt]);

  const servicios = useMemo(() => data ?? [], [data]);
  const servicioActual = servicios.find((s) => s.actual);
  const totalServicios = servicios.length;

  const faenas = useMemo(() => distinct(servicios.map((s) => s.faena)), [servicios]);
  const cargos = useMemo(() => distinct(servicios.map((s) => s.nombre_cargo)), [servicios]);
  const estados = useMemo(() => distinct(servicios.map((s) => s.estado)), [servicios]);
  const totalCargos = cargos.length;

  const hayFiltrosActivos =
    !!f.servicio || !!f.faena || !!f.cargo || !!f.estado || !!f.acred || !!f.fechaDesde || !!f.fechaHasta;

  const serviciosFiltrados = useMemo(() => {
    const pasa = (s: ServicioHistoricoRow): boolean => {
      if (f.servicio && !(s.nombre_servicio ?? '').toLowerCase().includes(f.servicio.toLowerCase()))
        return false;
      // Igualdad estricta contra el valor crudo (sin trim) — quirk fiel: un
      // valor de BD con espacios al borde nunca matchea su propia opción.
      if (f.faena && (s.faena ?? '') !== f.faena) return false;
      if (f.cargo && (s.nombre_cargo ?? '') !== f.cargo) return false;
      if (f.estado && (s.estado ?? '') !== f.estado) return false;
      if (f.acred === 'SI' && !s.acreditado) return false;
      if (f.acred === 'NO' && s.acreditado) return false;
      // Con filtro de fecha activo, filas SIN fecha quedan excluidas (fiel).
      if (f.fechaDesde) {
        if (!s.fecha_creacion) return false;
        if (new Date(s.fecha_creacion) < new Date(`${f.fechaDesde}T00:00:00`)) return false;
      }
      if (f.fechaHasta) {
        if (!s.fecha_creacion) return false;
        if (new Date(s.fecha_creacion) > new Date(`${f.fechaHasta}T23:59:59.999`)) return false;
      }
      return true;
    };
    const list = servicios.filter(pasa);
    if (!sortKey) return list; // orden del backend (pp.id DESC), fiel
    const sorted = [...list].sort((a, b) => {
      const va = valorColumna(a, sortKey);
      const vb = valorColumna(b, sortKey);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [servicios, f, sortKey, sortAsc]);

  const ordenarColumna = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };
  const iconoOrden = (key: SortKey) => (sortKey !== key ? '' : sortAsc ? ' ▲' : ' ▼');
  const fmtFecha = (v: string | null) => (v ? formatDate(v) || '—' : '—');

  const thSort = { cursor: 'pointer', userSelect: 'none' } as const;

  return (
    <div className="container-fluid">
      <ol className="app-breadcrumb">
        <li>
          <Link to="/persona">Personas</Link>
        </li>
        <li>›</li>
        <li>
          <Link to={`/persona/${personaId}`}>Detalle</Link>
        </li>
        <li>›</li>
        <li className="active">Servicios</li>
      </ol>

      <div className="app-page-header">
        <div className="app-page-header__main">
          <h1 className="app-page-title">Servicios</h1>
          {persona?.nombre_completo && (
            <p className="app-page-subtitle">
              <strong>{persona.nombre_completo}</strong>
              {totalServicios > 0 && (
                <>
                  {' '}
                  · <strong>{totalServicios}</strong> servicios
                </>
              )}
            </p>
          )}
        </div>
        <div className="app-page-header__actions">
          <button type="button" className="btn btn-secondary" onClick={() => window.history.back()}>
            <ArrowLeft size={16} /> Volver
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={isLoading || isFetching}
            onClick={() => refetch()}
          >
            {isLoading || isFetching ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}{' '}
            Refrescar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="app-info-strip">
        <div className="app-info-strip__item">
          <span className="app-info-strip__label">Total de servicios</span>
          <span className="app-info-strip__value app-info-strip__value--brand">{totalServicios}</span>
        </div>
        <div className="app-info-strip__item">
          <span className="app-info-strip__label">Cargos distintos</span>
          <span className="app-info-strip__value">{totalCargos}</span>
        </div>
        <div className="app-info-strip__item">
          <span className="app-info-strip__label">Servicio actual</span>
          <span className="app-info-strip__value app-info-strip__value--lg">
            {servicioActual?.nombre_servicio || '—'}
          </span>
        </div>
        <div className="app-info-strip__item">
          <span className="app-info-strip__label">Cargo actual</span>
          <span className="app-info-strip__value app-info-strip__value--lg">
            {servicioActual?.nombre_cargo || '—'}
          </span>
        </div>
      </div>

      {/* Filtros — oculta cuando no hay datos (también durante la 1ª carga, fiel) */}
      {totalServicios > 0 && (
        <div className="app-card">
          <div className="app-card-header">
            <Filter className="app-card-header__icon" size={18} />
            <h4>Filtros</h4>
            <div className="app-card-header__actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={!hayFiltrosActivos}
                onClick={() => setF(FILTROS_VACIOS)}
              >
                <Ban size={14} /> Limpiar
              </button>
            </div>
          </div>
          <div className="app-card-body">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="app-field">
                <span className="app-field__label">Servicio</span>
                <input
                  className="app-field__control"
                  placeholder="Nombre del servicio"
                  value={f.servicio}
                  onChange={(e) => setF({ ...f, servicio: e.target.value })}
                />
              </label>
              <label className="app-field">
                <span className="app-field__label">Faena</span>
                <select
                  className="app-field__control"
                  value={f.faena}
                  onChange={(e) => setF({ ...f, faena: e.target.value })}
                >
                  <option value="">Todas</option>
                  {faenas.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </label>
              <label className="app-field">
                <span className="app-field__label">Cargo</span>
                <select
                  className="app-field__control"
                  value={f.cargo}
                  onChange={(e) => setF({ ...f, cargo: e.target.value })}
                >
                  <option value="">Todos</option>
                  {cargos.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </label>
              <label className="app-field">
                <span className="app-field__label">Estado</span>
                <select
                  className="app-field__control"
                  value={f.estado}
                  onChange={(e) => setF({ ...f, estado: e.target.value })}
                >
                  <option value="">Todos</option>
                  {estados.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </label>
              <label className="app-field">
                <span className="app-field__label">Acreditado</span>
                <select
                  className="app-field__control"
                  value={f.acred}
                  onChange={(e) => setF({ ...f, acred: e.target.value })}
                >
                  <option value="">Todos</option>
                  <option value="SI">Acreditados</option>
                  <option value="NO">No acreditados</option>
                </select>
              </label>
              <label className="app-field">
                <span className="app-field__label">Fecha desde</span>
                <input
                  type="date"
                  className="app-field__control"
                  value={f.fechaDesde}
                  onChange={(e) => setF({ ...f, fechaDesde: e.target.value })}
                />
              </label>
              <label className="app-field">
                <span className="app-field__label">Fecha hasta</span>
                <input
                  type="date"
                  className="app-field__control"
                  value={f.fechaHasta}
                  onChange={(e) => setF({ ...f, fechaHasta: e.target.value })}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Historial */}
      <div className="app-card">
        <div className="app-card-header">
          <ClipboardList className="app-card-header__icon" size={18} />
          <h4>Historial de servicios</h4>
          <span className="app-status-pill">
            {serviciosFiltrados.length} de {totalServicios} registros
          </span>
        </div>
        <div className="app-card-body">
          {!isLoading && totalServicios === 0 ? (
            <div className="app-empty-state">
              <ClipboardList className="app-empty-state__icon" size={40} />
              <p className="app-empty-state__title">Sin servicios registrados</p>
              <p className="app-empty-state__hint">
                Este trabajador aún no ha sido asociado a ningún servicio.
              </p>
            </div>
          ) : totalServicios > 0 && serviciosFiltrados.length === 0 ? (
            <div className="app-empty-state">
              <Filter className="app-empty-state__icon" size={40} />
              <p className="app-empty-state__title">Sin coincidencias</p>
              <p className="app-empty-state__hint">Ajusta o limpia los filtros para ver resultados.</p>
            </div>
          ) : serviciosFiltrados.length > 0 ? (
            <div className="app-table-wrap">
              <table className="app-table app-table--hover" aria-describedby="page-heading">
                <thead>
                  <tr>
                    <th scope="col" style={thSort} onClick={() => ordenarColumna('servicio')}>
                      Servicio{iconoOrden('servicio')}
                    </th>
                    <th scope="col" style={thSort} onClick={() => ordenarColumna('faena')}>
                      Faena{iconoOrden('faena')}
                    </th>
                    <th scope="col" style={thSort} onClick={() => ordenarColumna('cargo')}>
                      Cargo{iconoOrden('cargo')}
                    </th>
                    <th scope="col" style={thSort} onClick={() => ordenarColumna('fecha')}>
                      Fecha agregado{iconoOrden('fecha')}
                    </th>
                    <th scope="col" style={thSort} onClick={() => ordenarColumna('estado')}>
                      Estado{iconoOrden('estado')}
                    </th>
                    <th scope="col" style={thSort} onClick={() => ordenarColumna('acred')}>
                      Acred.{iconoOrden('acred')}
                    </th>
                    <th scope="col"></th>
                  </tr>
                </thead>
                <tbody>
                  {serviciosFiltrados.map((s, i) => (
                    <tr
                      key={`${s.id_proyecto}-${i}`}
                      className={s.actual ? 'app-table-row--active' : undefined}
                    >
                      <td>
                        <strong>{s.nombre_servicio || '—'}</strong>
                        {s.nuevo && (
                          <span
                            className="app-badge app-badge--info"
                            style={{ marginLeft: 'var(--app-space-2)' }}
                            title="Era personal nuevo en este servicio"
                          >
                            <UserPlus size={12} /> Nuevo
                          </span>
                        )}
                      </td>
                      <td>{s.faena || '—'}</td>
                      <td>{s.nombre_cargo || '—'}</td>
                      <td>{fmtFecha(s.fecha_creacion)}</td>
                      <td>
                        <span className="app-badge app-badge--muted">{s.estado || '—'}</span>
                      </td>
                      <td>
                        <span className={`app-check ${s.acreditado ? 'app-check--ok' : 'app-check--no'}`}>
                          {s.acreditado ? '✓' : '✕'}
                        </span>
                      </td>
                      <td>
                        {s.actual && (
                          <span
                            className="app-badge app-badge--success"
                            title="Último servicio al que fue agregado"
                          >
                            <Star size={12} /> Actual
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
