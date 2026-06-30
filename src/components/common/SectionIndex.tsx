import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface SectionItem {
  to: string;
  label: string;
  desc: string;
  icon: LucideIcon;
}

/** Landing reutilizable de una sección: título + grid de tarjetas a cada vista. */
export function SectionIndex({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: SectionItem[];
}) {
  return (
    <div>
      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">{title}</h1>
            <p className="app-page-subtitle">{subtitle}</p>
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
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link key={it.to} to={it.to} className="app-card" style={{ textDecoration: 'none' }}>
              <div
                className="app-card-body"
                style={{ display: 'flex', gap: 'var(--app-space-4)', alignItems: 'center' }}
              >
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
