import { Link } from 'react-router-dom';
import { Briefcase, Building2, FileText, Hammer, Users } from 'lucide-react';

const ITEMS = [
  { to: '/faena', label: 'Faenas', desc: 'Faenas registradas', icon: Hammer },
  { to: '/cargo', label: 'Cargos', desc: 'Catálogo de cargos', icon: Briefcase },
  { to: '/documento', label: 'Documentos', desc: 'Tipos de documento por cargo', icon: FileText },
  { to: '/empresa', label: 'Empresas', desc: 'Empresas del sistema', icon: Building2 },
  { to: '/empresa-cliente', label: 'Empresas cliente', desc: 'Empresas cliente / mandantes', icon: Users },
];

/** Exportado como `Component` para el `lazy` del router. */
export function Component() {
  return (
    <div>
      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Configuración</h1>
            <p className="app-page-subtitle">Catálogos y parámetros del sistema</p>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--app-space-4)',
        }}
      >
        {ITEMS.map((it) => {
          const Icon = it.icon;
          return (
            <Link key={it.to} to={it.to} className="app-card" style={{ textDecoration: 'none' }}>
              <div className="app-card-body" style={{ display: 'flex', gap: 'var(--app-space-4)', alignItems: 'center' }}>
                <div className="app-avatar app-avatar--md">
                  <Icon size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--app-text)' }}>{it.label}</div>
                  <div style={{ fontSize: 'var(--app-fs-sm)', color: 'var(--app-text-muted)' }}>
                    {it.desc}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
