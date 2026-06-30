/**
 * Tipos de dominio (no generados): enums de roles, empresas/tenants y claims.
 * Tomados del inventario real (§1 del plan).
 */

/** Roles del sistema (jhi_authority + constantes). */
export const ROLES = [
  'ROLE_ADMIN',
  'ROLE_API',
  'ADMIN_VERTICAL',
  'OPERACIONES',
  'SUPERVISOR',
  'LOGISTICA',
  'CLIENTE',
  'SSO',
  'SUPERADMINISTRADOR',
  'DESPACHO_ACREDITACION',
  'DESPACHO_ADMINISTRADOR',
  'DESPACHO_BODEGA',
  'DESPACHO_CURSOS',
  'DESPACHO_RECEPCION',
  'DESPACHO_SSO',
  'DESPACHO_TRANSPORTE',
  'OBSERVADOR_RRHH',
  'REPORTABILIDAD',
  'ENCARGADO_ASISTENCIA_GT',
] as const;

export type Role = (typeof ROLES)[number];

/** Tenants / empresas. El gating fino se hace por ILIKE sobre el nombre. */
export type Tenant = 'GESTA' | 'SERVICIOS ALTA' | 'SERVICIOS';

/** Claims inyectados en el JWT por el Auth Hook (§8.2 del plan). */
export interface AppClaims {
  app_empresa?: string;
  app_roles?: string[];
}
