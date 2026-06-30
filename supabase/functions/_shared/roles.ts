/**
 * Catálogo de authorities (roles) de docnomina. Es la fuente de verdad mientras
 * no exista una tabla `rol` migrada (§7.2). El provisioning valida contra esto
 * igual que SsoServiceImpl.resolverAuthorities() valida contra jhi_authority.
 */
export const AUTHORITIES = [
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

const SET = new Set<string>(AUTHORITIES);

export function isKnownAuthority(name: string): boolean {
  return SET.has(name);
}
