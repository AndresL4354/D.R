# docnomina-web — Estado real vs. plan, y ajustes

> **Fecha:** 2026-06-30 · **Última actualización: 2026-07-02** · Documento vivo. Acompaña a `plan_refactor_react_supabase_20260630.md` (el plan original NO se reescribe; aquí se registra el estado medido y los ajustes derivados de lo construido/encontrado).
> **Repo:** `AndresL4354/D.R` (rama única `main`). **Supabase:** proyecto `sfuwzgcvmczsoydueeog` ("D.R Demo").

> **Hito 2026-07-02 — Mutaciones de negocio (Fase 3) COMPLETAS:** portadas con paridad y verificadas con pgTAP contra la BD (52 aserciones, 4 suites) las mutaciones de **Proyecto** (crear/editar/finalizar/activar/eliminar + cargos, `0024`), **Persona** (estado/bloqueo/verificar-docs/eliminar + QR client-side, `0025`), **Asociación Persona↔Proyecto** (asignar/oficializar/backup/eliminar/reasociar/cambiar-cargo/acreditar/gestión-temprana, `0026` + pantalla `AsociarPersonas`) y **Despacho** (acciones por trabajador con gating `DESPACHO_*`, toggle in-line por email, cascada 'En Faena', finalizar/eliminar/CRUD, `0027` + grilla en `DespachoDetail`). CI (lint→typecheck→build) verde en `main`; 152 `jhi_user`→`perfil` migrados. Método: workflows multi-agente sobre el Angular/Java real + verificación adversarial del diff.

---

## 1. Estado real por fase (vs. roadmap §15 del plan)

| Fase | Plan | Estado real | Detalle |
|---|---|---|---|
| **0. Fundaciones** | scaffold, proyecto Supabase, esquema, gen types, CI, índices BI | 🟢 **~90%** | Scaffold Vite/TS/Tailwind/shadcn/Query/Router ✅. Esquema (85 tablas) migrado vía pg_restore + 27 migraciones ✅. `gen types` ✅. **CI** (lint→typecheck→build en `main`) ✅. **Falta:** índices BI (`optimizacion_bi_indices.sql` no cargado). |
| **1. Auth + SSO** | perfil, Auth Hook, sso-consume/users, Login/SsoCallback, RequireAuth/Role | 🟡 **funcional pero parcial** | perfil ✅, Auth Hook ✅ **(estaba ROTO hasta `0017` — ver §3.1)**, `sso-consume` (122 líneas, real) ✅, `sso-users` ✅, LoginPage/SsoCallbackPage ✅, RequireAuth/RequireRole ✅. **Falta:** migrar los ~152 `jhi_user`→`perfil` (hoy solo existe el admin `leo.mora`). |
| **2. RLS base + Persona** | helpers RLS, policies multi-tenant, Persona **completa** (list/detail/docs/QR/bloqueo/servicios) + RPC + pgTAP + paridad | 🟢 **~70%** | Helpers + policies multi-tenant ✅, **pgTAP** de aislamiento RLS ✅ (`rls_smoke`, 12 aserciones). PersonaList/Detail clon fiel ✅. **Mutaciones de Persona ✅** (cambiar estado con cascada, bloqueo/desbloqueo, verificar-documentos, eliminar — `0025`; QR client-side ✅; flujo `CambiarEstadoPersona`). **Falta:** sub-páginas docs/servicios (placeholders) y varios RPC de reportes/descargas (Fase 5). |
| **3. Dominios core** | Despacho(+trigger), Proyecto(asociar/oficializar), Cuadrilla, EntregaEPP, Mochila SPDC | 🟢 **~75%** | Listados con datos reales + **motor de cumplimiento** (`despachos_listado`, 0019) ✅. **Mutaciones COMPLETAS y verificadas (pgTAP):** Proyecto (0024), Persona (0025), Asociación Persona↔Proyecto — asignar/oficializar/backup/eliminar/reasociar/cambiar-cargo/acreditar/gestión-temprana (0026, pantalla `AsociarPersonas`), Despacho — acciones por trabajador con gating `DESPACHO_*`, toggle in-line por email, cascada 'En Faena', finalizar/eliminar/CRUD (0027, grilla en `DespachoDetail`). **Falta:** **Cuadrilla**, y las mutaciones de EntregaEPP/Mochila (listados ya clonados). |
| **4. Dominios restantes** | ~30 entidades CRUD | 🟡 **~40%** | Hechos (list/detail, lectura): config (faena, cargo, documento, empresa, empresa-cliente, artículo, tipo-equipo, aviso), evaluación, logística (pasaje/citación/hospedaje), reporte-flash. **CRUD de catálogos (lote 1) ✅:** crear/editar/eliminar de **faena, cargo, artículo, tipo_equipo** con policies de escritura (`0028`, artículo con gating por fila SPDC→ADMIN_VERTICAL) + `CatalogoForm` genérico + pgTAP (`catalogos_crud`, 8 aserciones). **Falta:** CRUD de documento/empresa/empresa-cliente/aviso; herramienta/equipo, tarea/actividad, notificación/alerta, incidentes/investigación. |
| **5. Features pesadas** | PDF, Excel im/export, Email(Resend), ZIP, pg_cron | 🔴 **0%** | `0005_cron.sql` existe pero **la lógica de los 2 jobs reales no se identificó ni portó**. PDF/Excel/Email/ZIP no iniciados. Botones "Descargar" son stubs. |
| **6. BI** | p1–p6 (ALTA) + epp1–3 (GESTA), vistas materializadas, cross-filtering | 🔴 **0%** | Sólo placeholders de ruta (`/dashboard*`). 2238 líneas de `BiResource` sin portar. |
| **7. Integración Gesta OS** | `integracion-*` por RUT, contrato preservado | 🟡 **~25%** | `sso-consume`/`sso-users` ✅. **Falta:** `integracion-*` (servicio/ficha/historial/evaluaciones por RUT) y fijar secrets prod (`SSO_GESTA_OS_HUB_URL`, `DOCNOMINA_INTERNAL_API_KEY` ya en dev). |
| **8. Hardening + cutover** | pgTAP completo, datos en frío, binarios→Storage, paridad, rollback, DNS | 🔴 **0%** | Sin tests, sin binarios en Storage (los 48.288 documentos son **solo registros**, sin archivo), sin runbook ejecutado. |

