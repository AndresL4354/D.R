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
        { path: 'persona/:id', lazy: () => import('@/features/persona/PersonaDetail') },
        { path: 'persona/:id/editar', lazy: () => import('@/features/persona/PersonaForm') },

        // --- Servicios / Proyecto (Fase 3) ---
        { path: 'proyecto', lazy: () => import('@/features/proyecto/ProyectoList') },
        { path: 'proyecto/:id', lazy: () => import('@/features/proyecto/ProyectoDetail') },

        // --- Despacho (Fase 3) ---
        { path: 'despacho', lazy: () => import('@/features/despacho/DespachoList') },
        { path: 'despacho/:id', lazy: () => import('@/features/despacho/DespachoDetail') },

        // --- Entrega EPP (Fase 3) ---
        { path: 'entrega-epp', lazy: () => import('@/features/entrega-epp/EntregaEppList') },
        { path: 'entrega-epp/:id', lazy: () => import('@/features/entrega-epp/EntregaEppDetail') },

        // --- Mochila SPDC (Fase 3, dominio ALTA) ---
        { path: 'mochila-spdc', lazy: () => import('@/features/mochila/MochilaList') },
        { path: 'mochila-spdc/:id', lazy: () => import('@/features/mochila/MochilaDetail') },
        { path: 'epp', lazy: () => import('@/features/epp/EppIndex') },

        // --- Evaluaciones (Fase 4) ---
        { path: 'evaluacion', lazy: () => import('@/features/evaluacion/EvaluacionList') },
        { path: 'evaluacion/:id', lazy: () => import('@/features/evaluacion/EvaluacionDetail') },

        // --- Logística (Fase 4) ---
        { path: 'logistica', lazy: () => import('@/features/logistica/LogisticaIndex') },
        { path: 'pasaje', lazy: () => import('@/features/logistica/PasajeList') },
        { path: 'citacion', lazy: () => import('@/features/logistica/CitacionList') },
        { path: 'hospedaje', lazy: () => import('@/features/logistica/HospedajeList') },
        // --- Configuración (Fase 4: catálogos) ---
        { path: 'config', lazy: () => import('@/features/config/ConfigIndex') },
        { path: 'faena', lazy: () => import('@/features/config/FaenaList') },
        { path: 'cargo', lazy: () => import('@/features/config/CargoList') },
        { path: 'documento', lazy: () => import('@/features/config/DocumentoList') },
        { path: 'empresa', lazy: () => import('@/features/config/EmpresaList') },
        { path: 'empresa-cliente', lazy: () => import('@/features/config/EmpresaClienteList') },
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
