// =============================================================================
// sso-consume  —  Canje del launch token de Gesta OS  (PÚBLICO)
// =============================================================================
// Porta SsoServiceImpl.consume() (Spring). Diferencias respecto al original:
//   - DocNomina ya no emite un JWT HS512 propio: crea una sesión Supabase vía
//     magic link (admin.generateLink) y devuelve { action_link }. El front lo
//     canjea y queda logueado.
//   - El usuario local vive en `perfil` (no en jhi_user); se resuelve por
//     id_gesta_os == hub.user_id.
// Se preservan EXACTOS los errorKey y su orden de evaluación (ver §9 de
// SSO-GESTA-OS.md) para no romper la UX.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { ApiError, errorResponse, json } from '../_shared/http.ts';

const HUB_CONSUME_PATH = '/functions/v1/sso-consume-token';

interface HubConsumeResponse {
  user_id?: string;
  email?: string;
  app_slug?: string;
  access_active?: boolean;
  roles?: string[]; // se ignoran: docnomina es la fuente de verdad de autorización
}

function trimTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

async function callHub(hubUrl: string, token: string): Promise<HubConsumeResponse> {
  const url = trimTrailingSlash(hubUrl) + HUB_CONSUME_PATH;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  } catch {
    throw new ApiError('hub_unreachable', 400, 'no se pudo contactar al hub');
  }
  if (!res.ok) {
    throw new ApiError('hub_rejected', 400, 'token rechazado por el hub');
  }
  let body: HubConsumeResponse | null;
  try {
    body = (await res.json()) as HubConsumeResponse;
  } catch {
    body = null;
  }
  if (!body) {
    throw new ApiError('hub_empty_response', 400, 'respuesta vacía del hub');
  }
  return body;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (req.method !== 'POST') throw new ApiError('method_not_allowed', 405);

    const payload = await req.json().catch(() => ({}) as { token?: unknown });
    const token = (payload as { token?: unknown }).token;
    if (typeof token !== 'string' || token.trim() === '') {
      throw new ApiError('token_required', 400, 'token requerido');
    }

    const hubUrl = Deno.env.get('SSO_GESTA_OS_HUB_URL');
    if (!hubUrl || hubUrl.trim() === '') {
      throw new ApiError('sso_not_configured', 400, 'integración SSO no configurada');
    }
    const appSlug = Deno.env.get('SSO_GESTA_OS_APP_SLUG') ?? 'docnomina';

    const identity = await callHub(hubUrl, token);

    // Orden idéntico al Java: access_active → app_slug → user_id → provisionado → activado → roles.
    if (identity.access_active !== true) {
      throw new ApiError('access_inactive', 400, 'acceso no autorizado en el hub');
    }
    if (appSlug && (identity.app_slug ?? '').toLowerCase() !== appSlug.toLowerCase()) {
      throw new ApiError('invalid_app_slug', 400, 'app_slug inválido');
    }

    const hubUserId = (identity.user_id ?? '').trim();
    if (!hubUserId) {
      throw new ApiError('missing_hub_user_id', 400, 'respuesta del hub sin user_id');
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: perfil, error } = await admin
      .from('perfil')
      .select('id, email, activated, roles')
      .eq('id_gesta_os', hubUserId)
      .maybeSingle();

    if (error) throw new ApiError('server_error', 500, error.message);
    if (!perfil) throw new ApiError('user_not_provisioned', 400, 'usuario no provisionado en DocNomina');
    if (!perfil.activated) throw new ApiError('user_not_activated', 400, 'usuario no activado');
    if (!Array.isArray(perfil.roles) || perfil.roles.length === 0) {
      throw new ApiError('no_authorities', 400, 'usuario sin roles asignados en DocNomina');
    }

    // Crea sesión Supabase: magic link al email del perfil (el front lo canjea).
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: perfil.email,
    });
    if (linkErr || !link?.properties?.action_link) {
      throw new ApiError('session_creation_failed', 500, linkErr?.message ?? 'no se pudo generar el enlace');
    }

    return json({ action_link: link.properties.action_link });
  } catch (e) {
    if (e instanceof ApiError) return errorResponse(e);
    return json({ errorKey: 'server_error', message: String(e), status: 500 }, 500);
  }
});
