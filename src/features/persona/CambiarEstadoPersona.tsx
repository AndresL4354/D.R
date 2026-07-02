import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useRole } from '@/features/auth/useRole';
import { useAuth } from '@/features/auth/useAuth';
import { AREAS_OBSERVACION, ESTADOS_PERSONA, type Persona } from './api';
import { useCambiarEstadoPersona, useGuardarBloqueoPersona, verificarDocumentosPersona } from './hooks';

/**
 * Bloque "Cambiar estado" del detalle de persona — clon fiel de
 * PersonaDetailComponent.updateEstadoPersona() + validarEstadosPermitidos():
 *   - Acreditación (cambio real) → confirmación; al aceptar notifica (Fase 5) y cambia.
 *   - Activo → verifica documentos; si hay vencidos/faltantes, alerta y NO avanza.
 *   - Observación (desde otro estado) → diálogo de bloqueo (área + descripción).
 *   - Salir de Observación → diálogo de desbloqueo (motivo).
 *   - Resto → cambio directo.
 * Gating idéntico al HTML real: etiqueta VALIDADOR_RRHH/ROLE_ADMIN, selector
 * +OBSERVADOR_RRHH (y VALIDADOR sin OBSERVADOR no puede poner/salir de Observación),
 * botón Guardar VALIDADOR_RRHH/ENCARGADO_RRHH. Al guardar, vuelve atrás (previousState).
 */
