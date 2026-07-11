import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/common/AppLayout';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { RequireRole } from '@/features/auth/RequireRole';
import { LoginPage } from '@/features/auth/LoginPage';
import { SsoCallbackPage } from '@/features/auth/SsoCallbackPage';
import { NotFoundPage } from '@/features/NotFoundPage';

// Preserva el base path actual del despliegue (Angular vive bajo /doc).
// En dev se puede dejar en "/" vía VITE_BASE_PATH para evitar la confusión
// de tener que navegar a /doc.
const basename = import.meta.env.VITE_BASE_PATH ?? '/';

export const router = createBrowserRouter(
  [
    { path: '/login', element: <LoginPage /> },
    { path: '/auth/sso', element: <SsoCallbackPage /> }, // canje del launch token SSO
    {
      element: (
        <RequireAuth>
          <AppLayout />
        </RequireAuth>
      ),
      children: [
        { index: true, element: <Navigate to="/persona" replace /> },

        // --- Persona (Fase 2) ---
        { path: 'persona', lazy: () => import('@/features/persona/PersonaList') },
        { path: 'persona/nueva', lazy: () => import('@/features/persona/PersonaForm') },
        { path: 'upload-personas', element: <div className="p-6">Carga masiva de personas (Fase 5)</div> },
        { path: 'persona/:id', lazy: () => import('@/features/persona/PersonaDetail') },
        { path: 'persona/:id/editar', lazy: () => import('@/features/persona/PersonaForm') },
        // Sub-páginas de la ficha
        { path: 'persona/:id/documentos', lazy: () => import('@/features/persona/PersonaDocumentos') },
        { path: 'persona/:id/evaluaciones', lazy: () => import('@/features/evaluacion/PersonaEvaluaciones') },
        { path: 'persona/:id/servicios', lazy: () => import('@/features/persona/PersonaServicios') },

        // --- Servicios / Proyecto (Fase 3) ---
        { path: 'proyecto', lazy: () => import('@/features/proyecto/ProyectoList') },
        { path: 'proyecto/nuevo', lazy: () => import('@/features/proyecto/ProyectoForm') },
        { path: 'proyecto/:id', lazy: () => import('@/features/proyecto/ProyectoDetail') },
        { path: 'proyecto/:id/editar', lazy: () => import('@/features/proyecto/ProyectoForm') },
        { path: 'proyecto/:id/cargos', lazy: () => import('@/features/proyecto/CargosProyecto') },
        { path: 'proyecto/:id/asociar', lazy: () => import('@/features/proyecto/AsociarPersonas') },
        { path: 'proyecto/:id/evaluaciones', lazy: () => import('@/features/evaluacion/ProyectoEvaluaciones') },

        // --- Despacho (Fase 3) ---
        { path: 'despacho', lazy: () => import('@/features/despacho/DespachoList') },
        { path: 'despacho/nuevo', lazy: () => import('@/features/despacho/DespachoForm') },
        { path: 'despacho/:id', lazy: () => import('@/features/despacho/DespachoDetail') },
        { path: 'despacho/:id/editar', lazy: () => import('@/features/despacho/DespachoForm') },

        // --- Entrega EPP (Fase 3) — vista gateada como en el real ---
        { path: 'entrega-epp', lazy: () => import('@/features/entrega-epp/EntregaEppList') },
        { path: 'entrega-epp/nueva', element: <div className="p-6">Nueva entrega (Fase 3)</div> },
        { path: 'entrega-epp/:id', lazy: () => import('@/features/entrega-epp/EntregaEppDetail') },
        { path: 'entrega-epp/:id/editar', element: <div className="p-6">Editar entrega (Fase 3)</div> },

        // --- Mochila SPDC (Fase 3, dominio ALTA) ---
        { path: 'mochila-spdc', lazy: () => import('@/features/mochila/MochilaList') },
        { path: 'mochila-spdc/nueva', element: <div className="p-6">Nueva mochila (Fase 3)</div> },
        { path: 'mochila-spdc/:id', lazy: () => import('@/features/mochila/MochilaDetail') },
        { path: 'mochila-spdc/:id/editar', element: <div className="p-6">Editar mochila (Fase 3)</div> },
        { path: 'mochila-spdc/:id/inspeccion', lazy: () => import('@/features/mochila/InspeccionMochilaList') },
        { path: 'mochila-spdc/:id/inspeccion/nueva', element: <div className="p-6">Nueva inspección (Fase 3)</div> },
        { path: 'mochila-spdc/:id/inspeccion/:idInspeccion/ver', element: <div className="p-6">Detalle de inspección (Fase 3)</div> },
        { path: 'mochila-spdc/:id/inspeccion/:idInspeccion/editar', element: <div className="p-6">Editar inspección (Fase 3)</div> },
        { path: 'epp', lazy: () => import('@/features/epp/EppIndex') },

        // --- Evaluaciones (Fase 4) ---
        { path: 'evaluacion', lazy: () => import('@/features/evaluacion/EvaluacionList') },
        { path: 'evaluacion/:id', lazy: () => import('@/features/evaluacion/EvaluacionDetail') },

        // --- Equipos (en el real: Reportabilidad → "Evaluaciones" REP_PERSONAS) ---
        { path: 'equipo', lazy: () => import('@/features/equipo/EquipoList') },
        { path: 'equipo/nuevo', element: <div className="p-6">Nuevo equipo (Fase 4)</div> },
        { path: 'equipo/:id', element: <div className="p-6">Detalle de equipo (Fase 4)</div> },
        { path: 'equipo/:id/editar', element: <div className="p-6">Editar equipo (Fase 4)</div> },

        // --- Seguridad / Reportes Flash (Fase 4) ---
        { path: 'reporte-flash', lazy: () => import('@/features/reporte-flash/ReporteFlashList') },
        { path: 'reporte-flash/:id', lazy: () => import('@/features/reporte-flash/ReporteFlashDetail') },
        // Investigaciones (/investigacion — único listado vivo del dominio en el real)
        { path: 'investigacion', lazy: () => import('@/features/reporte-flash/InvestigacionList') },
        { path: 'investigacion/nueva', element: <div className="p-6">Nueva investigación (Fase 4)</div> },
        { path: 'investigacion/:id/ver', element: <div className="p-6">Detalle de investigación (Fase 4)</div> },

        // --- Logística (Fase 4) — en el real son vistas POR PROYECTO (desde Asociar) ---
        { path: 'logistica', lazy: () => import('@/features/logistica/LogisticaIndex') },
        { path: 'pasaje', lazy: () => import('@/features/logistica/PasajeList') },
        { path: 'pasaje/:idProyecto', lazy: () => import('@/features/logistica/PasajeList') },
        { path: 'pasaje/:idProyecto/nuevo', element: <div className="p-6">Nuevo pasaje (Fase 4)</div> },
        { path: 'pasaje/:id/ver', element: <div className="p-6">Detalle de pasaje (Fase 4)</div> },
        { path: 'citacion', lazy: () => import('@/features/logistica/CitacionList') },
        { path: 'citacion/:idProyecto', lazy: () => import('@/features/logistica/CitacionList') },
        { path: 'citacion/:idProyecto/nueva', element: <div className="p-6">Nueva citación (Fase 4)</div> },
        { path: 'citacion/:id/ver', element: <div className="p-6">Detalle de citación (Fase 4)</div> },
        { path: 'citacion/:id/editar', element: <div className="p-6">Editar citación (Fase 4)</div> },
        { path: 'hospedaje', lazy: () => import('@/features/logistica/HospedajeList') },
        { path: 'hospedaje/:idProyecto', lazy: () => import('@/features/logistica/HospedajeList') },
        { path: 'hospedaje/:idProyecto/nuevo', element: <div className="p-6">Nuevo hospedaje (Fase 4)</div> },
        { path: 'hospedaje/:id/ver', element: <div className="p-6">Detalle de hospedaje (Fase 4)</div> },
        { path: 'hospedaje/:id/editar', element: <div className="p-6">Editar hospedaje (Fase 4)</div> },
        // --- Configuración (Fase 4: catálogos) ---
        { path: 'config', lazy: () => import('@/features/config/ConfigIndex') },
        { path: 'faena', lazy: () => import('@/features/config/FaenaList') },
        { path: 'faena/nueva', lazy: () => import('@/features/config/FaenaForm') },
        { path: 'faena/:id/editar', lazy: () => import('@/features/config/FaenaForm') },
        { path: 'cargo', lazy: () => import('@/features/config/CargoList') },
        { path: 'cargo/nuevo', lazy: () => import('@/features/config/CargoForm') },
        { path: 'cargo/:id/editar', lazy: () => import('@/features/config/CargoForm') },
        { path: 'documento', lazy: () => import('@/features/config/DocumentoList') },
        { path: 'documento/nuevo', lazy: () => import('@/features/config/DocumentoForm') },
        { path: 'documento/:id/editar', lazy: () => import('@/features/config/DocumentoForm') },
        { path: 'empresa', lazy: () => import('@/features/config/EmpresaList') },
        { path: 'empresa/nueva', lazy: () => import('@/features/config/EmpresaForm') },
        { path: 'empresa/:id/editar', lazy: () => import('@/features/config/EmpresaForm') },
        { path: 'empresa-cliente', lazy: () => import('@/features/config/EmpresaClienteList') },
        { path: 'empresa-cliente/nueva', lazy: () => import('@/features/config/EmpresaClienteForm') },
        { path: 'empresa-cliente/:id/editar', lazy: () => import('@/features/config/EmpresaClienteForm') },
        { path: 'articulo', lazy: () => import('@/features/config/ArticuloList') },
        { path: 'articulo/nuevo', lazy: () => import('@/features/config/ArticuloForm') },
        { path: 'articulo/:id/editar', lazy: () => import('@/features/config/ArticuloForm') },
        { path: 'tipo-equipo', lazy: () => import('@/features/config/TipoEquipoList') },
        { path: 'tipoEquipo', lazy: () => import('@/features/config/TipoEquipoList') }, // alias ruta real (camelCase)
        { path: 'tipo-equipo/nuevo', lazy: () => import('@/features/config/TipoEquipoForm') },
        { path: 'tipo-equipo/:id/editar', lazy: () => import('@/features/config/TipoEquipoForm') },
        // Avisos: en el real toda la ruta está gateada por ROLE_ADMIN/SUPERADMINISTRADOR
        { path: 'aviso-mantenimiento', lazy: () => import('@/features/config/AvisoMantenimientoList') },
        { path: 'aviso-mantenimiento/nuevo', lazy: () => import('@/features/config/AvisoForm') },
        { path: 'aviso-mantenimiento/:id/editar', lazy: () => import('@/features/config/AvisoForm') },
        // --- Resto de dominios (se irán poblando): cuadrilla, evaluacion, herramienta... ---

        // --- BI (Fase 6) ---
        {
          path: 'dashboard',
          element: (
            <RequireRole empresa="ALTA" roles={['ROLE_ADMIN', 'ADMIN_VERTICAL', 'OPERACIONES']}>
              <div className="p-6">Dashboard BI ALTA (Fase 6)</div>
            </RequireRole>
          ),
        },
        {
          path: 'dashboard/epp',
          element: (
            <RequireRole
              empresa="GESTA"
              roles={['ROLE_ADMIN', 'DESPACHO_ADMINISTRADOR', 'DESPACHO_BODEGA', 'REPORTABILIDAD']}
            >
              <div className="p-6">Dashboard EPP GESTA (Fase 6)</div>
            </RequireRole>
          ),
        },
        // Dashboards de Reportabilidad (Fase 6 — placeholders por ahora)
        { path: 'dashboard/evaluaciones', element: <div className="p-6">Dashboard Evaluaciones (Fase 6)</div> },
        { path: 'dashboard/personas', element: <div className="p-6">Dashboard Personas (Fase 6)</div> },
        { path: 'dashboard/vencimientos', element: <div className="p-6">Dashboard Vencimientos (Fase 6)</div> },

        // Mi perfil / administración de usuarios (Fase 1 — placeholders)
        {
          path: 'user-management',
          element: (
            <RequireRole roles={['ROLE_ADMIN', 'SUPERADMINISTRADOR', 'SUPERADMINISTRADOR BP']}>
              <div className="p-6">Gestión de usuarios (Fase 1)</div>
            </RequireRole>
          ),
        },
        { path: 'account/settings', element: <div className="p-6">Ajustes de cuenta (Fase 1)</div> },
        { path: 'account/password', element: <div className="p-6">Cambiar contraseña (Fase 1)</div> },

        // --- Admin (Fase 1+) ---
        {
          path: 'admin/*',
          element: (
            <RequireRole roles={['ROLE_ADMIN']}>
              <div className="p-6">Administración (Fase 1)</div>
            </RequireRole>
          ),
        },
      ],
    },
    { path: '*', element: <NotFoundPage /> },
  ],
  { basename },
);
