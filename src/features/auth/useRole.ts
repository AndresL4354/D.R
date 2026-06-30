import { useMemo } from 'react';
import { useAuth } from './useAuth';
import type { AppClaims, Role } from '@/types/domain';

/** Decodifica el payload de un JWT (base64url) sin verificar la firma. */
function decodeJwt(token: string): AppClaims {
  try {
    const payload = token.split('.')[1];
    if (!payload) return {};
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as AppClaims;
  } catch {
    return {};
  }
}

/**
 * Lee los claims app_empresa / app_roles que inyecta el Auth Hook (§8.2).
 * ⚠️ Esto es SOLO para UX (mostrar/ocultar). La autoridad real es RLS (§9).
 */
export function useRole() {
  const { session } = useAuth();

  return useMemo(() => {
    const claims = session?.access_token ? decodeJwt(session.access_token) : {};
    const empresa = claims.app_empresa ?? '';
    const roles = claims.app_roles ?? [];

    const hasRole = (r: Role | string) => roles.includes(r);
    const hasAnyRole = (rs: ReadonlyArray<Role | string>) => rs.some((r) => roles.includes(r));
    const empresaMatches = (fragment: string) =>
      empresa.toUpperCase().includes(fragment.toUpperCase());

    return { empresa, roles, hasRole, hasAnyRole, empresaMatches };
  }, [session]);
}
