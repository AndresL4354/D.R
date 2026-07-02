import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';

export interface RowAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  /** Ocultar el ítem si es false (gating de roles / condición). */
  show?: boolean;
}

/** Menú kebab de acciones por fila (clon del mat-menu de docnomina). */
export function RowActionsMenu({ actions }: { actions: RowAction[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const visibles = actions.filter((a) => a.show !== false);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        className="btn-icon btn-icon--primary"
        title="Acciones"
        aria-label="Menú de acciones"
        onClick={() => setOpen((o) => !o)}
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="app-navbar__dropdown app-navbar__dropdown--end" style={{ marginTop: 4 }}>
          {visibles.map((a) => (
            <button
              key={a.label}
              type="button"
              className="app-navbar__dropdown-item"
              onClick={() => {
                setOpen(false);
                a.onClick();
              }}
            >
              {a.icon} <span>{a.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
