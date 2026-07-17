# Edge Functions (Deno)

Cada función vive en `supabase/functions/<nombre>/index.ts` y se despliega con
`supabase functions deploy <nombre>`.

## Estado

| Función | Fase | Estado | Propósito | Auth |
|---|---|---|---|---|
| `sso-consume` | 1 | ✅ implementada | Canje del launch token de Gesta OS → magic link (§13.1) | pública (`verify_jwt=false`; valida el token contra el hub) |
| `sso-users` | 1 | ✅ implementada | Provisioning de usuarios por `id_gesta_os` + catálogo de authorities (§13.2) | `X-Internal-Api-Key` |
| `integracion` | 7 | ✅ implementada | 9 GET server-to-server: trabajadores por id/RUT (+servicio-actual, +evaluaciones), servicios activos, personal por servicio, turnos, stats/login (caché 60s) — clon de `IntegracionResource` | `X-Internal-Api-Key` |
| `pdf-ficha`, `pdf-*` | 5 | ⬜ pendiente | Generación de PDF (ficha, evaluaciones, nómina) (§12) | sesión usuario |
| `email-notificacion` | 5 | ⬜ pendiente | Notificaciones vía Resend (§12) | sesión / service |
| `bi-*` | 6 | ⬜ pendiente | Endpoints BI con cross-filtering imperativo (§11) | sesión usuario |
| `job-diario`, `job-limpieza` | 5 | ⬜ pendiente | Invocadas por pg_cron (§12) | service role |

## sso-consume  (público)

`POST /functions/v1/sso-consume` con `{ "token": "<launchToken>" }`.

1. Valida `token` y `SSO_GESTA_OS_HUB_URL`.
2. `POST <hub>/functions/v1/sso-consume-token { token }` (el hub valida y consume el token).
3. Valida `access_active`, `app_slug`, `user_id`.
4. Resuelve `perfil` por `id_gesta_os == user_id` (provisionado, activado, con roles).
5. `auth.admin.generateLink({ type: 'magiclink' })` → responde `{ action_link }`.

Los `errorKey` y su orden son **idénticos** a `SsoServiceImpl.consume()` (ver §9 de
`SSO-GESTA-OS.md`): `token_required`, `sso_not_configured`, `hub_rejected`,
`hub_unreachable`, `hub_empty_response`, `access_inactive`, `invalid_app_slug`,
`missing_hub_user_id`, `user_not_provisioned`, `user_not_activated`, `no_authorities`.
Los roles que envíe el hub se **ignoran** (docnomina es la fuente de verdad).

## sso-users  (API Key)

Header `X-Internal-Api-Key` (comparación en tiempo constante). Mismas rutas que `/api/sso/*`:

| Método | Ruta | Acción |
|---|---|---|
| GET | `/sso-users?action=authorities` | catálogo de authorities |
| GET | `/sso-users` | lista paginada (`?page=&size=`) |
| GET | `/sso-users/{idGestaOs}` | detalle |
| POST | `/sso-users` | create |
| PUT | `/sso-users` | update (idGestaOs en el body) |
| PUT | `/sso-users/{idGestaOs}` | **upsert** idempotente (recomendado) |

Un "usuario" = `auth.users` (GoTrue) + fila en `perfil`. Password aleatorio no
funcional (solo entra por SSO). `errorKey` preservados: `idGestaOs_already_exists`,
`login_already_in_use`, `email_already_in_use`, `unknown_authority`, `user_not_found`,
`id_mismatch`, `idGestaOs_required`, `validation_error`, `unauthorized`,
`api_key_not_configured`.

## Probar / desplegar (requiere Supabase CLI)

```bash
# Local (levanta Deno + Postgres + GoTrue locales)
npx supabase start
npx supabase functions serve --env-file supabase/functions/.env.local

# Deploy al proyecto remoto
npx supabase functions deploy sso-consume
npx supabase functions deploy sso-users

# Secrets (NUNCA en el front)
npx supabase secrets set --env-file supabase/functions/.env.local
```

> ⏳ **Tests (`deno test`) pendientes**: requieren Deno instalado. La lógica pura
> (validación, matching de `app_slug`, comparación de API key) está factorizada
> para testearla cuando Deno/CLI estén disponibles (§14).

## Regla de claves

Los secrets (`SUPABASE_SERVICE_ROLE_KEY` se auto-inyecta; `DOCNOMINA_INTERNAL_API_KEY`,
`SSO_GESTA_OS_*`) **nunca** se exponen al front. Ver `.env.example`.
