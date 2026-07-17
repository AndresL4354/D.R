import { useMemo, useState } from 'react';
import {
  Ban,
  FileSpreadsheet,
  Filter,
  IdCard,
  List,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Workbook } from 'exceljs';
import {
  ROLES_EDITAR_LICENCIAS,
  type LicenciaSpotInput,
  type LicenciaSpotRow,
  type ResumenLicencias,
} from './api';
import {
  useBuscarPersonasLicencia,
  useEliminarLicenciaSpot,
  useGuardarLicenciaSpot,
  useLicenciasSpot,
} from './hooks';
import { useAuth } from '@/features/auth/useAuth';
import { useRole } from '@/features/auth/useRole';

/**
 * Licencias Spot (clon de licencias-spot.component, commits e46b3b5/983ccf3):
 * visor de vigencia de licencia MEL + licencia interna Gesta del personal
 * Spot. KPIs clicables (toggle de filtro), buscador RUT/nombre, filtros por
 * cargo/estado/Gesta, toggle de vista tarjetas/lista (vigentes primero — el
 * orden viene de la RPC), export Excel client-side (mismas 8 columnas del
 * POI original) y CRUD gateado a ROLE_ADMIN/SUPERADMINISTRADOR/RECLUTADOR.
 */

const RESUMEN_VACIO: ResumenLicencias = {
  total: 0,
  vigentes: 0,
  porVencer: 0,
  vencidas: 0,
  sinFecha: 0,
  conGesta: 0,
  sinGesta: 0,
};

function estadoPillClase(estado: string | null | undefined): string {
  switch (estado) {
    case 'VIGENTE':
      return 'app-status-pill--success';
    case 'POR_VENCER':
      return 'app-status-pill--warning';
    case 'VENCIDA':
      return 'app-status-pill--danger';
    default:
      return '';
  }
}

function estadoLabel(estado: string | null | undefined): string {
  switch (estado) {
    case 'VIGENTE':
      return 'Vigente';
    case 'POR_VENCER':
      return 'Por vencer';
    case 'VENCIDA':
      return 'Vencida';
    case 'SIN_FECHA':
      return 'Sin fecha';
    default:
      return '—';
  }
}

function colorEstado(estado: string | null | undefined): string {
  switch (estado) {
    case 'VIGENTE':
      return 'var(--app-color-success, #10b981)';
    case 'POR_VENCER':
      return 'var(--app-color-warning, #f59e0b)';
    case 'VENCIDA':
      return 'var(--app-color-danger, #ef4444)';
    default:
      return 'var(--app-text-muted, #9ca3af)';
  }
}

function fmtFecha(iso: string | null | undefined): string {
  if (!iso) return '';
  const partes = iso.split('-');
  if (partes.length !== 3) return iso;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function textoDias(l: LicenciaSpotRow): string {
  if (l.dias_restantes === null || l.dias_restantes === undefined) return '—';
  const d = l.dias_restantes;
  if (d < 0) return `Vencida hace ${Math.abs(d)} d`;
  if (d === 0) return 'Vence hoy';
  return `${d} d`;
}

const kpiBtn: React.CSSProperties = {
  flex: '1 1 120px',
  border: '1px solid var(--app-border, #e5e7eb)',
  borderRadius: 10,
  padding: 12,
  background: 'var(--app-surface, #fff)',
  cursor: 'pointer',
  textAlign: 'left',
};
const kpiNum: React.CSSProperties = { fontSize: 26, fontWeight: 700 };
const kpiLbl: React.CSSProperties = { color: 'var(--app-text-muted, #6b7280)', fontSize: 13 };
const lblFiltro: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  color: 'var(--app-text-muted, #6b7280)',
};

