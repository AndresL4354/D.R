import { useRole } from '@/features/auth/useRole';

/**
 * Empresa/tenant del usuario actual (lee el claim app_empresa del JWT).
 * Solo para UX (mostrar badge, prellenar filtros). La autoridad real es RLS.
 */
export function useEmpresa(): string {
  const { empresa } = useRole();
  return empresa;
}