export function CambiarEstadoPersona({ persona }: { persona: Persona }) {
  const navigate = useNavigate();
  const { hasRole, hasAnyRole } = useRole();
  const { user } = useAuth();
  const login = user?.email ?? '';

  const actual = persona.estado_persona ?? '';
  const [opcion, setOpcion] = useState(actual);

  const cambiarMut = useCambiarEstadoPersona();
  const bloqueoMut = useGuardarBloqueoPersona();

  // Diálogos
  const [acredOpen, setAcredOpen] = useState(false);
  const [docsInvalidos, setDocsInvalidos] = useState<string[] | null>(null);
  const [bloqueoOpen, setBloqueoOpen] = useState(false);
  const [desbloqueoOpen, setDesbloqueoOpen] = useState(false);
  const [area, setArea] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [motivo, setMotivo] = useState('');
  const [verificando, setVerificando] = useState(false);

  // --- validarEstadosPermitidos(): VALIDADOR_RRHH sin OBSERVADOR_RRHH ---
  const validadorNoObs = hasRole('VALIDADOR_RRHH') && !hasRole('OBSERVADOR_RRHH');
  const habilitarSelect = !(validadorNoObs && actual === 'Observación');
  const estados = ESTADOS_PERSONA.filter(
    (e) => !(validadorNoObs && actual !== 'Observación' && e === 'Observación'),
  );

  const canSeeLabel = hasAnyRole(['VALIDADOR_RRHH', 'ROLE_ADMIN']);
  const canSeeSelect = habilitarSelect && hasAnyRole(['VALIDADOR_RRHH', 'ROLE_ADMIN', 'OBSERVADOR_RRHH']);
  const canSave = hasAnyRole(['VALIDADOR_RRHH', 'ENCARGADO_RRHH']);
  if (!canSeeLabel && !canSeeSelect && !canSave) return null;

  const busy = cambiarMut.isPending || bloqueoMut.isPending || verificando;

  /** Cambia estado + toast + vuelve atrás (subscribeToSaveResponse → previousState). */
  const doCambiar = async (estado: string) => {
    try {
      await cambiarMut.mutateAsync({ id: persona.id, estado, usuario: login });
      toast.success('Persona actualizada exitosamente');
      navigate(-1);
    } catch (e) {
      toast.error(`No se pudo actualizar el estado: ${(e as Error).message}`);
    }
  };

  const onGuardar = async () => {
    const nuevo = opcion;
    // Acreditación (solo si es un cambio real de estado) → confirmación
    if (nuevo !== actual && nuevo === 'Acreditación') {
      setAcredOpen(true);
      return;
    }
    if (nuevo === 'Activo') {
      setVerificando(true);
      try {
        const invalidos = await verificarDocumentosPersona(persona.id);
        if (invalidos.length > 0) {
          setDocsInvalidos(invalidos);
          return;
        }
        await doCambiar(nuevo);
      } catch (e) {
        toast.error(`No se pudieron verificar los documentos: ${(e as Error).message}`);
      } finally {
        setVerificando(false);
      }
      return;
    }
    if (nuevo === 'Observación' && actual !== 'Observación') {
      setBloqueoOpen(true);
      return;
    }
    if (nuevo !== 'Observación' && actual === 'Observación') {
      setDesbloqueoOpen(true);
      return;
    }
    await doCambiar(nuevo);
  };

  // --- Acreditación: Aceptar notifica (Fase 5) y cambia; Cerrar revierte y "guarda" el actual ---
  const confirmarAcreditacion = async () => {
    setAcredOpen(false);
    toast.info('Notificación de acreditación por correo: disponible en Fase 5.');
    await doCambiar('Acreditación');
  };
  const cancelarAcreditacion = async () => {
    setAcredOpen(false);
    setOpcion(actual);
    await doCambiar(actual);
  };

  // --- Activo con documentos inválidos: Aceptar o Cerrar → revierte y "guarda" el actual ---
  const cerrarDocsInvalidos = async () => {
    setDocsInvalidos(null);
    setOpcion(actual);
    await doCambiar(actual);
  };

  // --- Bloqueo (paso a Observación) ---
  const guardarBloqueo = async () => {
    try {
      await bloqueoMut.mutateAsync({
        id: persona.id,
        motivo: area || null,
        descripcion: descripcion || null,
        usuario: login,
        estadoBloqueo: 'BLOQUEADO',
      });
      setBloqueoOpen(false);
      await doCambiar('Observación');
    } catch (e) {
      toast.error(`No se pudo registrar la observación: ${(e as Error).message}`);
    }
  };

  // --- Desbloqueo (salir de Observación) ---
  const guardarDesbloqueo = async () => {
    try {
      await bloqueoMut.mutateAsync({
        id: persona.id,
        motivo: null,
        descripcion: motivo || null,
        usuario: login,
        estadoBloqueo: 'DESBLOQUEADO',
      });
      setDesbloqueoOpen(false);
      await doCambiar(opcion);
    } catch (e) {
      toast.error(`No se pudo registrar el desbloqueo: ${(e as Error).message}`);
    }
  };

  return (
    <div className="app-card">
      <div className="app-card-header">
        <ShieldAlert className="app-card-header__icon" size={18} />
        <h4>Estado</h4>
      </div>
      <div className="app-card-body">
        <div className="flex flex-wrap items-end gap-4">
          {canSeeLabel && (
            <div>
              <div className="app-detail-list__item">
                <dt>Estado actual</dt>
                <dd>{actual || '—'}</dd>
              </div>
            </div>
          )}
          {canSeeSelect && (
            <div className="app-field min-w-[240px]">
              <label className="app-field__label">Cambiar estado</label>
              <select
                className="app-field__control"
                value={opcion}
                onChange={(e) => setOpcion(e.target.value)}
              >
                {estados.map((es) => (
                  <option key={es} value={es}>
                    {es}
                  </option>
                ))}
              </select>
            </div>
          )}
          {canSave && (
            <button type="button" className="btn btn-primary" onClick={onGuardar} disabled={busy}>
              <Save size={16} /> {busy ? 'Procesando…' : 'Guardar'}
            </button>
          )}
        </div>
      </div>

      {/* Confirmación de Acreditación (CustomAlertDialog) */}
      <ConfirmDialog
        open={acredOpen}
        title="Alerta"
        permanent={false}
        danger={false}
        confirmLabel="Aceptar"
        confirmIcon={<Save size={16} />}
        busy={busy}
        onCancel={cancelarAcreditacion}
        onConfirm={confirmarAcreditacion}
      >
        <p>¿Esta seguro/a de cambiar el estado de la persona?</p>
      </ConfirmDialog>

      {/* Documentos inválidos al pasar a Activo (CustomAlertDialog informativa) */}
      <ConfirmDialog
        open={docsInvalidos != null}
        title="Alerta"
        permanent={false}
        danger={false}
        confirmLabel="Aceptar"
        confirmIcon={<Save size={16} />}
        busy={busy}
        onCancel={cerrarDocsInvalidos}
        onConfirm={cerrarDocsInvalidos}
      >
        <p>Esta persona tiene documentos vencidos o sin cargar: {(docsInvalidos ?? []).join(', ')}</p>
      </ConfirmDialog>

      {/* Bloqueo (Observación): área + descripción */}
      <ConfirmDialog
        open={bloqueoOpen}
        title="Observación"
        permanent={false}
        danger={false}
        confirmLabel="Guardar"
        confirmIcon={<Save size={16} />}
        busy={busy}
        onCancel={() => {
          setBloqueoOpen(false);
          setOpcion(actual);
        }}
        onConfirm={guardarBloqueo}
      >
        <p>Completa la información del área de observación.</p>
        <div className="app-field" style={{ marginTop: 'var(--app-space-3)' }}>
          <label className="app-field__label">Área observación</label>
          <select className="app-field__control" value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">Selecciona…</option>
            {AREAS_OBSERVACION.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="app-field" style={{ marginTop: 'var(--app-space-3)' }}>
          <label className="app-field__label">Descripción</label>
          <textarea
            className="app-field__control"
            rows={4}
            maxLength={500}
            placeholder="Describe el motivo de la observación..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>
      </ConfirmDialog>

      {/* Desbloqueo (salir de Observación): motivo */}
      <ConfirmDialog
        open={desbloqueoOpen}
        title="Desbloquear"
        permanent={false}
        danger={false}
        confirmLabel="Guardar"
        confirmIcon={<Save size={16} />}
        busy={busy}
        onCancel={() => {
          setDesbloqueoOpen(false);
          setOpcion(actual);
        }}
        onConfirm={guardarDesbloqueo}
      >
        <p>Ingresa el motivo del desbloqueo.</p>
        <div className="app-field" style={{ marginTop: 'var(--app-space-3)' }}>
          <label className="app-field__label">Motivo</label>
          <textarea
            className="app-field__control"
            rows={4}
            maxLength={500}
            placeholder="Describe el motivo del desbloqueo..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
