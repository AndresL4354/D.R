import { useEmpresa } from '@/hooks/useEmpresa';
import { cn } from '@/lib/utils';

/** Muestra el tenant/empresa del usuario (claim app_empresa). Estilo para el navbar rojo. */
export function EmpresaBadge({ className }: { className?: string }) {
  const empresa = useEmpresa();
  if (!empresa) return null;
  return (
    <span
      className={cn(
        'hidden items-center rounded-full border border-white/25 bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white md:inline-flex',
        className,
      )}
      title="Empresa / tenant"
    >
      {empresa}
    </span>
  );
}
