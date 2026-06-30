import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

/**
 * Canje del launch token de Gesta OS (preserva el flujo de SSO-GESTA-OS.md).
 * Llama a la Edge Function `sso-consume` (Fase 1), que valida contra el hub y
 * devuelve un action_link (magic link) para crear sesión Supabase.
 */
export function SsoCallbackPage() {
  const [params] = useSearchParams();
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = params.get('token');
    if (!token) {
      setErrorKey('token_required');
      return;
    }

    void (async () => {
      const { data, error } = await supabase.functions.invoke<{ action_link?: string }>(
        'sso-consume',
        { body: { token } },
      );
      if (error || !data?.action_link) {
        setErrorKey('hub_rejected');
        return;
      }
      // El front canjea el magic link y queda logueado.
      window.location.href = data.action_link;
    })();
  }, [params]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3">
      {errorKey ? (
        <>
          <p className="font-medium text-destructive">No se pudo iniciar sesión vía SSO.</p>
          <p className="text-sm text-muted-foreground">
            Código: <code>{errorKey}</code>
          </p>
        </>
      ) : (
        <>
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Validando acceso con Gesta OS…</p>
        </>
      )}
    </div>
  );
}
