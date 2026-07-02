import { type ReactNode } from 'react';
import { Ban, Trash2 } from 'lucide-react';

/**
 * Diálogo de confirmación — clon del patrón NgbModal de docnomina
 * (*-delete-dialog.component.html): modal-header con título y ×, cuerpo con
 * la pregunta + nota 'Esta acción es permanente…', footer Cancelar
 * (btn-segundo, ban) / acción (btn-danger o btn-primary). Backdrop estático
 * (no cierra al hacer click fuera), como el real.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  permanent = true,
  confirmLabel = 'Eliminar',
  confirmIcon = <Trash2 size={16} />,
  danger = true,
  busy = false,
  confirmDisabled = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  /** Muestra la nota 'Esta acción es permanente y no puede deshacerse.' */
  permanent?: boolean;
  confirmLabel?: string;
  confirmIcon?: ReactNode;
  danger?: boolean;
  busy?: boolean;
  /** Deshabilita el botón de confirmar (p.ej. motivo obligatorio vacío). */
  confirmDisabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="app-modal-backdrop" role="dialog" aria-modal="true">
      <div className="app-modal">
        <div className="app-modal__header">
          <h4 className="app-modal__title">{title}</h4>
          <button type="button" className="app-modal__close" aria-label="Cerrar" onClick={onCancel}>
            ×
          </button>
        </div>
        <div className="app-modal__body">
          {children}
          {permanent && (
            <p
              className="text-muted"
              style={{ fontSize: 'var(--app-fs-sm)', marginTop: 'var(--app-space-2)', color: 'var(--app-text-muted)' }}
            >
              Esta acción es permanente y no puede deshacerse.
            </p>
          )}
        </div>
        <div className="app-modal__footer">
          <button type="button" className="btn btn-segundo" onClick={onCancel} disabled={busy}>
            <Ban size={16} /> Cancelar
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={busy || confirmDisabled}
          >
            {confirmIcon} {busy ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
