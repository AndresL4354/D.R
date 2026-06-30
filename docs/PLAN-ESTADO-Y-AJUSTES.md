# docnomina-web — Estado real vs. plan, y ajustes

> **Fecha:** 2026-06-30 · Documento vivo. Acompaña a `plan_refactor_react_supabase_20260630.md` (el plan original NO se reescribe; aquí se registra el estado medido y los ajustes derivados de lo construido/encontrado).
> **Repo:** `AndresL4354/D.R` (rama única `main`). **Supabase:** proyecto `sfuwzgcvmczsoydueeog` ("D.R Demo").

---

## 1. Estado real por fase (vs. roadmap §15 del plan)

| Fase | Plan | Estado real | Detalle |
|---|---|---|---|
| **0. Fundaciones** | scaffold, proyecto Supabase, esquema, gen types, CI, índices BI | 🟢 **~90%** | Scaffold Vite/TS/Tailwind/shadcn/Query/Router ✅. Esquema (85 tablas) migrado vía pg_restore + 17 migraciones ✅. `gen types` ✅. **Falta:** CI (no existe), índices BI (`optimizacion_bi_indices.sql` no cargado). |
| **1. Auth + SSO** | perfil, Auth Hook, sso-consume/users, Login/SsoCallback, RequireAuth/Role | 🟡 **funcional pero parcial** | perfil ✅, Auth Hook ✅ **(estaba ROTO hasta `0017` — ver §3.1)**, `sso-consume` (122 líneas, real) ✅, `sso-users` ✅, LoginPage/SsoCallbackPage ✅, RequireAuth/RequireRole ✅. **Falta:** migrar los ~152 `jhi_user`→`perfil` (hoy solo existe el admin `leo.mora`). |
| **2. RLS base + Persona** | helpers RLS, policies multi-tenant, Persona **completa** (list/detail/docs/QR/bloqueo/servicios) + RPC + pgTAP + paridad | 🟡 **~40%** | Helpers (`auth_empresa`,`has_role`,`es_alta`,`es_gesta`,`persona_visible`) ✅. Policies multi-tenant ✅ y aislamiento verificado a mano. PersonaList ✅ (simple), **PersonaDetail = clon fiel** ✅. **Falta:** sub-páginas docs/QR/**bloqueo**/servicios (son placeholders), los **40+ RPC de persona** (solo `persona_es_nueva` y `notificaciones_documentos` portados), y **pgTAP (no existe)**. |
| **3. Dominios core** | Despacho(+trigger), Proyecto(asociar/oficializar), Cuadrilla, EntregaEPP, Mochila SPDC | 🟡 **~40%** | Listados clonados con datos reales: **Servicios/Proyecto** ✅ y **Despacho** ✅ — este último con su **motor de cumplimiento** portado verbatim (`despachos_listado`, RPC 0019: conteos por categoría + cumplimiento %, contra `accion_despacho`/`persona_proyecto`). Trigger auditoría despacho ✅. **Falta:** las **mutaciones** (asociar personal, oficializar, finalizar/activar, cambio de estado en UI) y **Cuadrilla**. |
| **4. Dominios restantes** | ~30 entidades CRUD | 🟡 **~35%** | Hechos (list/detail, lectura): config (faena, cargo, documento, empresa, empresa-cliente, artículo, tipo-equipo, aviso), evaluación, logística (pasaje/citación/hospedaje), reporte-flash. **Falta:** herramienta/equipo, tarea/actividad, notificación/alerta, incidentes/investigación (RiesgosFatalidad, AnalisisCausa, PlanAccion…), y los **formularios de alta/edición** de casi todo. |
| **5. Features pesadas** | PDF, Excel im/export, Email(Resend), ZIP, pg_cron | 🔴 **0%** | `0005_cron.sql` existe pero **la lógica de los 2 jobs reales no se identificó ni portó**. PDF/Excel/Email/ZIP no iniciados. Botones "Descargar" son stubs. |
| **6. BI** | p1–p6 (ALTA) + epp1–3 (GESTA), vistas materializadas, cross-filtering | 🔴 **0%** | Sólo placeholders de ruta (`/dashboard*`). 2238 líneas de `BiResource` sin portar. |
| **7. Integración Gesta OS** | `integracion-*` por RUT, contrato preservado | 🟡 **~25%** | `sso-consume`/`sso-users` ✅. **Falta:** `integracion-*` (servicio/ficha/historial/evaluaciones por RUT) y fijar secrets prod (`SSO_GESTA_OS_HUB_URL`, `DOCNOMINA_INTERNAL_API_KEY` ya en dev). |
| **8. Hardening + cutover** | pgTAP completo, datos en frío, binarios→Storage, paridad, rollback, DNS | 🔴 **0%** | Sin tests, sin binarios en Storage (los 48.288 documentos son **solo registros**, sin archivo), sin runbook ejecutado. |

