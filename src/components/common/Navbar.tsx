import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { useRole } from '@/features/auth/useRole';
import { useNotificacionesDocumentos } from '@/features/notificaciones/useNotificacionesDocumentos';

/* =============================================================================
   Navbar — clon exacto de layouts/navbar/navbar.component.html (docnomina v2).
   Mismos grupos, mismas autoridades, mismos iconos (PNGs reales) y campanas.
   ============================================================================= */

/** Ítem de menú desplegable: icono PNG (clase logo-*) + etiqueta. */
function DropItem({
  to,
  icon,
  label,
  show = true,
  onNavigate,
}: {
  to: string;
  icon: string;
  label: string;
  show?: boolean;
  onNavigate: () => void;
}) {
  const { pathname } = useLocation();
  if (!show) return null;
  const active = pathname === to || pathname.startsWith(to + '/');
  return (
    <li>
      <Link
        to={to}
        onClick={onNavigate}
        className={`app-navbar__dropdown-item${active ? ' active' : ''}`}
      >
        <span className={`app-navbar__dropdown-icon ${icon}`} aria-hidden />
        <span>{label}</span>
      </Link>
    </li>
  );
}

/** Item top-level con dropdown (Servicios, Reportabilidad, Configuraciones, Vertical, Mi perfil). */
function NavMenu({
  label,
  icon,
  trigger,
  active,
  align = 'left',
  show = true,
  children,
}: {
  label?: string;
  icon?: string;
  trigger?: ReactNode;
  active?: boolean;
  align?: 'left' | 'right';
  show?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  if (!show) return null;

  return (
    <li ref={ref} className={`app-navbar__item${active ? ' active' : ''}${open ? ' show' : ''}`}>
      <button type="button" className="app-navbar__link" onClick={() => setOpen((o) => !o)}>
        {trigger ?? (
          <>
            {icon && <span className={`app-navbar__icon ${icon}`} aria-hidden />}
            <span className="app-navbar__label">{label}</span>
          </>
        )}
        <ChevronDown size={14} className={`app-navbar__caret${open ? ' app-navbar__caret--open' : ''}`} />
      </button>
      {open && (
        <ul className={`app-navbar__dropdown${align === 'right' ? ' app-navbar__dropdown--end' : ''}`}>
          {children}
        </ul>
      )}
    </li>
  );
}

export function Navbar() {
  const { user, signOut } = useAuth();
  const { hasRole, hasAnyRole, empresaMatches } = useRole();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const closeMenu = () => {}; // los <Link> ya cierran el dropdown vía cambio de ruta

  // --- Autoridades (idénticas a navbar.component.ts) ---
  const validarRolCliente = !hasRole('CLIENTE_FAENA');
  const esAlta =
    empresaMatches('SERVICIOS ALTA') && hasAnyRole(['ROLE_ADMIN', 'ADMIN_VERTICAL', 'OPERACIONES']);
  const esGesta =
    empresaMatches('GESTA') &&
    hasAnyRole(['ROLE_ADMIN', 'DESPACHO_ADMINISTRADOR', 'DESPACHO_BODEGA', 'REPORTABILIDAD']);

  const verPersonas = hasAnyRole([
    'ROLE_ADMIN',
    'VALIDADOR_RRHH',
    'ENCARGADO_RRHH',
    'SUPERADMINISTRADOR BP',
    'RRHH',
    'OPERACIONES',
  ]);
  const verReporta = hasRole('REPORTABILIDAD') || esAlta || esGesta;
  const verConfig = hasAnyRole([
    'ROLE_ADMIN',
    'SUPERADMINISTRADOR',
    'SUPERADMINISTRADOR BP',
    'RRHH',
    'LOGISTICA',
  ]);
  const verVertical = hasRole('ADMIN_VERTICAL');
  const configAdmin = hasAnyRole(['ROLE_ADMIN', 'SUPERADMINISTRADOR', 'SUPERADMINISTRADOR BP']);
  const configRrhh = hasAnyRole(['ROLE_ADMIN', 'SUPERADMINISTRADOR', 'SUPERADMINISTRADOR BP', 'RRHH']);

  // --- Estado activo del item (subrayado) ---
  const starts = (...ps: string[]) => ps.some((p) => pathname === p || pathname.startsWith(p));
  const serviciosActive = starts('/proyecto', '/despacho', '/entrega-epp');
  const personasActive = starts('/persona');
  const reportaActive = starts('/dashboard', '/evaluacion', '/reporte-flash');
  const configActive = starts(
    '/empresa',
    '/empresa-cliente',
    '/faena',
    '/documento',
    '/cargo',
    '/tipo-equipo',
    '/articulo',
    '/aviso-mantenimiento',
  );
  const verticalActive = starts('/mochila-spdc');

  // --- Campanas (documentos vencidos / por vencer) ---
  const { data: notif } = useNotificacionesDocumentos(validarRolCliente);

  return (
    <nav className="app-navbar">
      <div className="app-navbar__brand">
        <span className="app-navbar__logo" aria-label="DocNómina" />
      </div>

      <div className="app-navbar__collapse">
        <ul className="app-navbar__nav">
          {/* Servicios */}
          <NavMenu label="Servicios" icon="logo-iconproyectos" active={serviciosActive} show={validarRolCliente}>
            <DropItem to="/proyecto" icon="logo-servicios" label="Servicios" onNavigate={closeMenu} />
            <DropItem
              to="/despacho"
              icon="logo-despachos"
              label="Despachos"
              show={hasRole('DESPACHOS')}
              onNavigate={closeMenu}
            />
            <DropItem
              to="/entrega-epp"
              icon="logo-entregas"
              label="Entregas"
              show={hasAnyRole(['ROLE_ADMIN', 'SUPERADMINISTRADOR', 'SUPERADMINISTRADOR BP', 'ENCARGADO_BODEGA'])}
              onNavigate={closeMenu}
            />
          </NavMenu>

          {/* Personas (link directo) */}
          {verPersonas && (
            <li className={`app-navbar__item${personasActive ? ' active' : ''}`}>
              <Link to="/persona" className="app-navbar__link">
                <span className="app-navbar__icon logo-iconpersonas" aria-hidden />
                <span className="app-navbar__label">Personas</span>
              </Link>
            </li>
          )}

          {/* Reportabilidad */}
          <NavMenu label="Reportabilidad" icon="logo-reporta" active={reportaActive} show={verReporta}>
            <DropItem
              to="/dashboard/evaluaciones"
              icon="logo-reporte-evaluaciones"
              label="Evaluaciones"
              show={hasRole('REP_EVALUACIONES')}
              onNavigate={closeMenu}
            />
            <DropItem
              to="/dashboard/personas"
              icon="logo-reporte-personas"
              label="Personas"
              show={hasRole('REP_PERSONAS')}
              onNavigate={closeMenu}
            />
            <DropItem
              to="/evaluacion"
              icon="logo-reporte-evaluaciones"
              label="Evaluaciones"
              show={hasRole('REP_PERSONAS')}
              onNavigate={closeMenu}
            />
            <DropItem
              to="/dashboard/vencimientos"
              icon="logo-reporte-vencimientos"
              label="Vencimientos"
              show={hasRole('REP_VENCIMIENTOS')}
              onNavigate={closeMenu}
            />
            <DropItem
              to="/dashboard"
              icon="logo-reporta"
              label="Dashboard Operacional"
              show={esAlta}
              onNavigate={closeMenu}
            />
            <DropItem
              to="/dashboard/epp"
              icon="logo-reporta"
              label="Entrega de EPP"
              show={esGesta}
              onNavigate={closeMenu}
            />
          </NavMenu>

          {/* Configuraciones */}
          <NavMenu label="Configuraciones" icon="logo-iconconfiguraciones" active={configActive} show={verConfig}>
            <DropItem to="/empresa" icon="logo-empresa" label="Empresas" show={configAdmin} onNavigate={closeMenu} />
            <DropItem
              to="/empresa-cliente"
              icon="logo-empresa-cliente"
              label="Empresas cliente"
              show={configAdmin}
              onNavigate={closeMenu}
            />
            <DropItem to="/faena" icon="logo-faena" label="Faenas" show={configAdmin} onNavigate={closeMenu} />
            <DropItem
              to="/documento"
              icon="logo-documento-cargo"
              label="Documentos Cargo"
              show={configRrhh}
              onNavigate={closeMenu}
            />
            <DropItem to="/cargo" icon="logo-cargo" label="Cargos" show={configRrhh} onNavigate={closeMenu} />
            <DropItem
              to="/tipo-equipo"
              icon="logo-engranes"
              label="Tipos de Equipo"
              show={configAdmin}
              onNavigate={closeMenu}
            />
            <DropItem to="/articulo" icon="logo-engranes" label="Artículos" show={configRrhh} onNavigate={closeMenu} />
            <DropItem
              to="/aviso-mantenimiento"
              icon="logo-iconconfiguraciones"
              label="Avisos de mantenimiento"
              show={hasAnyRole(['ROLE_ADMIN', 'SUPERADMINISTRADOR'])}
              onNavigate={closeMenu}
            />
          </NavMenu>

          {/* Vertical (ALTA) */}
          <NavMenu label="Vertical" icon="logo-iconconfiguraciones" active={verticalActive} show={verVertical}>
            <DropItem to="/articulo" icon="logo-engranes" label="Artículos SPDC" onNavigate={closeMenu} />
            <DropItem to="/mochila-spdc" icon="logo-engranes" label="Mochilas SPDC" onNavigate={closeMenu} />
          </NavMenu>
        </ul>

        {/* Campanas: documentos vencidos / por vencer */}
        {validarRolCliente && (
          <div className="app-navbar__alerts">
            <button
              type="button"
              className="app-navbar__alert"
              title="Documentos vencidos"
              aria-label="Documentos vencidos"
              onClick={() => navigate('/dashboard/vencimientos')}
            >
              <span className="app-navbar__alert-icon logo-img-new" aria-hidden />
              <span className="app-navbar__alert-badge app-navbar__alert-badge--danger">
                {notif?.vencidos ? notif.vencidos : ''}
              </span>
            </button>
            <button
              type="button"
              className="app-navbar__alert"
              title="Documentos por vencer"
              aria-label="Documentos por vencer"
              onClick={() => navigate('/dashboard/vencimientos')}
            >
              <span className="app-navbar__alert-icon logo-img-new" aria-hidden />
              <span className="app-navbar__alert-badge app-navbar__alert-badge--warning">
                {notif?.porVencer ? notif.porVencer : ''}
              </span>
            </button>
          </div>
        )}

        {/* Mi perfil */}
        <ul className="app-navbar__nav app-navbar__nav--end">
          <NavMenu
            align="right"
            trigger={
              <span className="app-navbar__profile">
                <span className="app-navbar__profile-icon logo-iconperfil" aria-hidden />
                <span className="app-navbar__label" title={user?.email ?? ''}>
                  Mi perfil
                </span>
              </span>
            }
          >
            <DropItem
              to="/user-management"
              icon="logo-usu"
              label="Usuarios"
              show={configAdmin}
              onNavigate={closeMenu}
            />
            <DropItem
              to="/account/settings"
              icon="logo-ajustes"
              label="Ajustes"
              show={validarRolCliente}
              onNavigate={closeMenu}
            />
            <DropItem
              to="/account/password"
              icon="logo-pass"
              label="Contraseña"
              show={validarRolCliente}
              onNavigate={closeMenu}
            />
            <li>
              <button type="button" className="app-navbar__dropdown-item" onClick={() => signOut()}>
                <span className="app-navbar__dropdown-icon logo-sesion" aria-hidden />
                <span>Cerrar sesión</span>
              </button>
            </li>
          </NavMenu>
        </ul>
      </div>
    </nav>
  );
}