**Lectura honesta:** lo avanzado es sobre todo **scaffolding de listas/detalles + RLS + diseño**. El **núcleo de esfuerzo del plan** (40+ RPC de negocio, mutaciones/máquinas de estado, BI, features pesadas, testing) sigue mayormente **pendiente**. El % de "vistas" no refleja el % de "lógica".

---

## 2. Inventario actual medido

- **Features (13):** auth, persona, proyecto, despacho, entrega-epp, mochila, epp, evaluacion, logistica, reporte-flash, config (12 archivos = catálogos), notificaciones, NotFoundPage.
- **Migraciones (27):** `0001_schema` … `0027_despacho_mutaciones` (incl. listados con motor de cumplimiento 0018-0023 y mutaciones de negocio 0024-0027).
- **Funciones DB:** helpers/visibilidad (`auth_empresa`, `has_role`, `es_alta`, `es_gesta`, `persona_visible`, `proyecto_visible`, `tiene_rol_despacho`, `puede_gestionar_accion`, `puede_editar_estados_personal`, `persona_en_despacho`), **mutaciones** de proyecto/persona/asociación/despacho (RPCs SECURITY DEFINER 0024-0027), listados (RPCs 0018-0023), trigger (`fn_audita_estado_despacho`, `tg_set_updated_at`), `custom_access_token_hook`.
- **Edge Functions:** `sso-consume`, `sso-users` (+ `_shared`). **No** `integracion-*`, **no** `pdf-*`/`email-*`.
- **UI:** design system `.app-*` portado **verbatim** + iconos PNG reales. Componentes compartidos: `ConfirmDialog` (clon NgbModal), `RowActionsMenu`. shadcn mínimo.
- **Tests:** **4 suites pgTAP** (52 aserciones) contra la BD vía Management API (`scripts/run-pgtap.mjs`): `rls_smoke`, `proyecto_mutaciones`, `asociacion_mutaciones`, `despacho_mutaciones`. **Falta:** Vitest (unit) y Playwright (e2e).

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

1. **Estabilizar Fase 1/2:** ✅ **COMPLETA** — 152 `jhi_user`→`perfil` migrados (auth users SIN contraseña: el equipo entra por SSO; roles/empresa/id_gesta_os desde jhi_user_authority; hook verificado). pgTAP instalado + suite `supabase/tests/rls_smoke.sql` (12 aserciones: aislamiento por empresa, guards de RPCs, hook, policies clave) **12/12 en verde** vía `node scripts/run-pgtap.mjs`. CI en `main` (`.github/workflows/ci.yml`: lint→typecheck→build).
2. **Fase 2.5 — Paridad visual (transversal):** ✅ **COMPLETA en listados** — clonados con specs extraídas del Angular real (workflow multi-agente): Persona, Servicios, Despacho (+motor), Entregas (RPC `entregas_listado`), Equipos (/equipo — el item navbar "Evaluaciones" REP_PERSONAS), Logística por proyecto (Pasajes/Citaciones/Hospedajes con sus quirks), Mochilas SPDC + Inspecciones (RPCs con guard ALTA), Investigaciones (/investigacion; tabla `reporte_investigacion` creada, dominio dormido en el real) y los 8 catálogos (Faenas con usuarios de jhi_user, Cargos con documentos/faenas agregados y quirks de filtro, Documentos con gating DOC_PRIVADO, Empresas, Empresas cliente, Artículos con permiso por clasificación, Tipos de equipo, Avisos). Pendiente de paridad visual: dashboards (Fase 6) y formularios/detalles restantes.
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
