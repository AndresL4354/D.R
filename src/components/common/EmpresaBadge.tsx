import { useEmpresa } from '@/hooks/useEmpresa';
import { cn } from '@/lib/utils';

/** Muestra el tenant/empresa del usuario (claim app_empresa). Solo informativo. */
export function EmpresaBadge({ className }: { className?: string }) {
  const empresa = useEmpresa();
  if (!empresa) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground',
        className,
      )}
      title="Empresa / tenant"
    >
      {empresa}
    </span>
  );
}
