// =============================================================================
// sso-users  —  Provisioning de usuarios (server-to-server, API Key)
// =============================================================================
// Porta SsoController + SsoServiceImpl (create/update/upsert/get/list) y
// SsoController.authorities(). Autenticación por header X-Internal-Api-Key
// (constant-time), como InternalApiKeyFilter. Un "usuario" = auth.users + perfil.
//
// Rutas (mismas que /api/sso/*):
//   GET  /sso-users?action=authorities        → catálogo de authorities
//   GET  /sso-users                           → lista paginada (?page=&size=)
//   GET  /sso-users/{idGestaOs}               → detalle
//   POST /sso-users                           → create
//   PUT  /sso-users                           → update (idGestaOs en el body)
//   PUT  /sso-users/{idGestaOs}               → upsert idempotente (recomendado)
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { ApiError, constantTimeEquals, errorResponse, json } from '../_shared/http.ts';
import { AUTHORITIES, isKnownAuthority } from '../_shared/roles.ts';

// LOGIN_REGEX de JHipster (Constants.LOGIN_REGEX) con grupos atómicos (?>...)
// sustituidos por no-capturantes (?:...) para compatibilidad con el motor JS.
const LOGIN_REGEX =
  /^(?:[a-zA-Z0-9!$&*+=?^_`{|}~.-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*|[_.@A-Za-z0-9-]+)$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface UpsertInput {
  idGestaOs: string;
  login: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  empresa: string | null;
  activated: boolean;
  authorities: string[];
}

interface PerfilRow {
  id: string;
  id_gesta_os: string | null;
  login: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  empresa: string;
  roles: string[];
  activated: boolean;
}

function toDTO(p: PerfilRow) {
  return {
    id: p.id,
    idGestaOs: p.id_gesta_os,
    login: p.login,
    email: p.email,
    firstName: p.first_name,
    lastName: p.last_name,
    empresa: p.empresa,
    activated: p.activated,
    authorities: p.roles ?? [],
  };
}

function validateInput(raw: unknown): UpsertInput {
  const b = (raw ?? {}) as Record<string, unknown>;
  const errors: string[] = [];

  const idGestaOs = typeof b.idGestaOs === 'string' ? b.idGestaOs.trim() : '';
  const login = typeof b.login === 'string' ? b.login : '';
  const email = typeof b.email === 'string' ? b.email : '';
  const authorities = Array.isArray(b.authorities)
    ? b.authorities.filter((x): x is string => typeof x === 'string')
    : null;

  if (!idGestaOs) errors.push('idGestaOs es requerido');
  else if (idGestaOs.length > 36) errors.push('idGestaOs máx 36');

  if (!login) errors.push('login es requerido');
  else if (login.length > 50 || !LOGIN_REGEX.test(login)) errors.push('login inválido');

  if (!email) errors.push('email es requerido');
  else if (email.length < 5 || email.length > 254 || !EMAIL_REGEX.test(email))
    errors.push('email inválido');

  if (authorities === null) errors.push('authorities es requerido');

  if (errors.length) throw new ApiError('validation_error', 400, errors.join('; '));

  return {
    idGestaOs,
    login,
    email,
    firstName: typeof b.firstName === 'string' ? b.firstName : null,
    lastName: typeof b.lastName === 'string' ? b.lastName : null,
    empresa: typeof b.empresa === 'string' ? b.empresa : null,
    activated: typeof b.activated === 'boolean' ? b.activated : true,
    authorities: authorities ?? [],
  };
}

function validateAuthorities(names: string[]): void {
  for (const name of names) {
    if (!name || !name.trim()) continue;
    if (!isKnownAuthority(name.trim())) {
      throw new ApiError('unknown_authority', 400, `authority desconocida: ${name}`);
    }
  }
}

async function getByIdGestaOs(admin: SupabaseClient, idGestaOs: string): Promise<PerfilRow | null> {
  const { data, error } = await admin.from('perfil').select('*').eq('id_gesta_os', idGestaOs).maybeSingle();
  if (error) throw new ApiError('server_error', 500, error.message);
  return (data as PerfilRow | null) ?? null;
}

async function getByLogin(admin: SupabaseClient, login: string): Promise<PerfilRow | null> {
  const { data, error } = await admin.from('perfil').select('*').eq('login', login).maybeSingle();
  if (error) throw new ApiError('server_error', 500, error.message);
  return (data as PerfilRow | null) ?? null;
}

async function getByEmail(admin: SupabaseClient, email: string): Promise<PerfilRow | null> {
  const { data, error } = await admin.from('perfil').select('*').ilike('email', email).maybeSingle();
  if (error) throw new ApiError('server_error', 500, error.message);
  return (data as PerfilRow | null) ?? null;
}

async function create(admin: SupabaseClient, input: UpsertInput) {
  const idGestaOs = input.idGestaOs.trim();
  const loginNorm = input.login.toLowerCase();
  const emailNorm = input.email.toLowerCase();

  if (await getByIdGestaOs(admin, idGestaOs)) throw new ApiError('idGestaOs_already_exists', 400, 'idGestaOs ya existe');
  if (await getByLogin(admin, loginNorm)) throw new ApiError('login_already_in_use', 400, 'login ya en uso');
  if (await getByEmail(admin, emailNorm)) throw new ApiError('email_already_in_use', 400, 'email ya en uso');

  validateAuthorities(input.authorities);

  // Crea el auth.user con password aleatorio no funcional (entra solo por SSO).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: emailNorm,
    email_confirm: true,
    password: crypto.randomUUID(),
    user_metadata: { first_name: input.firstName, last_name: input.lastName },
  });
  if (createErr || !created?.user) {
    throw new ApiError('auth_user_creation_failed', 500, createErr?.message ?? 'no se pudo crear el auth user');
  }

  const row: PerfilRow = {
    id: created.user.id,
    id_gesta_os: idGestaOs,
    login: loginNorm,
    email: emailNorm,
    first_name: input.firstName,
    last_name: input.lastName,
    empresa: input.empresa ?? '',
    roles: input.authorities,
    activated: input.activated,
  };
  const { error: insErr } = await admin.from('perfil').insert(row);
  if (insErr) {
    // Rollback del auth user para no dejar huérfanos.
    await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
    throw new ApiError('server_error', 500, insErr.message);
  }
  return toDTO(row);
}

async function update(admin: SupabaseClient, input: UpsertInput) {
  const idGestaOs = input.idGestaOs.trim();
  const loginNorm = input.login.toLowerCase();
  const emailNorm = input.email.toLowerCase();

  const existing = await getByIdGestaOs(admin, idGestaOs);
  if (!existing) throw new ApiError('user_not_found', 400, 'usuario no encontrado');

  if (loginNorm !== existing.login) {
    const other = await getByLogin(admin, loginNorm);
    if (other && other.id !== existing.id) throw new ApiError('login_already_in_use', 400, 'login ya en uso');
  }
  if (emailNorm !== existing.email.toLowerCase()) {
    const other = await getByEmail(admin, emailNorm);
    if (other && other.id !== existing.id) throw new ApiError('email_already_in_use', 400, 'email ya en uso');
  }

  validateAuthorities(input.authorities);

  const row: PerfilRow = {
    id: existing.id,
    id_gesta_os: idGestaOs,
    login: loginNorm,
    email: emailNorm,
    first_name: input.firstName,
    last_name: input.lastName,
    empresa: input.empresa ?? existing.empresa,
    roles: input.authorities,
    activated: input.activated,
  };
  const { error: upErr } = await admin
    .from('perfil')
    .update({
      login: row.login,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      empresa: row.empresa,
      roles: row.roles,
      activated: row.activated,
    })
    .eq('id', existing.id);
  if (upErr) throw new ApiError('server_error', 500, upErr.message);

  if (emailNorm !== existing.email.toLowerCase()) {
    await admin.auth.admin.updateUserById(existing.id, { email: emailNorm }).catch(() => {});
  }
  return toDTO(row);
}

async function upsert(admin: SupabaseClient, idGestaOsPath: string, input: UpsertInput) {
  const pathNorm = idGestaOsPath.trim();
  if (!pathNorm) throw new ApiError('idGestaOs_required', 400, 'idGestaOs requerido');
  if (input.idGestaOs && input.idGestaOs.trim() && pathNorm !== input.idGestaOs.trim()) {
    throw new ApiError('id_mismatch', 400, 'idGestaOs del path y del body no coinciden');
  }
  input.idGestaOs = pathNorm;
  const exists = await getByIdGestaOs(admin, pathNorm);
  return exists ? update(admin, input) : create(admin, input);
}

async function listUsers(admin: SupabaseClient, page: number, size: number) {
  const from = page * size;
  const { data, count, error } = await admin
    .from('perfil')
    .select('*', { count: 'exact' })
    .order('login')
    .range(from, from + size - 1);
  if (error) throw new ApiError('server_error', 500, error.message);
  return { rows: (data as PerfilRow[] | null) ?? [], total: count ?? 0 };
}

/** Autenticación por API Key (X-Internal-Api-Key). */
function requireApiKey(req: Request): void {
  const expected = Deno.env.get('DOCNOMINA_INTERNAL_API_KEY');
  if (!expected || expected.trim() === '') {
    throw new ApiError('api_key_not_configured', 503, 'API Key no configurada en el servidor');
  }
  const provided = req.headers.get('x-internal-api-key') ?? '';
  if (!provided || !constantTimeEquals(provided, expected)) {
    throw new ApiError('unauthorized', 401, 'API Key inválida o ausente');
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    requireApiKey(req);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const url = new URL(req.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const idx = parts.indexOf('sso-users');
    const sub = idx >= 0 ? parts.slice(idx + 1) : [];
    const firstSeg = sub[0] ? decodeURIComponent(sub[0]) : null;
    const action = url.searchParams.get('action');

    if (req.method === 'GET') {
      if (action === 'authorities' || firstSeg === 'authorities') {
        return json(AUTHORITIES.map((name) => ({ name })));
      }
      if (firstSeg) {
        const found = await getByIdGestaOs(admin, firstSeg);
        if (!found) throw new ApiError('user_not_found', 400, 'usuario no encontrado');
        return json(toDTO(found));
      }
      const page = Math.max(0, Number(url.searchParams.get('page') ?? '0') || 0);
      const size = Math.min(100, Math.max(1, Number(url.searchParams.get('size') ?? '20') || 20));
      const { rows, total } = await listUsers(admin, page, size);
      return json(rows.map(toDTO), 200, { 'X-Total-Count': String(total) });
    }

    if (req.method === 'POST') {
      const input = validateInput(await req.json().catch(() => ({})));
      return json(await create(admin, input), 201);
    }

    if (req.method === 'PUT') {
      const input = validateInput(await req.json().catch(() => ({})));
      const dto = firstSeg ? await upsert(admin, firstSeg, input) : await update(admin, input);
      return json(dto, 200);
    }

    throw new ApiError('method_not_allowed', 405);
  } catch (e) {
    if (e instanceof ApiError) return errorResponse(e);
    return json({ errorKey: 'server_error', message: String(e), status: 500 }, 500);
  }
});
