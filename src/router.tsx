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

        // --- Dominios (se irán poblando por fase; hoy placeholders) ---
        { path: 'persona', lazy: () => import('@/features/persona/PersonaList') },
        // { path: 'persona/:id', lazy: () => import('@/features/persona/PersonaDetail') },
        // { path: 'despacho', lazy: () => import('@/features/despacho/DespachoList') },
        // ...las 32 rutas de entidad...

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
