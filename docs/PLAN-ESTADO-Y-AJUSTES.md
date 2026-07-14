# docnomina-web — Estado real vs. plan, y ajustes

> **Fecha:** 2026-06-30 · **Última actualización: 2026-07-02** · Documento vivo. Acompaña a `plan_refactor_react_supabase_20260630.md` (el plan original NO se reescribe; aquí se registra el estado medido y los ajustes derivados de lo construido/encontrado).
> **Repo:** `AndresL4354/D.R` (rama única `main`). **Supabase:** proyecto `sfuwzgcvmczsoydueeog` ("D.R Demo").

> **Hito 2026-07-11 — Sub-páginas de la ficha de Persona (Documentos + Servicios):** clonadas con specs extraídas del Angular/Java real (workflow multi-agente + crítico de completitud): `/persona/:id/servicios` (historial persona_proyecto: excluye ELIMINADO, incluye BACKUP, `actual` = última asociación, KPIs + filtros/orden client-side con quirks) y `/persona/:id/documentos` (4 cards por categoría, merge docs+placeholders de requeridos por cargo, semáforo PNG 23×25 `position:absolute` con umbral 45 días y hueco en 45 exacto, date-input compartido, gating asimétrico del menú, diálogos editar-fecha/resultado, eliminar sin confirmación). Migración `0031` (7 RPCs con alcance multi-tenant endurecido + revoke anon) **aplicada** + suite pgTAP `persona_docs_servicios` (18 aserciones) **verde**. Review adversarial aplicado (referencia obsoleta en diálogos, EXECUTE a PUBLIC, error-de-docs→placeholders, cache-resucita, doble toast). **Verificado en navegador con datos reales**: Documentos (persona 62015 — 13 generales/59 cursos/2 acred/3 legales, semáforos PNG cargando) y Servicios (persona 22185 — 93 registros, KPIs, badge Actual, filtro Acreditado 93→38). Total suites pgTAP: **7 (90 aserciones), verdes**. Subir/ver PDF y ZIP siguen stub (Storage, Fase 5/8).
>
> **Hito 2026-07-03 — Evaluación (encuesta) + CRUD de catálogos:** portada la mutación de **Evaluación/encuesta** (crear/editar/eliminar por tipo NORMAL/TECNICO_VERTICAL/SUPERVISOR_VERTICAL: responder preguntas con su escala + motivo bajo umbral, promedio = media simple, upsert de respuestas por `id_pregunta`) vía RPCs SECURITY DEFINER (`0030`; preguntas/respuestas son deny-all bajo RLS) + diálogo de encuesta, vistas persona/proyecto y lanzamiento desde Asociar; verificada con pgTAP (`evaluacion_encuesta`, 10 aserciones). Antes: **CRUD de los 8 catálogos** de Configuración (`0028`/`0029`). Total suites pgTAP: 6 (72 aserciones), verdes.

> **Hito 2026-07-02 — Mutaciones de negocio (Fase 3) COMPLETAS:** portadas con paridad y verificadas con pgTAP contra la BD (52 aserciones, 4 suites) las mutaciones de **Proyecto** (crear/editar/finalizar/activar/eliminar + cargos, `0024`), **Persona** (estado/bloqueo/verificar-docs/eliminar + QR client-side, `0025`), **Asociación Persona↔Proyecto** (asignar/oficializar/backup/eliminar/reasociar/cambiar-cargo/acreditar/gestión-temprana, `0026` + pantalla `AsociarPersonas`) y **Despacho** (acciones por trabajador con gating `DESPACHO_*`, toggle in-line por email, cascada 'En Faena', finalizar/eliminar/CRUD, `0027` + grilla en `DespachoDetail`). CI (lint→typecheck→build) verde en `main`; 152 `jhi_user`→`perfil` migrados. Método: workflows multi-agente sobre el Angular/Java real + verificación adversarial del diff.

---

## 1. Estado real por fase (vs. roadmap §15 del plan)