/** Exportado como `Component` para el `lazy` del router. */
export function Component() {
  const { user } = useAuth();
  const { hasAnyRole } = useRole();
  const puedeEditar = hasAnyRole(ROLES_EDITAR_LICENCIAS);
  const login = user?.email ?? '';

  const { data, isLoading, refetch, isFetching } = useLicenciasSpot();
  const guardarMut = useGuardarLicenciaSpot();
  const eliminarMut = useEliminarLicenciaSpot();

  const [vista, setVista] = useState<'tarjetas' | 'lista'>('tarjetas');
  const [search, setSearch] = useState('');
  const [cargoFiltro, setCargoFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [gestaFiltro, setGestaFiltro] = useState('');

  const [editar, setEditar] = useState<LicenciaSpotRow | 'nueva' | null>(null);
  const [aEliminar, setAEliminar] = useState<LicenciaSpotRow | null>(null);

  const licencias = useMemo(() => data ?? [], [data]);

  const resumen = useMemo(() => {
    const r = { ...RESUMEN_VACIO };
    for (const l of licencias) {
      r.total++;
      switch (l.estado_mel) {
        case 'VENCIDA':
          r.vencidas++;
          break;
        case 'SIN_FECHA':
          r.sinFecha++;
          break;
        case 'POR_VENCER':
          r.porVencer++;
          r.vigentes++; // "por vencer" también es vigente (fiel)
          break;
        default:
          r.vigentes++;
          break;
      }
      if (l.licencia_gesta) r.conGesta++;
      else r.sinGesta++;
    }
    return r;
  }, [licencias]);

  const cargos = useMemo(
    () => [...new Set(licencias.map((l) => (l.cargo ?? '').trim()).filter((c) => c !== ''))].sort(),
    [licencias],
  );

  const filtradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rutQ = q.replace(/\./g, '').replace(/\s/g, '');
    return licencias.filter((l) => {
      if (q) {
        const nombre = (l.nombre ?? '').toLowerCase();
        const rut = (l.rut ?? '').toLowerCase();
        if (!nombre.includes(q) && !rut.includes(q) && !rut.includes(rutQ)) return false;
      }
      if (cargoFiltro && (l.cargo ?? '').trim() !== cargoFiltro) return false;
      if (estadoFiltro && l.estado_mel !== estadoFiltro) return false;
      if (gestaFiltro === 'SI' && !l.licencia_gesta) return false;
      if (gestaFiltro === 'NO' && l.licencia_gesta) return false;
      return true;
    });
  }, [licencias, search, cargoFiltro, estadoFiltro, gestaFiltro]);

  const limpiarFiltros = () => {
    setSearch('');
    setCargoFiltro('');
    setEstadoFiltro('');
    setGestaFiltro('');
  };
  const filtrarPorEstado = (estado: string) => setEstadoFiltro((v) => (v === estado ? '' : estado));
  const filtrarPorGesta = (valor: string) => setGestaFiltro((v) => (v === valor ? '' : valor));

  // Export client-side: mismas 8 columnas/anchos del XSSF original.
  const exportar = async () => {
    const mod = (await import('exceljs')) as unknown as {
      Workbook?: new () => Workbook;
      default?: { Workbook: new () => Workbook };
    };
    const Ctor = mod.Workbook ?? mod.default?.Workbook;
    if (!Ctor) return;
    const wb = new Ctor();
    const ws = wb.addWorksheet('Licencias Spot');
    ws.columns = [
      { header: 'RUT', width: 13 },
      { header: 'Nombre', width: 32 },
      { header: 'Cargo', width: 28 },
      { header: 'Vencimiento MEL', width: 17 },
      { header: 'Días restantes', width: 15 },
      { header: 'Estado MEL', width: 13 },
      { header: 'Licencia Gesta', width: 13 },
      { header: 'Observaciones', width: 48 },
    ];
    ws.getRow(1).font = { bold: true };
    for (const l of filtradas) {
      ws.addRow([
        l.rut ?? '',
        l.nombre ?? '',
        l.cargo ?? '',
        l.vencimiento_mel ? fmtFecha(l.vencimiento_mel) : (l.vencimiento_texto ?? ''),
        l.dias_restantes ?? '',
        estadoLabel(l.estado_mel),
        l.licencia_gesta ? 'Sí' : 'No',
        l.observaciones ?? '',
      ]);
    }
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer as ArrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'licencias-spot.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const doEliminar = async () => {
    if (!aEliminar) return;
    try {
      await eliminarMut.mutateAsync(aEliminar.id);
      setAEliminar(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const acciones = (l: LicenciaSpotRow) =>
    puedeEditar ? (
      <div style={{ display: 'flex', gap: 4 }}>
        <button type="button" className="btn-icon btn-icon--primary" title="Editar" onClick={() => setEditar(l)}>
          <Pencil size={14} />
        </button>
        <button type="button" className="btn-icon btn-icon--danger" title="Eliminar" onClick={() => setAEliminar(l)}>
          <Trash2 size={14} />
        </button>
      </div>
    ) : null;

  return (
    <div>
      {/* Encabezado */}
      <div className="app-page-header">
        <div className="app-page-header__main">
          <h1 className="app-page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IdCard size={22} /> Licencias Spot
          </h1>
          <p className="app-page-subtitle">Vigencia de licencia MEL y licencia interna Gesta del personal Spot</p>
        </div>
        <div className="app-page-header__actions">
          <div
            style={{
              display: 'inline-flex',
              border: '1px solid var(--app-border, #e5e7eb)',
              borderRadius: 8,
              overflow: 'hidden',
              marginRight: 4,
            }}
          >
            <button
              type="button"
              onClick={() => setVista('tarjetas')}
              title="Ver como tarjetas"
              style={{
                border: 'none',
                padding: '8px 12px',
                cursor: 'pointer',
                background: vista === 'tarjetas' ? 'var(--app-bg, #f3f4f6)' : 'transparent',
                color: vista === 'tarjetas' ? 'var(--app-color-brand, #cc2d2d)' : 'inherit',
              }}
            >
              <IdCard size={16} />
            </button>
            <button
              type="button"
              onClick={() => setVista('lista')}
              title="Ver como lista"
              style={{
                border: 'none',
                borderLeft: '1px solid var(--app-border, #e5e7eb)',
                padding: '8px 12px',
                cursor: 'pointer',
                background: vista === 'lista' ? 'var(--app-bg, #f3f4f6)' : 'transparent',
                color: vista === 'lista' ? 'var(--app-color-brand, #cc2d2d)' : 'inherit',
              }}
            >
              <List size={16} />
            </button>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => refetch()} disabled={isLoading || isFetching}>
            {isLoading || isFetching ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Refrescar
          </button>
          <button type="button" className="btn btn-secondary" onClick={exportar}>
            <FileSpreadsheet size={16} /> Exportar
          </button>
          {puedeEditar && (
            <button type="button" className="btn btn-primary" onClick={() => setEditar('nueva')}>
              <Plus size={16} /> Nueva licencia
            </button>
          )}
        </div>
      </div>

      {/* KPIs clicables */}
      <div className="app-card">
        <div className="app-card-body">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <button type="button" onClick={limpiarFiltros} style={kpiBtn}>
              <div style={kpiNum}>{resumen.total}</div>
              <div style={kpiLbl}>Total</div>
            </button>
            <button
              type="button"
              onClick={() => filtrarPorEstado('VIGENTE')}
              style={{ ...kpiBtn, outline: estadoFiltro === 'VIGENTE' ? '2px solid var(--app-color-success, #10b981)' : 'none' }}
            >
              <div style={{ ...kpiNum, color: 'var(--app-color-success, #10b981)' }}>{resumen.vigentes}</div>
              <div style={kpiLbl}>MEL vigentes</div>
            </button>
            <button
              type="button"
              onClick={() => filtrarPorEstado('POR_VENCER')}
              style={{ ...kpiBtn, outline: estadoFiltro === 'POR_VENCER' ? '2px solid var(--app-color-warning, #f59e0b)' : 'none' }}
            >
              <div style={{ ...kpiNum, color: 'var(--app-color-warning, #f59e0b)' }}>{resumen.porVencer}</div>
              <div style={kpiLbl}>Por vencer (≤30d)</div>
            </button>
            <button
              type="button"
              onClick={() => filtrarPorEstado('VENCIDA')}
              style={{ ...kpiBtn, outline: estadoFiltro === 'VENCIDA' ? '2px solid var(--app-color-danger, #ef4444)' : 'none' }}
            >
              <div style={{ ...kpiNum, color: 'var(--app-color-danger, #ef4444)' }}>{resumen.vencidas}</div>
              <div style={kpiLbl}>Vencidas</div>
            </button>
            <button
              type="button"
              onClick={() => filtrarPorEstado('SIN_FECHA')}
              style={{ ...kpiBtn, outline: estadoFiltro === 'SIN_FECHA' ? '2px solid var(--app-text-muted, #6b7280)' : 'none' }}
            >
              <div style={{ ...kpiNum, color: 'var(--app-text-muted, #6b7280)' }}>{resumen.sinFecha}</div>
              <div style={kpiLbl}>Sin fecha</div>
            </button>
            <button
              type="button"
              onClick={() => filtrarPorGesta('SI')}
              style={{ ...kpiBtn, outline: gestaFiltro === 'SI' ? '2px solid var(--app-color-success, #10b981)' : 'none' }}
            >
              <div style={kpiNum}>{resumen.conGesta}</div>
              <div style={kpiLbl}>Con Gesta</div>
            </button>
            <button
              type="button"
              onClick={() => filtrarPorGesta('NO')}
              style={{ ...kpiBtn, outline: gestaFiltro === 'NO' ? '2px solid var(--app-text-muted, #6b7280)' : 'none' }}
            >
              <div style={kpiNum}>{resumen.sinGesta}</div>
              <div style={kpiLbl}>Sin Gesta</div>
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="app-card">
        <div className="app-card-body">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: '2 1 240px' }}>
              <label style={lblFiltro}>Buscar (RUT o nombre)</label>
              <div style={{ position: 'relative' }}>
                <Search
                  size={14}
                  style={{ position: 'absolute', left: 10, top: 12, color: 'var(--app-text-muted, #6b7280)' }}
                />
                <input
                  type="text"
                  className="app-field__control"
                  style={{ paddingLeft: 32 }}
                  placeholder="Ej: 14691021-1 o Pérez"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label style={lblFiltro}>Cargo</label>
              <select className="app-field__control" value={cargoFiltro} onChange={(e) => setCargoFiltro(e.target.value)}>
                <option value="">Todos</option>
                {cargos.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label style={lblFiltro}>Estado MEL</label>
              <select className="app-field__control" value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                <option value="">Todos</option>
                <option value="VIGENTE">Vigente</option>
                <option value="POR_VENCER">Por vencer</option>
                <option value="VENCIDA">Vencida</option>
                <option value="SIN_FECHA">Sin fecha</option>
              </select>
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label style={lblFiltro}>Licencia Gesta</label>
              <select className="app-field__control" value={gestaFiltro} onChange={(e) => setGestaFiltro(e.target.value)}>
                <option value="">Todas</option>
                <option value="SI">Con Gesta</option>
                <option value="NO">Sin Gesta</option>
              </select>
            </div>
            <div>
              <button type="button" className="btn btn-secondary" onClick={limpiarFiltros}>
                <Filter size={16} /> Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Listado */}
      <div className="app-card">
        <div className="app-card-header">
          <IdCard className="app-card-header__icon" size={18} />
          <h4>Personal Spot</h4>
          <span className="app-card-header__meta">
            {filtradas.length} de {licencias.length}
          </span>
        </div>
        <div className="app-card-body">
          {isLoading && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--app-text-muted, #6b7280)' }}>
              <Loader2 size={16} className="animate-spin" style={{ display: 'inline' }} /> Cargando…
            </div>
          )}
          {!isLoading && filtradas.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--app-text-muted, #6b7280)' }}>
              No hay licencias que coincidan con los filtros.
            </div>
          )}

          {/* Tarjetas */}
          {!isLoading && filtradas.length > 0 && vista === 'tarjetas' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 14 }}>
              {filtradas.map((l) => (
                <div
                  key={l.id}
                  style={{
                    position: 'relative',
                    border: '1px solid var(--app-border, #e5e7eb)',
                    borderLeft: `4px solid ${colorEstado(l.estado_mel)}`,
                    borderRadius: 12,
                    padding: '14px 16px',
                    background: 'var(--app-surface, #fff)',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span className={`app-status-pill ${estadoPillClase(l.estado_mel)}`}>
                      <span className="app-status-pill__dot"></span>
                      {estadoLabel(l.estado_mel)}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: colorEstado(l.estado_mel) }}>{textoDias(l)}</span>
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>{l.nombre}</div>
                    <div style={{ fontSize: 13, color: 'var(--app-text-muted, #6b7280)' }}>
                      {l.rut} · {l.cargo || '—'}
                    </div>
                    {l.ciudad && (
                      <div style={{ fontSize: 12, color: 'var(--app-text-muted, #6b7280)' }}>
                        <MapPin size={11} style={{ display: 'inline' }} /> {l.ciudad}
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: 13 }}>
                    <span style={{ color: 'var(--app-text-muted, #6b7280)' }}>MEL:</span>
                    {l.vencimiento_mel ? (
                      <span> {fmtFecha(l.vencimiento_mel)}</span>
                    ) : (
                      <span style={{ color: 'var(--app-text-muted, #6b7280)' }}> {l.vencimiento_texto || 'sin fecha'}</span>
                    )}
                  </div>

                  {l.observaciones && (
                    <div style={{ fontSize: 12, color: 'var(--app-text-muted, #6b7280)', whiteSpace: 'normal' }}>
                      {l.observaciones}
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginTop: 'auto',
                      paddingTop: 4,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                      <span title={l.puede_conducir ? 'Puede conducir (MEL vigente)' : 'No puede conducir (MEL no vigente)'}>
                        <Truck
                          size={14}
                          style={{
                            display: 'inline',
                            color: l.puede_conducir ? 'var(--app-color-success, #10b981)' : 'var(--app-color-danger, #ef4444)',
                          }}
                        />{' '}
                        {l.puede_conducir ? 'Conduce' : 'No conduce'}
                      </span>
                      <span className={`app-badge ${l.licencia_gesta ? 'app-badge--success' : 'app-badge--muted'}`}>
                        Gesta: {l.licencia_gesta ? 'Sí' : 'No'}
                      </span>
                    </div>
                    {acciones(l)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lista compacta */}
          {!isLoading && filtradas.length > 0 && vista === 'lista' && (
            <div style={{ display: 'flex', flexDirection: 'column', overflowX: 'auto' }}>
              {filtradas.map((l) => (
                <div
                  key={l.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 8px',
                    borderBottom: '1px solid var(--app-border, #eee)',
                    fontSize: 13,
                  }}
                >
                  <span
                    title={estadoLabel(l.estado_mel)}
                    style={{ background: colorEstado(l.estado_mel), width: 9, height: 9, borderRadius: '50%', flex: '0 0 auto' }}
                  ></span>
                  <span
                    style={{
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: '0 0 260px',
                      maxWidth: 260,
                    }}
                  >
                    {l.nombre}
                  </span>
                  <span style={{ color: 'var(--app-text-muted, #6b7280)', flex: '0 0 110px' }}>{l.rut}</span>
                  <span
                    title={l.cargo ?? undefined}
                    style={{
                      color: 'var(--app-text-muted, #6b7280)',
                      flex: '0 0 190px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {l.cargo || '—'}
                  </span>
                  <span
                    title={l.ciudad ?? undefined}
                    style={{
                      color: 'var(--app-text-muted, #6b7280)',
                      flex: '0 0 130px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {l.ciudad || '—'}
                  </span>
                  <span style={{ color: 'var(--app-text-muted, #6b7280)', flex: '0 0 80px', textAlign: 'right' }}>
                    {textoDias(l)}
                  </span>
                  <Truck
                    size={14}
                    style={{
                      flex: '0 0 auto',
                      color: l.puede_conducir ? 'var(--app-color-success, #10b981)' : 'var(--app-color-danger, #ef4444)',
                    }}
                  />
                  <span
                    className={`app-badge ${l.licencia_gesta ? 'app-badge--success' : 'app-badge--muted'}`}
                    style={{ flex: '0 0 auto', width: 82, textAlign: 'center' }}
                  >
                    {l.licencia_gesta ? 'Gesta' : 'Sin Gesta'}
                  </span>
                  {puedeEditar && <span style={{ flex: '0 0 auto', display: 'flex', gap: 2 }}>{acciones(l)}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Diálogos */}
      {editar != null && (
        <LicenciaUpdateDialog
          licencia={editar === 'nueva' ? null : editar}
          busy={guardarMut.isPending}
          onCancel={() => setEditar(null)}
          onSave={async (input) => {
            try {
              await guardarMut.mutateAsync({ input, usuario: login });
              setEditar(null);
              return null;
            } catch (e) {
              return (e as Error).message || 'No se pudo guardar la licencia.';
            }
          }}
        />
      )}
      {aEliminar && (
        <div className="app-modal-backdrop" role="dialog" aria-modal="true">
          <div className="app-modal">
            <div className="app-modal__header">
              <h4 className="app-modal__title">Eliminar licencia</h4>
              <button type="button" className="app-modal__close" aria-label="Cerrar" onClick={() => setAEliminar(null)}>
                ×
              </button>
            </div>
            <div className="app-modal__body">
              <p>
                ¿Confirmas que deseas quitar del listado Spot a <strong>{aEliminar.nombre}</strong> (RUT{' '}
                <strong>{aEliminar.rut}</strong>)?
              </p>
              <p style={{ fontSize: 13, color: 'var(--app-text-muted, #6b7280)' }}>
                Esta acción elimina el registro de licencias; no afecta la ficha de la persona.
              </p>
            </div>
            <div className="app-modal__footer">
              <button type="button" className="btn btn-segundo" disabled={eliminarMut.isPending} onClick={() => setAEliminar(null)}>
                <Ban size={16} /> Cancelar
              </button>
              <button type="button" className="btn btn-danger" disabled={eliminarMut.isPending} onClick={doEliminar}>
                <Trash2 size={16} /> {eliminarMut.isPending ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Diálogo crear/editar con typeahead de personas del sistema (solo al crear). */
function LicenciaUpdateDialog({
  licencia,
  busy,
  onCancel,
  onSave,
}: {
  licencia: LicenciaSpotRow | null;
  busy: boolean;
  onCancel: () => void;
  /** Devuelve mensaje de error o null si guardó. */
  onSave: (input: LicenciaSpotInput) => Promise<string | null>;
}) {
  const esNuevo = licencia == null;
  const [form, setForm] = useState<LicenciaSpotInput>(
    licencia
      ? {
          id: licencia.id,
          rut: licencia.rut,
          nombre: licencia.nombre,
          cargo: licencia.cargo,
          vencimiento_mel: licencia.vencimiento_mel,
          vencimiento_texto: licencia.vencimiento_texto,
          licencia_gesta: licencia.licencia_gesta ?? false,
          observaciones: licencia.observaciones,
        }
      : { licencia_gesta: false },
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [personaElegida, setPersonaElegida] = useState(false);
  const { data: sugerencias } = useBuscarPersonasLicencia(esNuevo && !personaElegida ? busqueda : '');

  const guardar = async () => {
    setErrorMsg('');
    if (esNuevo && !form.rut) {
      setErrorMsg('Selecciona una persona del sistema (busca por RUT o nombre).');
      return;
    }
    const err = await onSave(form);
    if (err) setErrorMsg(err);
  };

  return (
    <div className="app-modal-backdrop" role="dialog" aria-modal="true">
      <div className="app-modal" style={{ maxWidth: 720, width: '92vw' }}>
        <div className="app-modal__header">
          <h4 className="app-modal__title">{esNuevo ? 'Nueva licencia Spot' : 'Editar licencia Spot'}</h4>
          <button type="button" className="app-modal__close" aria-label="Cerrar" onClick={onCancel}>
            ×
          </button>
        </div>
        <div className="app-modal__body">
          {errorMsg && (
            <div className="app-alert app-alert--danger" style={{ marginBottom: 'var(--app-space-3)' }}>
              {errorMsg}
            </div>
          )}

          {esNuevo && (
            <div className="app-field" style={{ position: 'relative', marginBottom: 'var(--app-space-3)' }}>
              <label className="app-field__label">Persona (busca por RUT o nombre)</label>
              <input
                type="text"
                className="app-field__control"
                autoComplete="off"
                placeholder="Escribe al menos 2 caracteres…"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPersonaElegida(false);
                }}
              />
              <small style={{ color: 'var(--app-text-muted, #6b7280)' }}>
                Debe ser personal ya registrado en el sistema.
              </small>
              {!personaElegida && busqueda.trim().length >= 2 && (sugerencias?.length ?? 0) > 0 && (
                <div
                  className="app-navbar__dropdown"
                  style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30, maxHeight: 240, overflowY: 'auto' }}
                >
                  {sugerencias!.map((p) => (
                    <button
                      key={p.rut}
                      type="button"
                      className="app-navbar__dropdown-item"
                      onClick={() => {
                        setForm((f) => ({ ...f, rut: p.rut, nombre: p.nombre }));
                        setBusqueda(`${p.nombre ?? ''} — ${p.rut}`);
                        setPersonaElegida(true);
                        setErrorMsg('');
                      }}
                    >
                      <span>
                        {p.nombre} — {p.rut}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="app-field">
              <label className="app-field__label">RUT</label>
              <input type="text" className="app-field__control" value={form.rut ?? ''} readOnly placeholder="—" />
              {esNuevo && !form.rut && (
                <small style={{ color: 'var(--app-text-muted, #6b7280)' }}>Se completa al elegir la persona.</small>
              )}
            </div>
            <div className="app-field">
              <label className="app-field__label">Nombre</label>
              <input
                type="text"
                className="app-field__control"
                value={form.nombre ?? ''}
                readOnly={esNuevo}
                placeholder="—"
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
            </div>
            <div className="app-field">
              <label className="app-field__label">Cargo</label>
              <input
                type="text"
                className="app-field__control"
                value={form.cargo ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, cargo: e.target.value }))}
              />
            </div>
            <div className="app-field">
              <label className="app-field__label">Vencimiento MEL</label>
              <input
                type="date"
                className="app-field__control"
                value={form.vencimiento_mel ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, vencimiento_mel: e.target.value || null }))}
              />
              <small style={{ color: 'var(--app-text-muted, #6b7280)' }}>Vacío = sin fecha registrada.</small>
            </div>
            <div className="app-field">
              <label className="app-field__label">Licencia Gesta</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={form.licencia_gesta ?? false}
                  onChange={(e) => setForm((f) => ({ ...f, licencia_gesta: e.target.checked }))}
                />
                Entregada
              </label>
            </div>
            <div className="app-field">
              <label className="app-field__label">Observaciones</label>
              <textarea
                className="app-field__control"
                rows={2}
                maxLength={500}
                value={form.observaciones ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
              />
            </div>
          </div>
        </div>
        <div className="app-modal__footer">
          <button type="button" className="btn btn-segundo" onClick={onCancel} disabled={busy}>
            <Ban size={16} /> Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={guardar} disabled={busy || (esNuevo && !form.rut)}>
            <Save size={16} /> {busy ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
