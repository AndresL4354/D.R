# docnomina-web

Reescritura de **docnomina** (Angular 11 + Spring Boot/JHipster) a **React 18 + Vite + TypeScript + Supabase**.

> Estado: **Fase 0 — Fundaciones** (scaffold). Ver el plan completo en
> `RepoDocnomina/plan_refactor_react_supabase_20260630.md`.

## Requisitos

- Node 18+ (probado en Node 24)
- npm (o pnpm/yarn)
- Supabase CLI vía `npx supabase` (no es dependencia del proyecto)

## Arranque

```bash
npm install
cp .env.example .env.local   # completa las credenciales reales de Supabase
npm run dev                  # http://localhost:5173
```

> El `.env.local` incluido trae **placeholders** para que `npm run dev` arranque.
> Las llamadas a Supabase fallarán hasta poner una URL + anon key reales.

## Scripts

| Script | Acción |
|---|---|
| `npm run dev` | servidor de desarrollo (Vite) |
| `npm run build` | `tsc -b` + `vite build` |
| `npm run preview` | sirve el build de producción |
| `npm run typecheck` | chequeo de tipos sin emitir |
| `npm run lint` | ESLint (flat config) |
| `npm run format` | Prettier |
| `npm run test` | Vitest |
| `npm run test:e2e` | Playwright |
| `npm run gen:types` | regenera `src/types/database.types.ts` desde Supabase |

## Estructura

```
src/
├── main.tsx · App.tsx · router.tsx · index.css
├── lib/            supabase.ts · queryClient.ts · utils.ts
├── components/
│   ├── ui/         shadcn/ui (button, input, card, sonner)
│   └── common/     AppLayout · Navbar · EmpresaBadge
├── features/
│   ├── auth/       useAuth · useRole · RequireAuth · RequireRole · LoginPage · SsoCallbackPage
│   └── persona/    api · hooks · schema · PersonaList   (slice de ejemplo del patrón §6)
├── hooks/          useDebounce · useEmpresa
├── stores/         uiStore (zustand)
└── types/          database.types.ts (generado) · domain.ts
supabase/
├── config.toml
├── migrations/     0001_schema · 0002_perfil · 0003_rls · 0004_functions · 0005_cron
├── functions/      (Edge Functions por fase)
└── seed.sql
```

## Mapa de patrones (de Angular → React)

| Angular | React |
|---|---|
| `*.service.ts` (HttpClient) | `features/*/api.ts` + `hooks.ts` (TanStack Query sobre PostgREST) |
| Reactive Forms | React Hook Form + Zod (`schema.ts`) |
| `app-routing` / `entity-routing` | `router.tsx` (data router + `lazy`) |
| `UserRouteAccessService` | `<RequireAuth>` |
| `gesta/alta-route-access` | `<RequireRole empresa roles>` (UX; autoridad real = RLS) |
| `auth*.interceptor` | supabase-js (token + refresh automáticos) |
| `error-handler` + `notification` | `QueryClient` `onError` → `sonner` |
| tablas ng-bootstrap | TanStack Table + `<DataTable>` (pendiente) |

## Componentes shadcn/ui

Para agregar más componentes:

```bash
npx shadcn@latest add table dialog form select dropdown-menu ...
```

Se generan en `src/components/ui/`. Ya están `button`, `input`, `card`, `sonner`.

## Próximos pasos (Fase 1)

1. Crear proyecto Supabase y completar `.env.local`.
2. Migrar el esquema de `diplanner` a `supabase/migrations/0001_schema.sql` (§7).
3. `npm run gen:types` para reemplazar el placeholder de tipos.
4. Tabla `perfil` + Auth Hook (ya plantillado en `0002_perfil.sql`).
5. Edge Functions `sso-consume` / `sso-users`.
6. Primeras policies RLS + tests pgTAP.

## Seguridad

- El front usa **solo** la `anon` key + la sesión del usuario.
- El `service_role` key y demás secrets **nunca** van con prefijo `VITE_`: viven en
  Edge Functions (`supabase secrets set`).
- La autorización real es **RLS** en la base, no el gating de UI.
