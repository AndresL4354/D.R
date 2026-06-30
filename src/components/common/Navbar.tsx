import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmpresaBadge } from './EmpresaBadge';
import { useAuth } from '@/features/auth/useAuth';
import { cn } from '@/lib/utils';

const links = [
  { to: '/persona', label: 'Personas' },
  { to: '/despacho', label: 'Despacho' },
  { to: '/dashboard', label: 'Dashboard' },
];

export function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-14 items-center gap-6">
        <span className="font-semibold tracking-tight">docnomina</span>

        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <EmpresaBadge />
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="ghost" size="icon" onClick={() => signOut()} title="Cerrar sesión">
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  );
}
