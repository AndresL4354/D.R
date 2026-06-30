import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    '[supabase] Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. ' +
      'Copia .env.example a .env.local y completa las credenciales.',
  );
}

/**
 * Cliente único de Supabase para el browser.
 * Usa SOLO la anon key + la sesión del usuario; la autoridad real la da RLS.
 * supabase-js adjunta el Bearer automáticamente y refresca el token solo
 * (reemplaza auth.interceptor + auth-expired.interceptor de Angular).
 */
export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
