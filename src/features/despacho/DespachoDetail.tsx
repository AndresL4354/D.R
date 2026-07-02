import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Ban, Check, CheckCircle2, Clock, Loader2, MinusCircle, Plus, Trash2, UserPlus, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAuditoria,
  useAgregarTrabajador,
  useDespacho,
  useEliminarAccion,
  useEliminarTrabajador,
  useFinalizarDespacho,
  usePuedeEditarEstados,
  useRegistrarAccion,
  useToggleEstado,
  useTrabajadoresAcciones,
  useUpdateEstadoDespacho,
} from './hooks';
import { ACCIONES_DESPACHO, ESTADOS_DESPACHO, ROL_POR_ACCION, type AccionEstado, type TrabajadorAccionesRow } from './api';
import { EstadoPill } from './DespachoList';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { RowActionsMenu } from '@/components/common/RowActionsMenu';
import { useAuth } from '@/features/auth/useAuth';
import { useRole } from '@/features/auth/useRole';
import { useBuscarPersonas } from '@/features/proyecto/hooks';
import { formatDate, formatDateTime } from '@/lib/utils';

const ROLES_DESPACHO = [
  'ROLE_ADMIN',
  'DESPACHO_ACREDITACION',
  'DESPACHO_ADMINISTRADOR',
  'DESPACHO_BODEGA',
  'DESPACHO_CURSOS',
  'DESPACHO_RECEPCION',
  'DESPACHO_SSO',
  'DESPACHO_TRANSPORTE',
];

type CellState = 'aprobado' | 'pendiente' | 'rechazado' | 'none';
function cellState(a: AccionEstado | undefined): CellState {
  if (!a) return 'none';
  if (a.pendiente) return 'pendiente';
  if (a.aprobado) return 'aprobado';
  return 'rechazado';
}
function CellIcon({ state }: { state: CellState }) {
  if (state === 'aprobado') return <CheckCircle2 size={18} style={{ color: 'var(--app-color-success)' }} />;
  if (state === 'pendiente') return <Clock size={18} style={{ color: 'var(--app-color-warning)' }} />;
  if (state === 'rechazado') return <XCircle size={18} style={{ color: 'var(--app-color-danger)' }} />;
  return <MinusCircle size={16} style={{ color: 'var(--app-text-muted)', opacity: 0.5 }} />;
}

