import { NavLink } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { NavDropdown, NavDropdownButton, NavDropdownLink } from './NavDropdown';
import { EmpresaBadge } from './EmpresaBadge';
import { useAuth } from '@/features/auth/useAuth';
import { useRole } from '@/features/auth/useRole';

const DESPACHO_ROLES = [
  'DESPACHO_ACREDITACION',
  'DESPACHO_ADMINISTRADOR',
  'DESPACHO_BODEGA',
  'DESPACHO_CURSOS',
  'DESPACHO_RECEPCION',
  'DESPACHO_SSO',
  'DESPACHO_TRANSPORTE',
];

export function Navbar() {
  const { user, signOut } = useAuth();
  const { hasRole, hasAnyRole, empresaMatches } = useRole();

  const isAdmin = hasRole('ROLE_ADMIN');
  const esAlta = empresaMatches('SERVICIOS ALTA');
  const esGesta = empresaMatches('GESTA');
  const canDespacho = isAdmin || hasAnyRole(DESPACHO_ROLES);
  const canEntregas = isAdmin || hasRole('DESPACHO_BODEGA') || hasRole('LOGISTICA');
  const canConfig =
    isAdmin || hasAnyRole(['SUPERADMINISTRADOR', 'LOGISTICA', 'OBSERVADOR_RRHH', 'REPORTABILIDAD']);
  const canReporta = isAdmin || hasRole('REPORTABILIDAD') || esAlta || esGesta;
  const canVertical = isAdmin || hasRole('ADMIN_VERTICAL');

  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow">
      <div className="container flex h-[60px] items-center gap-3">
        <img src="/logo-docnomina-blanco.png" alt="docnómina" className="h-8 w-auto shrink-0" />

        <nav className="flex items-center gap-1">
          {/* Servicios */}
          <NavDropdown label="Servicios">
            <NavDropdownLink to="/proyecto">Servicios</NavDropdownLink>
            {canDespacho && <NavDropdownLink to="/despacho">Despachos</NavDropdownLink>}
            {canEntregas && <NavDropdownLink to="/entrega-epp">Entregas</NavDropdownLink>}
          </NavDropdown>

          {/* Personas (directo) */}
          <NavLink
            to="/persona"
            className={({ isActive }) =>
              `rounded-md px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-white/15 hover:text-white ${
                isActive ? 'bg-white/20 text-white' : 'text-white/90'
              }`
            }
          >
            Personas
          </NavLink>

          {/* Reportabilidad */}
          {canReporta && (
            <NavDropdown label="Reportabilidad">
              <NavDropdownLink to="/evaluacion">Evaluaciones</NavDropdownLink>
              {(esAlta || isAdmin) && (
                <NavDropdownLink to="/dashboard">Dashboard Operacional</NavDropdownLink>
              )}
              {(esGesta || isAdmin) && (
                <NavDropdownLink to="/dashboard/epp">Entrega de EPP</NavDropdownLink>
              )}
            </NavDropdown>
          )}

          {/* Configuraciones */}
          {canConfig && (
            <NavDropdown label="Configuraciones">
              <NavDropdownLink to="/empresa">Empresas</NavDropdownLink>
              <NavDropdownLink to="/empresa-cliente">Empresas cliente</NavDropdownLink>
              <NavDropdownLink to="/faena">Faenas</NavDropdownLink>
              <NavDropdownLink to="/documento">Documentos Cargo</NavDropdownLink>
              <NavDropdownLink to="/cargo">Cargos</NavDropdownLink>
              <NavDropdownLink to="/tipo-equipo">Tipos de Equipo</NavDropdownLink>
              <NavDropdownLink to="/articulo">Artículos</NavDropdownLink>
              <NavDropdownLink to="/aviso-mantenimiento">Avisos de mantenimiento</NavDropdownLink>
            </NavDropdown>
          )}

          {/* Vertical (ALTA) */}
          {canVertical && (
            <NavDropdown label="Vertical">
              <NavDropdownLink to="/articulo">Artículos SPDC</NavDropdownLink>
              <NavDropdownLink to="/mochila-spdc">Mochilas SPDC</NavDropdownLink>
            </NavDropdown>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <EmpresaBadge />
          <NavDropdown
            align="right"
            trigger={
              <span className="flex items-center gap-2">
                <User size={18} />
                <span className="hidden max-w-[180px] truncate text-white/90 lg:inline">
                  {user?.email}
                </span>
              </span>
            }
          >
            <NavDropdownButton onClick={() => signOut()}>
              <LogOut size={16} /> Cerrar sesión
            </NavDropdownButton>
          </NavDropdown>
        </div>
      </div>
    </header>
  );
}
