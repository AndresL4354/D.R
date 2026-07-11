import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/** Extrae un mensaje legible de errores de PostgREST / supabase-js / Error. */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const e = error as { message?: string; error_description?: string; hint?: string };
    return e.message ?? e.error_description ?? e.hint ?? 'Ocurrió un error inesperado';
  }
  return 'Ocurrió un error inesperado';
}

/**
 * QueryClient global. El manejo de errores centralizado (toast) reemplaza
 * los interceptores error-handler + notification de Angular (§6.4 del plan).
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // meta.suppressGlobalError: la vista muestra su propio mensaje (p.ej. el
    // texto literal del original) y no queremos el toast genérico duplicado.
    onError: (error, query) => {
      if (query.meta?.suppressGlobalError) return;
      toast.error(getErrorMessage(error));
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => toast.error(getErrorMessage(error)),
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