/** Exportado como `Component` para el `lazy` del router. Grilla de acciones por trabajador (clon del detalle). */
export function Component() {
  const { id } = useParams();
  const despachoId = Number(id);
  const { hasAnyRole } = useRole();
  const { user } = useAuth();
  const login = user?.email ?? '';

  const { data: d, isLoading, isError } = useDespacho(despachoId);
  const { data: filas, isLoading: loadingFilas } = useTrabajadoresAcciones(despachoId);
  const { data: auditoria } = useAuditoria(despachoId);
  const { data: puedeEditar } = usePuedeEditarEstados();

  const updateEstado = useUpdateEstadoDespacho();
  const finalizarMut = useFinalizarDespacho();
  const registrarMut = useRegistrarAccion();
  const eliminarAccionMut = useEliminarAccion();
  const toggleMut = useToggleEstado();
  const eliminarTrabMut = useEliminarTrabajador();
  const agregarMut = useAgregarTrabajador();

  const [estado, setEstado] = useState('');
  useEffect(() => {
    if (d?.estado) setEstado(d.estado);
  }, [d?.estado]);

  // Diálogos
  const [modalAccion, setModalAccion] = useState<{ row: TrabajadorAccionesRow; accion: string } | null>(null);
  const [comentario, setComentario] = useState('');
  const [confirmQuitar, setConfirmQuitar] = useState<{ row: TrabajadorAccionesRow; accion: string } | null>(null);
  const [aQuitarTrab, setAQuitarTrab] = useState<TrabajadorAccionesRow | null>(null);

  // Agregar persona
  const [term, setTerm] = useState('');
  const [personaSel, setPersonaSel] = useState<{ id: number; nombre: string | null } | null>(null);
  const { data: resultados } = useBuscarPersonas(term);

  const canFinalizar = hasAnyRole(['ROLE_ADMIN', 'DESPACHO_ADMINISTRADOR']);
  const canAdminAccion = hasAnyRole(['ROLE_ADMIN', 'DESPACHO_ADMINISTRADOR']);
  const tieneRolDespacho = hasAnyRole(ROLES_DESPACHO);
  const canGestionar = (accion: string) =>
    hasAnyRole(['ROLE_ADMIN', 'DESPACHO_ADMINISTRADOR', ROL_POR_ACCION[accion as keyof typeof ROL_POR_ACCION] ?? '__none__']);
  const notFinalizado = d?.estado !== 'FINALIZADO';

  const busy =
    registrarMut.isPending || eliminarAccionMut.isPending || toggleMut.isPending || eliminarTrabMut.isPending;

  if (isLoading) {
    return (
      <div className="app-empty-state">
        <Loader2 className="mx-auto animate-spin" size={24} />
      </div>
    );
  }
  if (isError || !d) {
    return (
      <div>
        <div className="app-empty-state">
          <p className="app-empty-state__title">No se encontró el despacho</p>
          o no tienes permisos.
        </div>
        <div style={{ textAlign: 'center' }}>
          <Link to="/despacho" className="btn btn-secondary">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  const onSaveEstado = async () => {
    if (estado === d.estado) return;
    try {
      await updateEstado.mutateAsync({ id: despachoId, estado });
      toast.success('Estado actualizado (queda registrado en auditoría)');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const onFinalizar = async () => {
    try {
      await finalizarMut.mutateAsync(despachoId);
      toast.success(`Despacho con id ${despachoId} ha sido FINALIZADO correctamente.`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const doToggle = async (idTd: number, accion: string, marcar: boolean, confirmado: boolean) => {
    try {
      await toggleMut.mutateAsync({ idTrabajadorDespacho: idTd, accion, marcar, confirmado });
      toast.success('Cambio guardado');
    } catch (e) {
      toast.error((e as Error).message || 'No se pudo guardar el cambio, intenta nuevamente');
    }
  };

  const onCellClick = (row: TrabajadorAccionesRow, accion: string) => {
    if (!notFinalizado) return;
    if (puedeEditar) {
      if (cellState(row.acciones[accion]) === 'aprobado') setConfirmQuitar({ row, accion });
      else void doToggle(row.id, accion, true, false);
    } else if (canGestionar(accion)) {
      setComentario(row.acciones[accion]?.comentario ?? '');
      setModalAccion({ row, accion });
    }
  };

  const doRegistrar = async (aprobado: boolean, pendiente: boolean) => {
    if (!modalAccion) return;
    if (!aprobado && !pendiente && comentario.trim() === '') {
      toast.warning('Debe ingresar un comentario válido');
      return;
    }
    try {
      await registrarMut.mutateAsync({
        idTrabajadorDespacho: modalAccion.row.id,
        accion: modalAccion.accion,
        aprobado,
        pendiente,
        comentario: comentario || null,
        usuario: login,
      });
      toast.success(`El registro de ${modalAccion.accion} fue creado con éxito`);
      setModalAccion(null);
      setComentario('');
    } catch (e) {
      toast.error(`Error: ${(e as Error).message || 'Ocurrió un error inesperado'}`);
    }
  };

  const doEliminarAccion = async () => {
    const accId = modalAccion?.row.acciones[modalAccion.accion]?.id;
    if (!accId) return;
    try {
      await eliminarAccionMut.mutateAsync(accId);
      toast.success('Acción eliminada.');
      setModalAccion(null);
      setComentario('');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const doQuitarTrabajador = async () => {
    if (!aQuitarTrab) return;
    try {
      await eliminarTrabMut.mutateAsync(aQuitarTrab.id);
      toast.success('Persona quitada del despacho.');
      setAQuitarTrab(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const doAgregar = async () => {
    if (!personaSel) return;
    if ((filas ?? []).some((r) => r.idPersona === personaSel.id)) {
      toast.warning('Esta persona ya se encuentra en el despacho.');
      return;
    }
    try {
      await agregarMut.mutateAsync({ idDespacho: despachoId, idPersona: personaSel.id });
      toast.success('Persona agregada al despacho.');
      setPersonaSel(null);
      setTerm('');
    } catch (e) {
      toast.warning((e as Error).message || 'No se pudo agregar a la persona');
    }
  };

  const filaRows = filas ?? [];

  return (
    <div>
      <ol className="app-breadcrumb">
        <li>
          <Link to="/despacho">Despachos</Link>
        </li>
        <li className="active">· {d.nombre_despacho ?? `#${d.id}`}</li>
      </ol>

      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">{d.nombre_despacho ?? `Despacho #${d.id}`}</h1>
            <p className="app-page-subtitle">
              Fecha {formatDate(d.fecha_despacho)} · Servicio {d.id_proyecto ?? '—'}
            </p>
          </div>
        </div>
        <div className="app-page-header__actions">
          <EstadoPill estado={d.estado} />
          {canFinalizar && notFinalizado && (
            <button type="button" className="btn btn-primary" onClick={onFinalizar} disabled={finalizarMut.isPending}>
              <Check size={16} /> Finalizar
            </button>
          )}
          <Link to="/despacho" className="btn btn-secondary">
            Volver
          </Link>
        </div>
      </div>

      {/* Estado (cambio genérico; el trigger audita) */}
      <div className="app-card">
        <div className="app-card-header">
          <h4>Estado</h4>
        </div>
        <div className="app-card-body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--app-space-3)', flexWrap: 'wrap' }}>
          <EstadoPill estado={d.estado} />
          <span style={{ color: 'var(--app-text-muted)' }}>→</span>
          <select className="app-field__control" style={{ maxWidth: 200 }} value={estado} onChange={(e) => setEstado(e.target.value)} disabled={!tieneRolDespacho}>
            {ESTADOS_DESPACHO.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={onSaveEstado} disabled={estado === d.estado || updateEstado.isPending || !tieneRolDespacho}>
            {updateEstado.isPending ? 'Guardando…' : 'Cambiar estado'}
          </button>
        </div>
      </div>

      {/* Agregar persona */}
      {tieneRolDespacho && notFinalizado && (
        <div className="app-card">
          <div className="app-card-header">
            <UserPlus className="app-card-header__icon" size={18} />
            <h4>Agregar persona al despacho</h4>
          </div>
          <div className="app-card-body">
            <div className="flex flex-wrap items-end gap-3">
              <div className="app-field relative min-w-[280px] flex-1">
                <label className="app-field__label">Persona (nombre o RUT)</label>
                <input
                  className="app-field__control"
                  placeholder="Buscar persona…"
                  value={term}
                  onChange={(e) => {
                    setTerm(e.target.value);
                    setPersonaSel(null);
                  }}
                />
                {!personaSel && term.trim().length >= 2 && (resultados?.length ?? 0) > 0 && (
                  <div className="app-navbar__dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, maxHeight: 260, overflowY: 'auto' }}>
                    {resultados!.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        className="app-navbar__dropdown-item"
                        onClick={() => {
                          setPersonaSel({ id: r.id, nombre: r.nombre });
                          setTerm(`${r.nombre ?? ''} (${r.numId ?? ''})`);
                        }}
                      >
                        <span>
                          {r.nombre} · {r.numId} · {r.estado}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" className="btn btn-primary" disabled={!personaSel || agregarMut.isPending} onClick={doAgregar}>
                <Plus size={16} /> Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grilla de acciones por trabajador */}
      <div className="app-card">
        <div className="app-card-header">
          <h4>Personal del despacho ({filaRows.length})</h4>
          {puedeEditar && notFinalizado && (
            <span className="app-card-header__meta" style={{ marginLeft: 'auto' }}>
              Edición rápida activa (click en la celda)
            </span>
          )}
        </div>
        <div className="app-card-body">
          {loadingFilas ? (
            <div className="app-empty-state">
              <Loader2 className="mx-auto animate-spin" size={22} />
            </div>
          ) : filaRows.length === 0 ? (
            <p style={{ color: 'var(--app-text-muted)', margin: 0 }}>Sin trabajadores en este despacho.</p>
          ) : (
            <div className="app-table-wrap" style={{ marginBottom: 0 }}>
              <table className="app-table app-table--hover">
                <thead>
                  <tr>
                    <th>Persona</th>
                    {ACCIONES_DESPACHO.map((a) => (
                      <th key={a} style={{ textAlign: 'center' }}>
                        {a}
                      </th>
                    ))}
                    <th style={{ textAlign: 'center' }}>Acred</th>
                    <th style={{ width: 56 }} />
                  </tr>
                </thead>
                <tbody>
                  {filaRows.map((row) => {
                    return (
                      <tr key={row.id}>
                        <td>
                          <Link to={`/persona/${row.idPersona}`} className="font-semibold text-foreground hover:underline">
                            {row.persona ?? `Persona #${row.idPersona ?? '—'}`}
                          </Link>
                          <div style={{ fontSize: 'var(--app-fs-sm)', color: 'var(--app-text-muted)' }}>{row.numId}</div>
                        </td>
                        {ACCIONES_DESPACHO.map((a) => {
                          const st = cellState(row.acciones[a]);
                          const clickable = notFinalizado && (puedeEditar || canGestionar(a));
                          return (
                            <td key={a} style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="btn-icon"
                                style={{ cursor: clickable ? 'pointer' : 'default', opacity: clickable ? 1 : 0.7 }}
                                title={
                                  !clickable
                                    ? st
                                    : puedeEditar
                                      ? st === 'aprobado'
                                        ? 'Click para quitar'
                                        : 'Click para marcar'
                                      : `Registrar ${a}`
                                }
                                disabled={!clickable || busy}
                                onClick={() => onCellClick(row, a)}
                              >
                                <CellIcon state={st} />
                              </button>
                            </td>
                          );
                        })}
                        <td style={{ textAlign: 'center' }}>
                          <CellIcon state={row.acreditado ? 'aprobado' : 'none'} />
                        </td>
                        <td>
                          <RowActionsMenu
                            actions={[
                              {
                                label: 'Quitar del despacho',
                                icon: <Trash2 size={16} />,
                                show: tieneRolDespacho && notFinalizado,
                                onClick: () => setAQuitarTrab(row),
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Auditoría (estado del despacho + edición de acciones) */}
      <div className="app-card">
        <div className="app-card-header">
          <h4>Auditoría</h4>
        </div>
        <div className="app-card-body">
          {!auditoria || auditoria.length === 0 ? (
            <p style={{ color: 'var(--app-text-muted)', margin: 0 }}>Sin cambios registrados.</p>
          ) : (
            <div className="app-table-wrap" style={{ marginBottom: 0 }}>
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Cambio</th>
                    <th>Anterior</th>
                    <th>Nuevo</th>
                    <th>Usuario</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {auditoria.map((a) => (
                    <tr key={a.id}>
                      <td>{a.columna ? a.columna : 'Estado'}</td>
                      <td>{a.columna ? (a.valor_anterior ?? '—') : (a.estado_anterior ?? '—')}</td>
                      <td>{a.columna ? (a.valor_nuevo ?? '—') : (a.estado_nuevo ?? '—')}</td>
                      <td>{a.usuario ?? '—'}</td>
                      <td>{formatDateTime(a.fecha)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Diálogo registrar acción (Aprobar / Rechazar / Pendiente) */}
      {modalAccion && (
        <div className="app-modal-backdrop" role="dialog" aria-modal="true">
          <div className="app-modal">
            <div className="app-modal__header">
              <h4 className="app-modal__title">Registrar {modalAccion.accion}</h4>
              <button type="button" className="app-modal__close" aria-label="Cerrar" onClick={() => setModalAccion(null)}>
                ×
              </button>
            </div>
            <div className="app-modal__body">
              <p>
                Ingrese el comentario de {modalAccion.accion} para el trabajador{' '}
                <strong>{modalAccion.row.persona}</strong>.
              </p>
              <textarea
                className="app-field__control"
                rows={3}
                maxLength={200}
                placeholder="Comentario…"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                style={{ marginTop: 'var(--app-space-2)' }}
              />
              {canAdminAccion && modalAccion.row.acciones[modalAccion.accion] && (
                <button type="button" className="btn btn-danger btn-sm" style={{ marginTop: 'var(--app-space-3)' }} disabled={busy} onClick={doEliminarAccion}>
                  <Trash2 size={16} /> Quitar registro
                </button>
              )}
            </div>
            <div className="app-modal__footer">
              <button type="button" className="btn btn-segundo" onClick={() => setModalAccion(null)} disabled={busy}>
                <Ban size={16} /> Cancelar
              </button>
              <button type="button" className="btn btn-danger" onClick={() => doRegistrar(false, false)} disabled={busy}>
                <XCircle size={16} /> Rechazar
              </button>
              {modalAccion.accion === 'Asistencia' && (
                <button type="button" className="btn btn-secondary" onClick={() => doRegistrar(false, true)} disabled={busy}>
                  <Clock size={16} /> Pendiente
                </button>
              )}
              <button type="button" className="btn btn-primary" onClick={() => doRegistrar(true, false)} disabled={busy}>
                <Check size={16} /> Aprobar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar quitar (toggle desmarcar) */}
      <ConfirmDialog
        open={confirmQuitar != null}
        title={`Quitar ${confirmQuitar?.accion ?? ''}`}
        permanent={false}
        confirmLabel="Sí, quitar"
        busy={busy}
        onCancel={() => setConfirmQuitar(null)}
        onConfirm={async () => {
          if (!confirmQuitar) return;
          await doToggle(confirmQuitar.row.id, confirmQuitar.accion, false, true);
          setConfirmQuitar(null);
        }}
      >
        <p>
          ¿Seguro que quieres quitar {confirmQuitar?.accion} a <strong>{confirmQuitar?.row.persona}</strong>? Se eliminará
          el registro de esta columna para el trabajador.
        </p>
      </ConfirmDialog>

      {/* Confirmar quitar trabajador */}
      <ConfirmDialog
        open={aQuitarTrab != null}
        title="Eliminar persona del despacho"
        confirmLabel="Eliminar"
        busy={busy}
        onCancel={() => setAQuitarTrab(null)}
        onConfirm={doQuitarTrabajador}
      >
        <p>
          ¿Confirmas que deseas quitar a <strong>{aQuitarTrab?.persona}</strong> de este despacho? Se eliminarán también
          los registros de acciones asociadas a esta persona en el despacho.
        </p>
      </ConfirmDialog>
    </div>
  );
}