**Lectura honesta:** lo avanzado es sobre todo **scaffolding de listas/detalles + RLS + diseño**. El **núcleo de esfuerzo del plan** (40+ RPC de negocio, mutaciones/máquinas de estado, BI, features pesadas, testing) sigue mayormente **pendiente**. El % de "vistas" no refleja el % de "lógica".

---

## 2. Inventario actual medido

- **Features (13):** auth, persona, proyecto, despacho, entrega-epp, mochila, epp, evaluacion, logistica, reporte-flash, config (12 archivos = catálogos), notificaciones, NotFoundPage.
- **Migraciones (17):** `0001_schema` … `0017_perfil_auth_admin_read`.
- **Funciones DB:** helpers (`auth_empresa`, `has_role`, `es_alta`, `es_gesta`), visibilidad (`persona_visible`, `proyecto_visible`, `tiene_rol_despacho`), negocio (`persona_es_nueva`, `notificaciones_documentos`), trigger (`fn_audita_estado_despacho`, `tg_set_updated_at`), `custom_access_token_hook`.
- **Edge Functions:** `sso-consume`, `sso-users` (+ `_shared`). **No** `integracion-*`, **no** `pdf-*`/`email-*`.
- **UI:** design system `.app-*` portado **verbatim** del `global.scss`/`navbar.component.scss` real + iconos PNG reales. shadcn generado mínimo (button, card, input, sonner).
- **Tests:** **0** (sin Vitest, sin pgTAP, sin Playwright).

---

## 3. Hallazgos que AJUSTAN el plan

### 3.1 El Auth Hook estaba roto (claims vacíos) → gate de verificación por fase
`custom_access_token_hook` corre como `supabase_auth_admin` (sin BYPASSRLS) y el RLS de `perfil` le ocultaba la fila → **todos los logins salían sin `app_empresa`/`app_roles`** → 0 datos y casi ningún menú. Fase 1 se daba por "hecha" pero era no-funcional. Fix: policy `perfil_select_auth_admin` (`0017`).
**Ajuste:** cada fase cierra con un **gate de verificación objetivo** (decodificar JWT y confirmar claims; contar filas por rol/empresa con RLS; screenshot de paridad). Sin gate, "hecho" no cuenta.

### 3.2 El diseño debe ser un CLON EXACTO — workstream propio, subestimado en el plan
El plan trata la UI como mapeo mecánico (`<DataTable>` genérico + shadcn). La realidad exigida: **clon visual 1:1** del docnomina real (navbar, distribución, listas, fichas, colores, iconos PNG). Ya se montó el método: **levantar docnomina local + Playwright/Edge** para capturar la verdad y comparar (ver memoria `design-clone-capture-harness`).
**Ajuste:** añadir **Fase 2.5 — Paridad visual (Design System)** como workstream transversal. El `<DataTable>` genérico del plan se **reemplaza** por el design system `.app-*` real (ya portado). Cada vista nueva se valida con captura lado-a-lado.

### 3.3 Testing inexistente — riesgo crítico abierto
El plan marca **pgTAP bloqueante para cutover (§9.5/§14)** y no existe ninguna prueba. El aislamiento RLS hoy se verifica "a mano".
**Ajuste:** introducir pgTAP **ya**, por dominio, a medida que se tocan policies (no al final). Es deuda que crece con cada tabla.

