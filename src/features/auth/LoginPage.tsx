import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
  username: z.string().min(1, 'Requerido'),
  password: z.string().min(1, 'Requerido'),
});
type LoginInput = z.infer<typeof loginSchema>;

const INPUT_CLASS =
  'h-[42px] rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/persona';
  const [authError, setAuthError] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setAuthError(false);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.username.trim(),
      password: values.password,
    });
    if (error) {
      setAuthError(true);
      return;
    }
    navigate(from, { replace: true });
  });

  return (
    <div className="fixed inset-0 flex overflow-y-auto bg-background">
      <div className="grid min-h-full w-full grid-cols-1 md:grid-cols-[1.05fr_1fr]">
        {/* Hero */}
        <aside
          className="relative hidden items-end p-12 sm:flex"
          style={{
            backgroundImage:
              'linear-gradient(135deg, rgba(26,26,26,0.55) 0%, rgba(220,31,36,0.45) 100%), url(/login-fondo.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="relative z-10 max-w-md text-white">
            <span className="mb-4 inline-block rounded-full border border-white/50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur">
              Gestión Documental
            </span>
            <h2 className="mb-3 text-3xl font-light leading-tight">
              Bienvenido a <strong className="font-bold">DocNómina</strong>
            </h2>
            <p className="text-base leading-relaxed text-white/90">
              Centraliza la documentación de tus personas, controla vencimientos y mantén tu
              operación al día.
            </p>
          </div>
        </aside>

        {/* Panel */}
        <section className="flex items-center justify-center bg-card px-8 py-12">
          <div className="flex w-full max-w-[420px] flex-col gap-5">
            <img src="/logo-docnomina.png" alt="DocNómina" className="w-48 self-start" />

            <div>
              <h1 className="mb-2 text-2xl font-semibold text-foreground">Iniciar sesión</h1>
              <p className="text-sm text-muted-foreground">
                Ingrese sus credenciales para acceder al sistema.
              </p>
            </div>

            {authError && (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <strong>Inicio de sesión fallido.</strong> Revise sus credenciales e intente
                nuevamente.
              </div>
            )}

            <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="username" className="text-sm font-semibold">
                  Usuario
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Ingrese su usuario"
                  className={INPUT_CLASS}
                  {...register('username')}
                />
                {errors.username && (
                  <p className="text-xs text-destructive">{errors.username.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-semibold">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Ingrese su contraseña"
                  className={INPUT_CLASS}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" size="lg" className="mt-2 h-[46px] w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Entrando…' : 'Iniciar sesión'}
              </Button>
            </form>

            <p className="mt-3 text-center text-xs text-muted-foreground/70">
              © DocNómina — Gestión Documental de Personas
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
