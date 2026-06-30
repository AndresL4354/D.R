import { corsHeaders } from './cors.ts';

/** Respuesta JSON con headers CORS. */
export function json(body: unknown, status = 200, extraHeaders: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders, ...extraHeaders },
  });
}

/**
 * Error de negocio con `errorKey` idéntico al del backend Java
 * (BadRequestAlertException). Preserva el contrato de errores para la UX.
 */
export class ApiError extends Error {
  constructor(
    public errorKey: string,
    public status = 400,
    message?: string,
  ) {
    super(message ?? errorKey);
  }
}

/** Serializa un ApiError al shape de problema de JHipster (subset). */
export function errorResponse(e: ApiError): Response {
  return json(
    { message: e.message, errorKey: e.errorKey, entityName: 'sso', status: e.status },
    e.status,
  );
}

/** Comparación de strings en tiempo constante (anti timing-attack), como InternalApiKeyFilter. */
export function constantTimeEquals(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}
