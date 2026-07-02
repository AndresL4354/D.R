import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  IdCard,
  Link as LinkIcon,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { RowActionsMenu, type RowAction } from '@/components/common/RowActionsMenu';
import { useAuth } from '@/features/auth/useAuth';
import { useRole } from '@/features/auth/useRole';
import { personaEnDespacho, type PersonalRow } from './api';
import {
  useAcreditarTrabajador,
  useAsociarPersona,
  useBackupAsociado,
  useBuscarPersonas,
  useCambiarCargoAsociado,
  useCargosByFaena,
  useEliminarAsociado,
  useGestionTempranaToggle,
  useOficializarNomina,
  usePersonalProyecto,
  useProyecto,
  useReasociarPersona,
} from './hooks';

type Modal =
  | { kind: 'backup'; row: PersonalRow; enDespacho: boolean }
  | { kind: 'eliminar'; row: PersonalRow }
  | { kind: 'reasociar'; row: PersonalRow }
  | { kind: 'cargo'; row: PersonalRow }
  | { kind: 'acreditar'; row: PersonalRow }
  | { kind: 'gt'; row: PersonalRow }
  | null;

/** Exportado como `Component` para el `lazy` del router. Clon de asociar.component (pantalla Asociar). */
export function Component() {
  const { id } = useParams();
  const proyectoId = Number(id);
  const { hasAnyRole } = useRole();
  const { user } = useAuth();
  const login = user?.email ?? '';

  const { data: p, isLoading } = useProyecto(proyectoId);
  const { data: personal, isLoading: loadingPersonal } = usePersonalProyecto(proyectoId);
  const { data: cargos } = useCargosByFaena(p?.id_faena);

  const asociarMut = useAsociarPersona();
  const oficializarMut = useOficializarNomina();
  const backupMut = useBackupAsociado();
  const eliminarMut = useEliminarAsociado();
  const reasociarMut = useReasociarPersona();
  const cargoMut = useCambiarCargoAsociado();
  const acreditarMut = useAcreditarTrabajador();
  const gtMut = useGestionTempranaToggle();

  // ---- Asignar persona ----
  const [term, setTerm] = useState('');
  const [personaSel, setPersonaSel] = useState<{ id: number; nombre: string | null; estado: string | null } | null>(null);
  const [cargoAsignar, setCargoAsignar] = useState('');
  const { data: resultados } = useBuscarPersonas(term);

  // ---- Diálogos de fila ----
  const [modal, setModal] = useState<Modal>(null);
  const [motivo, setMotivo] = useState('');
  const [cargoEditar, setCargoEditar] = useState('');

  const notFinalizado = p?.estado !== 'FINALIZADO';
  const canAsignar = hasAnyRole(['ROLE_ADMIN', 'VALIDADOR_RRHH', 'ENCARGADO_RRHH', 'OPERACIONES', 'RRHH']);
  const canOficializar = hasAnyRole(['ROLE_ADMIN', 'SUPERADMINISTRADOR', 'SUPERADMINISTRADOR BP', 'OPERACIONES', 'ENCARGADO_RRHH']);
  const canGestionar = hasAnyRole(['ROLE_ADMIN', 'SUPERADMINISTRADOR', 'SUPERADMINISTRADOR BP', 'ENCARGADO_RRHH']);
  const canAcreditar = hasAnyRole(['ROLE_ADMIN', 'SUPERADMINISTRADOR', 'SUPERADMINISTRADOR BP', 'ENCARGADO_ACREDITACION']);
  const canGt = hasAnyRole(['ROLE_ADMIN', 'ENCARGADO_ASISTENCIA_GT']);

  const rows = personal ?? [];
  const nomina = rows.filter((r) => r.estado === 'PRESELECCIONADA' || r.estado === 'OFICIALIZADA');
  const backup = rows.filter((r) => r.estado === 'BACKUP');
  const eliminados = rows.filter((r) => r.estado === 'ELIMINADO');
  const idsPreseleccionadas = nomina.filter((r) => r.estado === 'PRESELECCIONADA').map((r) => r.idPersona);

  const busy =
    asociarMut.isPending ||
    oficializarMut.isPending ||
    backupMut.isPending ||
    eliminarMut.isPending ||
    reasociarMut.isPending ||
    cargoMut.isPending ||
    acreditarMut.isPending ||
    gtMut.isPending;

  const cerrarModal = () => {
    setModal(null);
    setMotivo('');
    setCargoEditar('');
  };

  // ---- Asignar ----
  const doAsignar = async () => {
    if (!personaSel || !cargoAsignar) return;
    if (eliminados.some((r) => r.idPersona === personaSel.id)) {
      toast.warning(
        'El RUT está en "Personal Eliminado" de este servicio. Para reincorporarlo, usa la opción "Asociar" en el menú (⋮) de su fila en esa sección.',
      );
      return;
    }
    if (personaSel.estado !== 'Activo') {
      toast.warning('Esta persona no esta Activa.');
      return;
    }
    if (nomina.some((r) => r.idPersona === personaSel.id)) {
      toast.warning('Esta persona ya se ecuentra en el proyecto.');
      return;
    }
    const cargo = cargos?.find((c) => c.id === Number(cargoAsignar));
    try {
      await asociarMut.mutateAsync({
        idPersona: personaSel.id,
        idProyecto: proyectoId,
        idCargo: Number(cargoAsignar),
        cargo: cargo?.nombre ?? '',
        usuario: login,
      });
      toast.success('La persona fue asociada exitosamente.');
      setPersonaSel(null);
      setTerm('');
      setCargoAsignar('');
    } catch (e) {
      toast.warning((e as Error).message || 'No se pudo asociar a la persona.');
    }
  };

  // ---- Oficializar nómina ----
  const doOficializar = async () => {
    try {
      const bloqueados = await oficializarMut.mutateAsync({ idProyecto: proyectoId, idsPersona: idsPreseleccionadas });
      if (bloqueados) toast.warning(`${bloqueados} , estan oficializados`);
      else toast.success('Nomina oficializada exitosamente');
    } catch (e) {
      toast.warning((e as Error).message || 'La nomina de este proyecto ya esta oficializada');
    }
  };

  // ---- Abrir diálogos ----
  const abrirBackup = async (row: PersonalRow) => {
    const en = await personaEnDespacho(row.idPersona, proyectoId).catch(() => false);
    setMotivo('');
    setModal({ kind: 'backup', row, enDespacho: en });
  };
  const abrirEliminar = async (row: PersonalRow) => {
    const en = await personaEnDespacho(row.idPersona, proyectoId).catch(() => false);
    if (en) {
      toast.warning('Esta persona no se puede eliminar, se encuentra asociada a un despacho en este servicio.');
      return;
    }
    setMotivo('');
    setModal({ kind: 'eliminar', row });
  };
  const abrirReasociar = (row: PersonalRow) => {
    setMotivo('');
    setModal({ kind: 'reasociar', row });
  };
  const abrirCargo = (row: PersonalRow) => {
    setCargoEditar(row.idCargo ? String(row.idCargo) : '');
    setModal({ kind: 'cargo', row });
  };

  // ---- Confirmar diálogos ----
  const confirmar = async () => {
    if (!modal) return;
    const { row } = modal;
    try {
      if (modal.kind === 'backup') {
        await backupMut.mutateAsync({ idPersona: row.idPersona, idProyecto: proyectoId, motivo });
        toast.success('Persona movida a backUp.');
      } else if (modal.kind === 'eliminar') {
        await eliminarMut.mutateAsync({ idPersona: row.idPersona, idProyecto: proyectoId, motivo });
        toast.success('Persona eliminada del servicio.');
      } else if (modal.kind === 'reasociar') {
        await reasociarMut.mutateAsync({ idPersona: row.idPersona, idProyecto: proyectoId, motivo });
        toast.success('Persona reasociada al servicio.');
      } else if (modal.kind === 'cargo') {
        const cargo = cargos?.find((c) => c.id === Number(cargoEditar));
        await cargoMut.mutateAsync({
          idPersona: row.idPersona,
          idProyecto: proyectoId,
          idCargo: Number(cargoEditar),
          cargo: cargo?.nombre ?? '',
        });
        toast.success('Empleado modificado con exito');
      } else if (modal.kind === 'acreditar') {
        await acreditarMut.mutateAsync({ idProyecto: proyectoId, idPersona: row.idPersona });
        toast.success('Trabajador acreditado con exito.');
      } else if (modal.kind === 'gt') {
        await gtMut.mutateAsync({ idProyecto: proyectoId, idPersona: row.idPersona, usuario: login });
        toast.success('Se ha modificado la asistencia correctamente.');
      }
      cerrarModal();
    } catch (e) {
      toast.warning((e as Error).message || 'Se ha producido un error.');
    }
  };

  if (isLoading) {
    return (
      <div className="app-empty-state">
        <Loader2 className="mx-auto animate-spin" size={24} />
      </div>
    );
  }
  if (!p) {
    return (
      <div>
        <div className="app-empty-state">
          <p className="app-empty-state__title">No se encontró el servicio</p>
          o no tienes permisos.
        </div>
        <div style={{ textAlign: 'center' }}>
          <Link to="/proyecto" className="btn btn-secondary">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  const acreditadoCell = (r: PersonalRow) =>
    r.acreditado ? (
      <span className="app-badge app-badge--success" title="Acreditado">
        <IdCard size={14} /> Sí
      </span>
    ) : (
      <span className="app-badge app-badge--muted">No</span>
    );

  const renderTabla = (
    titulo: string,
    icon: React.ReactNode,
    data: PersonalRow[],
    buildActions: (r: PersonalRow) => RowAction[],
    showGt: boolean,
  ) => (
    <div className="app-card">
      <div className="app-card-header">
        {icon}
        <h4>
          {titulo} ({data.length})
        </h4>
        {titulo.startsWith('Nómina') && canOficializar && notFinalizado && idsPreseleccionadas.length > 0 && (
          <button type="button" className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} disabled={busy} onClick={doOficializar}>
            <Check size={16} /> Oficializar Nómina
          </button>
        )}
      </div>
      <div className="app-card-body">
        {data.length === 0 ? (
          <p style={{ color: 'var(--app-text-muted)', margin: 0 }}>Sin registros.</p>
        ) : (
          <div className="app-table-wrap" style={{ marginBottom: 0 }}>
            <table className="app-table app-table--hover">
              <thead>
                <tr>
                  <th>Persona</th>
                  <th>Cargo</th>
                  <th>Estado</th>
                  <th>Acreditado</th>
                  {showGt && <th>Gestión temprana</th>}
                  <th style={{ width: 56 }} />
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link to={`/persona/${r.idPersona}`} className="font-semibold text-foreground hover:underline">
                        {r.persona ?? '—'}
                      </Link>
                      {r.nuevo && <span className="app-badge app-badge--info" style={{ marginLeft: 6 }}>Nuevo</span>}
                    </td>
                    <td>{r.cargo ?? '—'}</td>
                    <td>{r.estado ?? '—'}</td>
                    <td>{acreditadoCell(r)}</td>
                    {showGt && (
                      <td>
                        <button
                          type="button"
                          className={`btn-icon ${r.gestionTemprana ? 'btn-icon--success' : 'btn-icon--primary'}`}
                          title={r.gestionTemprana ? 'Asistencia registrada' : 'Registrar asistencia'}
                          disabled={!canGt || !notFinalizado || busy}
                          onClick={() => setModal({ kind: 'gt', row: r })}
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      </td>
                    )}
                    <td>
                      <RowActionsMenu actions={buildActions(r)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const accionesNomina = (r: PersonalRow): RowAction[] => [
    { label: 'Editar', icon: <Pencil size={16} />, show: canGestionar && notFinalizado, onClick: () => abrirCargo(r) },
    { label: 'Acreditación', icon: <IdCard size={16} />, show: canAcreditar && notFinalizado, onClick: () => setModal({ kind: 'acreditar', row: r }) },
    { label: 'BackUp', icon: <Users size={16} />, show: canGestionar && notFinalizado, onClick: () => abrirBackup(r) },
    { label: 'Eliminar', icon: <Trash2 size={16} />, show: canGestionar && notFinalizado, onClick: () => abrirEliminar(r) },
  ];
  const accionesBackup = (r: PersonalRow): RowAction[] => [
    { label: 'Asociar', icon: <LinkIcon size={16} />, show: canGestionar && notFinalizado, onClick: () => abrirReasociar(r) },
    { label: 'Editar', icon: <Pencil size={16} />, show: canGestionar && notFinalizado, onClick: () => abrirCargo(r) },
    { label: 'Acreditación', icon: <IdCard size={16} />, show: canAcreditar && notFinalizado, onClick: () => setModal({ kind: 'acreditar', row: r }) },
    { label: 'Eliminar', icon: <Trash2 size={16} />, show: canGestionar && notFinalizado, onClick: () => abrirEliminar(r) },
  ];
  const accionesEliminado = (r: PersonalRow): RowAction[] => [
    { label: 'Asociar', icon: <LinkIcon size={16} />, show: canGestionar, onClick: () => abrirReasociar(r) },
  ];

  const nombreModal = modal?.row.persona ?? '';

  return (
    <div>
      <ol className="app-breadcrumb">
        <li>
          <Link to="/proyecto">Servicios</Link>
        </li>
        <li>
          <Link to={`/proyecto/${p.id}`}>{p.nombre}</Link>
        </li>
        <li className="active">· Asociar personas</li>
      </ol>

      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Asociar personas</h1>
            <p className="app-page-subtitle">
              {p.nombre}
              {p.faena ? ` · ${p.faena}` : ''}
              {!notFinalizado && ' · Servicio finalizado'}
            </p>
          </div>
        </div>
        <div className="app-page-header__actions">
          <Link to={`/proyecto/${p.id}`} className="btn btn-secondary">
            <ArrowLeft size={16} /> Volver
          </Link>
        </div>
      </div>

      {/* Asignar persona */}
      {canAsignar && notFinalizado && (
        <div className="app-card">
          <div className="app-card-header">
            <UserPlus className="app-card-header__icon" size={18} />
            <h4>Asignar persona</h4>
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
                          setPersonaSel({ id: r.id, nombre: r.nombre, estado: r.estado });
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
              <div className="app-field min-w-[220px]">
                <label className="app-field__label">Cargo</label>
                <select className="app-field__control" value={cargoAsignar} onChange={(e) => setCargoAsignar(e.target.value)}>
                  <option value="">Selecciona…</option>
                  {(cargos ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" className="btn btn-primary" disabled={!personaSel || !cargoAsignar || busy} onClick={doAsignar}>
                <Plus size={16} /> Asignar empleado
              </button>
            </div>
          </div>
        </div>
      )}

      {loadingPersonal ? (
        <div className="app-empty-state">
          <Loader2 className="mx-auto animate-spin" size={22} />
        </div>
      ) : (
        <>
          {renderTabla('Nómina del Servicio', <Users className="app-card-header__icon" size={18} />, nomina, accionesNomina, true)}
          {renderTabla('Personal BackUp', <Users className="app-card-header__icon" size={18} />, backup, accionesBackup, false)}
          {renderTabla('Personal Eliminado', <Trash2 className="app-card-header__icon" size={18} />, eliminados, accionesEliminado, false)}
        </>
      )}

      {/* Backup / Eliminar / Reasociar (motivo obligatorio) */}
      <ConfirmDialog
        open={modal?.kind === 'backup'}
        title="Mover a backUp"
        danger={false}
        confirmLabel="Guardar"
        confirmIcon={<Save size={16} />}
        busy={busy}
        confirmDisabled={motivo.trim() === ''}
        onCancel={cerrarModal}
        onConfirm={confirmar}
      >
        <p>
          {modal?.kind === 'backup' && modal.enDespacho
            ? 'La persona se encuentra incluida en un despacho. ¿Estás seguro de moverla a backUp? Ingresa el motivo.'
            : '¿Estás seguro de mover la persona a backUp? Ingresa el motivo.'}
        </p>
        <MotivoField value={motivo} onChange={setMotivo} placeholder="Motivo del backUp…" />
      </ConfirmDialog>

      <ConfirmDialog
        open={modal?.kind === 'eliminar'}
        title="Borrar asociado"
        confirmLabel="Eliminar"
        busy={busy}
        confirmDisabled={motivo.trim() === ''}
        onCancel={cerrarModal}
        onConfirm={confirmar}
      >
        <p>Ingresa el motivo de eliminación de la persona.</p>
        <MotivoField value={motivo} onChange={setMotivo} placeholder="Motivo de la eliminación…" />
      </ConfirmDialog>

      <ConfirmDialog
        open={modal?.kind === 'reasociar'}
        title="Asociar persona"
        danger={false}
        confirmLabel="Guardar"
        confirmIcon={<Save size={16} />}
        busy={busy}
        confirmDisabled={motivo.trim() === ''}
        onCancel={cerrarModal}
        onConfirm={confirmar}
      >
        <p>Ingresa el motivo de reasociación de la persona.</p>
        <MotivoField value={motivo} onChange={setMotivo} placeholder="Motivo de la reasociación…" />
      </ConfirmDialog>

      {/* Cambiar cargo */}
      <ConfirmDialog
        open={modal?.kind === 'cargo'}
        title="Modificar asociación"
        permanent={false}
        danger={false}
        confirmLabel="Guardar"
        confirmIcon={<Save size={16} />}
        busy={busy}
        confirmDisabled={cargoEditar === ''}
        onCancel={cerrarModal}
        onConfirm={confirmar}
      >
        <p>Seleccione el cargo que se asignará al empleado {nombreModal}.</p>
        <div className="app-field" style={{ marginTop: 'var(--app-space-3)' }}>
          <label className="app-field__label">Cargo</label>
          <select className="app-field__control" value={cargoEditar} onChange={(e) => setCargoEditar(e.target.value)}>
            <option value="">Selecciona…</option>
            {(cargos ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </ConfirmDialog>

      {/* Acreditación (confirmación) */}
      <ConfirmDialog
        open={modal?.kind === 'acreditar'}
        title="Acreditación"
        permanent={false}
        danger={false}
        confirmLabel="Aceptar"
        confirmIcon={<Check size={16} />}
        busy={busy}
        onCancel={cerrarModal}
        onConfirm={confirmar}
      >
        <p>
          ¿Confirma acreditación para el trabajador {nombreModal}
          {p.faena ? ` en faena ${p.faena}` : ''}, servicio {p.nombre}?
        </p>
      </ConfirmDialog>

      {/* Gestión temprana (confirmación) */}
      <ConfirmDialog
        open={modal?.kind === 'gt'}
        title="Asistencia gestión temprana"
        permanent={false}
        danger={false}
        confirmLabel="Aceptar"
        confirmIcon={<Check size={16} />}
        busy={busy}
        onCancel={cerrarModal}
        onConfirm={confirmar}
      >
        <p>
          ¿Desea {modal?.kind === 'gt' && modal.row.gestionTemprana ? 'eliminar' : 'registrar'} la asistencia a gestión
          temprana del trabajador {nombreModal}
          {p.faena ? ` en faena ${p.faena}` : ''}, servicio {p.nombre}?
        </p>
      </ConfirmDialog>
    </div>
  );
}

/** Textarea de motivo reutilizable para los diálogos de backup/eliminar/reasociar. */
function MotivoField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="app-field" style={{ marginTop: 'var(--app-space-3)' }}>
      <label className="app-field__label">Motivo</label>
      <textarea
        className="app-field__control"
        rows={4}
        maxLength={500}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