| Fase | Plan | Estado real | Detalle |
|---|---|---|---|
| **0. Fundaciones** | scaffold, proyecto Supabase, esquema, gen types, CI, índices BI | 🟢 **~90%** | Scaffold Vite/TS/Tailwind/shadcn/Query/Router ✅. Esquema (85 tablas) migrado vía pg_restore + 27 migraciones ✅. `gen types` ✅. **CI** (lint→typecheck→build en `main`) ✅. **Falta:** índices BI (`optimizacion_bi_indices.sql` no cargado). |
| **1. Auth + SSO** | perfil, Auth Hook, sso-consume/users, Login/SsoCallback, RequireAuth/Role | 🟢 **~95%** | perfil ✅, Auth Hook ✅ **(estaba ROTO hasta `0017` — ver §3.1)**, `sso-consume` ✅, `sso-users` ✅, LoginPage/SsoCallbackPage ✅, RequireAuth/RequireRole ✅. **152 `jhi_user`→`perfil` migrados** (SSO sin contraseña) ✅. **Falta:** solo endurecimiento prod (rotación de secrets/contraseña admin temporal). |
| **2. RLS base + Persona** | helpers RLS, policies multi-tenant, Persona **completa** (list/detail/docs/QR/bloqueo/servicios) + RPC + pgTAP + paridad | 🟢 **~85%** | Helpers + policies multi-tenant ✅, **pgTAP** de aislamiento RLS ✅ (`rls_smoke`, 12 aserciones). PersonaList/Detail clon fiel ✅. **Mutaciones de Persona ✅** (`0025`, QR client-side, `CambiarEstadoPersona`). **Sub-páginas Documentos y Servicios ✅** (`0031` aplicada + `PersonaDocumentos`/`PersonaServicios`, clones con quirks, pgTAP verde, verificadas en navegador). **Falta:** subir/ver PDF y ZIP (Storage, Fase 5/8) y RPC de reportes/descargas (Fase 5). |
| **3. Dominios core** | Despacho(+trigger), Proyecto(asociar/oficializar), Cuadrilla, EntregaEPP, Mochila SPDC | 🟢 **~80%** | Listados con datos reales + **motor de cumplimiento** (`despachos_listado`, 0019) ✅. **Mutaciones COMPLETAS y verificadas (pgTAP):** Proyecto (0024), Persona (0025), Asociación Persona↔Proyecto (0026, `AsociarPersonas`), Despacho — acciones por trabajador con gating `DESPACHO_*` + toggle in-line por email + cascada 'En Faena' + finalizar/eliminar/CRUD (0027, `DespachoDetail`), y **Evaluación/encuesta** crear/editar/eliminar (0030). **Falta:** **Cuadrilla** (tablas vacías, dominio en desuso), y las mutaciones de EntregaEPP (crear = firma/PDF, Fase 5) / Mochila (listados ya clonados). |
| **4. Dominios restantes** | ~30 entidades CRUD | 🟡 **~50%** | Listados (lectura) de config/evaluación/logística/reporte-flash ✅. **CRUD de los 8 catálogos de Configuración ✅:** crear/editar/eliminar de faena, cargo, artículo, tipo_equipo (`0028`) y documento, empresa, empresa-cliente, aviso (`0029`), con policies de escritura (artículo con gating por fila SPDC→ADMIN_VERTICAL), `CatalogoForm` genérico (spec de campos, incl. datetime) + pgTAP (`catalogos_crud`, 10 aserciones). **Falta:** herramienta/equipo, tarea/actividad, notificación/alerta, incidentes/investigación (RiesgosFatalidad, AnalisisCausa, PlanAccion…) y sus formularios. |
| **5. Features pesadas** | PDF, Excel im/export, Email(Resend), ZIP, pg_cron | 🟡 **~10%** | **Export a Excel/CSV client-side ✅** (`lib/export.ts` sin dependencias, BOM UTF-8 + `;`) en los listados grandes: Personas, Despachos (con cumplimiento) y Entregas EPP — exporta TODO el filtro (no solo la página). **Falta:** PDF, import Excel, Email(Resend), ZIP de documentos (Storage), y `0005_cron` (2 jobs reales sin portar). Los "Descargar documentos"/firma/QR-masivo siguen siendo stubs (requieren Storage/SMTP). |
| **6. BI** | p1–p6 (ALTA) + epp1–3 (GESTA), vistas materializadas, cross-filtering | 🔴 **0%** | Sólo placeholders de ruta (`/dashboard*`). 2238 líneas de `BiResource` sin portar. |
| **7. Integración Gesta OS** | `integracion-*` por RUT, contrato preservado | 🟡 **~25%** | `sso-consume`/`sso-users` ✅. **Falta:** `integracion-*` (servicio/ficha/historial/evaluaciones por RUT) y fijar secrets prod (`SSO_GESTA_OS_HUB_URL`, `DOCNOMINA_INTERNAL_API_KEY` ya en dev). |
| **8. Hardening + cutover** | pgTAP completo, datos en frío, binarios→Storage, paridad, rollback, DNS | 🟡 **~10%** | **pgTAP arrancado:** 6 suites / 72 aserciones (`rls_smoke`, `proyecto`/`persona`/`asociacion`/`despacho`_mutaciones, `catalogos_crud`, `evaluacion_encuesta`) vía `scripts/run-pgtap.mjs` + CI. **Falta:** cobertura pgTAP completa, binarios→Storage (48.288 documentos son solo registros), paridad final, runbook de cutover, DNS. |

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

