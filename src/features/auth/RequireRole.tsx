import type { ReactNode } from 'react';
import { useRole } from './useRole';

interface RequireRoleProps {
  children: ReactNode;
  /** Roles aceptados (basta uno). Si se omite, no se filtra por rol. */
  roles?: ReadonlyArray<string>;
  /** Fragmento de empresa requerido (ej. "ALTA", "GESTA"). ROLE_ADMIN siempre pasa. */
  empresa?: string;
}

/**
 * Porta requireAlta()/requireGesta() del backend Java al gating de UI.
 * ⚠️ Solo oculta/muestra; la autoridad real la impone RLS en la base.
 */
export function RequireRole({ children, roles, empresa }: RequireRoleProps) {
  const { hasRole, hasAnyRole, empresaMatches } = useRole();

  const roleOk = !roles || roles.length === 0 || hasAnyRole(roles);
  const empresaOk = !empresa || empresaMatches(empresa) || hasRole('ROLE_ADMIN');

  if (!roleOk || !empresaOk) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold">Sin acceso</h1>
        <p className="text-sm text-muted-foreground">
          Tu cuenta no tiene permisos para esta sección.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
