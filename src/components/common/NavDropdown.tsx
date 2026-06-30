import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

/** Dropdown del navbar (clon del de docnomina): trigger blanco sobre rojo, menú
 *  blanco con sombra; cierra al navegar o al hacer click fuera. */
export function NavDropdown({
  label,
  trigger,
  align = 'left',
  children,
}: {
  label?: string;
  trigger?: ReactNode;
  align?: 'left' | 'right';
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/15 hover:text-white"
      >
        {trigger ?? label}
        <ChevronDown
          size={14}
          className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
        />
      </button>
      {open && (
        <div
          className={`absolute top-full z-50 mt-1 min-w-[220px] rounded-md border border-border bg-popover p-1.5 text-popover-foreground shadow-lg ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/** Ítem de un NavDropdown que navega. */
export function NavDropdownLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {children}
    </Link>
  );
}

/** Ítem de un NavDropdown que ejecuta una acción (ej. logout). */
export function NavDropdownButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {children}
    </button>
  );
}
