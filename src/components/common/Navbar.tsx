import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmpresaBadge } from './EmpresaBadge';
import { useAuth } from '@/features/auth/useAuth';
import { cn } from '@/lib/utils';

const links = [
  { to: '/proyecto', label: 'Servicios' },
  { to: '/persona', label: 'Personas' },
  { to: '/despacho', label: 'Despachos' },
  { to: '/dashboard', label: 'Dashboard' },
];

export function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow">
      <div className="container flex h-[60px] items-center gap-6">
        <img src="/logo-docnomina-blanco.png" alt="docnómina" className="h-8 w-auto shrink-0" />

        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-1.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/15 hover:text-white',
                  isActive && 'bg-white/20 text-white',
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <EmpresaBadge />
          <span className="hidden text-sm text-white/80 sm:inline">{user?.email}</span>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/15 hover:text-white"
            onClick={() => signOut()}
            title="Cerrar sesión"
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  );
}
