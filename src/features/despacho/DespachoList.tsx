import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useDespachos } from './hooks';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 20;

export function EstadoBadge({ estado }: { estado: string | null }) {
  const color =
    estado === 'ACTIVO'
      ? 'bg-green-100 text-green-800'
      : estado === 'FINALIZADO'
        ? 'bg-slate-100 text-slate-700'
        : estado === 'INACTIVO'
          ? 'bg-amber-100 text-amber-800'
          : 'bg-muted text-muted-foreground';
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {estado ?? '—'}
    </span>
  );
}

/** Exportado como `Component` para el `lazy` del router. */
export function Component() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const debounced = useDebounce(search);
  const navigate = useNavigate();

  const { data, isLoading, isError } = useDespachos({ search: debounced, page, size: PAGE_SIZE });
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const proyectos = data?.proyectos;
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Despachos</h1>
        <Input
          placeholder="Buscar por nombre…"
          className="w-64"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Despacho</th>
              <th className="px-4 py-2 font-medium">Proyecto</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  <Loader2 className="mx-auto size-5 animate-spin" />
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-destructive">
                  Error al cargar despachos (¿tu rol tiene acceso?).
                </td>
              </tr>
            )}
            {!isLoading && !isError && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Sin resultados.
                </td>
              </tr>
            )}
            {rows.map((d) => (
              <tr
                key={d.id}
                onClick={() => navigate(`/despacho/${d.id}`)}
                className="cursor-pointer border-b last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-2">{d.nombre_despacho ?? `#${d.id}`}</td>
                <td className="px-4 py-2">
                  {d.id_proyecto != null ? (proyectos?.get(d.id_proyecto) ?? d.id_proyecto) : '—'}
                </td>
                <td className="px-4 py-2">
                  <EstadoBadge estado={d.estado} />
                </td>
                <td className="px-4 py-2">{formatDate(d.fecha_despacho)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} despachos</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Anterior
          </Button>
          <span>
            {page + 1} / {lastPage + 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= lastPage}
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