### 3.4 La mayoría de vistas son de SOLO LECTURA
Listas/detalles existen, pero las **mutaciones con reglas** (asociar/oficializar/bloquear/cambiar estado) — el corazón de docnomina — casi no están. El primer port real de negocio con lógica backend-exacta es `notificaciones_documentos` (regla 45 días / estados En Revisión-Activo-Reclutamiento).
**Ajuste:** priorizar el **inventario y port de los 40+ RPC** (plan §10) por dominio, cada uno con test de equivalencia. Es la columna vertebral y va con retraso relativo a las vistas.

### 3.5 Decisiones abiertas (§18) ya resueltas
| §18 | Decisión tomada |
|---|---|
| Hosting | **Supabase Cloud** (proyecto `sfuwzgcvmczsoydueeog`). |
| Proyecto Supabase | **Propio** para docnomina (no compartir con Gesta OS). |
| PKs | **Conservar secuencias** — `sequence_generator` compartido como default (`0007`,`0013`); no IDENTITY. |
| i18n | **Solo español** (no se instaló i18next). |
| Repo/CI | **Rama única `main`** en `AndresL4354/D.R` (el plan asumía `develop`). CI aún pendiente → apuntar a `main`. |
| PDF / Email / freeze / contrato API | **Siguen abiertas.** |

---

## 4. Roadmap ajustado (orden recomendado desde hoy)

Prioriza: (a) cerrar lo "funcionalmente roto/falso-hecho", (b) consolidar el método (diseño + tests), (c) atacar el núcleo de negocio.

1. **Estabilizar Fase 1/2 (corto):** migrar `jhi_user`→`perfil` (152 usuarios) para login real del equipo; introducir **pgTAP** mínimo de `persona` y `perfil`; añadir **CI** en `main` (lint→typecheck→build→pgTAP).
2. **Fase 2.5 — Paridad visual (transversal):** ✅ PersonaList, Servicios y Despacho clonados (patrón de listado establecido: page-header → card Filtros → `.app-table` + kebab → paginación, con RPC `*_listado` para columnas derivadas). Pendiente replicar a EntregaEPP, Evaluación, Reportes Flash, Logística, catálogos. Captura lado-a-lado como gate.
3. **Núcleo de negocio Persona/Proyecto/Despacho (Fase 2/3 real):** portar RPC con paridad — `asignarPersonaProyecto`, `oficializar`, `guardarBloqueo`, estados de despacho con confirmación/permiso (la UI sobre el trigger ya existente), `personasFiltro`. Construir sub-páginas reales (Documentos — `documentos_persona` ya legible — Servicios, Evaluaciones).
4. **Completar Fase 4:** formularios alta/edición + entidades faltantes (herramienta/equipo, tarea, incidentes/investigación, notificación).
5. **Fase 5 features pesadas:** identificar los 2 jobs `@Scheduled` reales y portarlos (`pg_cron`); Excel im/export (`exceljs`); PDF (decidir §18.3); Email (Resend, requiere `RESEND_API_KEY`); ZIP.
6. **Fase 6 BI** y **Fase 7 integración** (`integracion-*` por RUT).
7. **Fase 8 hardening + cutover:** pgTAP completo, binarios→Storage, paridad total, runbook.

---

## 5. Riesgos actualizados (delta sobre §17)

- 🔴 **"Falso-hecho" sin gate de verificación** (caso Auth Hook) — mitigado con gates objetivos por fase.
- 🔴 **Testing en cero** mientras se acumulan policies/RPC — empezar pgTAP ya, no al final.
- 🟠 **Brecha vistas-vs-lógica:** el avance visible (listas) puede dar falsa sensación de progreso; el negocio (RPC/BI/features) es el grueso restante.
- 🟠 **Paridad visual** ahora es requisito duro → costo de UI mayor al presupuestado en el plan (mitigado con harness de captura).
- 🟡 **Datos:** 48.288 documentos son solo registros (sin binarios) → Storage + recarga de archivos es trabajo real de Fase 8.