### 3.5b El original siguió evolucionando — drift del oráculo (2026-07-14)

`git fetch` sobre `ormorenoo/docnomina` (2026-07-14): la producción recibió **~40 commits** (2026-06-05 → 2026-07-14, autor Leogg1) posteriores al snapshot del plan. El clon local (`RepoDocnomina/docnomina`, rama `develop`) quedó **al día** (HEAD `887e4b2`, 2026-07-14) — las specs de las sub-páginas Documentos/Servicios (hito 2026-07-11) ya se extrajeron del fuente actualizado.

**Impacto en lo ya portado:**
- `d4d5ff5` (2026-07-14) — *"no desasociar de servicios/despachos al guardar ficha o cargar documentos"*: la cascada de desvinculación ahora corre SOLO en el cambio explícito de estado (`actualizarEstadoPersona`, param `eliminarAsociaciones=true`), nunca en el guardado general de ficha. **El port ya cumple esta semántica** (verificado 2026-07-14): `updatePersona` no toca `estado_persona` y la cascada vive solo en `persona_cambiar_estado` (0025). Divergencia menor aceptada: el original registra `persona_historico` si el estado del form difiere al guardar ficha; en el port el estado no es editable desde la ficha.
- Los ports de Despacho (edición en línea `e6951eb`, columnas de acción `dec288a`) y Asociar (badge Nuevo `d6ad55e`) se extrajeron con esos commits ya presentes ✅. Conviene un **pase de re-verificación de paridad** de los listados clonados contra el oráculo actualizado (p.ej. `ed47c99` orden de Servicios por fecha inicio + sort por clic).

**Features NUEVAS del original que el plan no contemplaba (añadir al roadmap):**
1. **Licencias Spot** (`e46b3b5`,`983ccf3`,`6acb6c1`,`2e24bf8`) — dominio nuevo: gestor/visor de licencias MEL/Gesta del personal Spot, vista lista/tarjetas, menú Reportabilidad. → Fase 4.
2. **Carga masiva de personal desde Excel** en Asociar (`1ab1556`) + **export de no agregados** (`887e4b2`). → Fase 5 (import Excel).
3. **API integración Gesta OS** ya concreta (Fase 7): `GET /api/integracion/servicios` (activos), `/servicios/{id}/personal`, evaluaciones por RUT, turnos día/noche (`53bded7`), `stats/login` + total personas (`e0f833e`,`8d5762c`), estado en `TrabajadorIntegracionDTO` (`2f85b0c`).
4. **BI dashboards implementados en el original** (`b8936fe`,`ff77744`,`9a025ad`) — Fase 6 ahora tiene referencia visual/funcional concreta (visor ALTA operacional + GESTA EPP con filtros/export).
5. Menores: snapshot PNG del despacho (`4cb2bef`,`67be3ac`), descargar foto del trabajador (`3ea6da6`), descarga de informes/documentos en navegador (`bebcc1f`,`471bf78`,`b13a24f`), JWT en localStorage (`23c5077`), buscador de mochila en entrega (`c4b7069`), Excel detalle mochila (`39df488`).

**Regla operativa nueva:** antes de cada extracción de specs, `git pull` en `RepoDocnomina/docnomina` (develop) — el oráculo es un blanco móvil.

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
