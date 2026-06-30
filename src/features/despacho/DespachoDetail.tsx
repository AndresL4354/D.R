import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuditoria, useDespacho, useTrabajadores, useUpdateEstadoDespacho } from './hooks';
import { ESTADOS_DESPACHO } from './api';
import { EstadoBadge } from './DespachoList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatDateTime } from '@/lib/utils';

/** Exportado como `Component` para el `lazy` del router. */
export function Component() {
  const { id } = useParams();
  const despachoId = Number(id);
  const { data: d, isLoading, isError } = useDespacho(despachoId);
  const { data: trabajadores } = useTrabajadores(despachoId);
  const { data: auditoria } = useAuditoria(despachoId);
  const updateEstado = useUpdateEstadoDespacho();

  const [estado, setEstado] = useState('');
  useEffect(() => {
    if (d?.estado) setEstado(d.estado);
  }, [d?.estado]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (isError || !d) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">No se encontró el despacho (o sin permisos).</p>
        <Button asChild variant="outline">
          <Link to="/despacho">Volver</Link>
        </Button>
      </div>
    );
  }

  const onSave = async () => {
    if (estado === d.estado) return;
    await updateEstado.mutateAsync({ id: despachoId, estado });
    toast.success('Estado actualizado (queda registrado en auditoría)');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {d.nombre_despacho ?? `Despacho #${d.id}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            Fecha: {formatDate(d.fecha_despacho)} · Proyecto: {d.id_proyecto ?? '—'}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/despacho">Volver</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estado</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <EstadoBadge estado={d.estado} />
          <span className="text-muted-foreground">→</span>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            {ESTADOS_DESPACHO.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Button onClick={onSave} disabled={estado === d.estado || updateEstado.isPending}>
            {updateEstado.isPending ? 'Guardando…' : 'Cambiar estado'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trabajadores ({trabajadores?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!trabajadores || trabajadores.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin trabajadores.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {trabajadores.map((t) => (
                  <li key={t.id} className="border-b py-1 last:border-0">
                    {t.persona ?? `Persona #${t.id_persona ?? '—'}`}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Auditoría de estados</CardTitle>
          </CardHeader>
          <CardContent>
            {!auditoria || auditoria.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin cambios registrados.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {auditoria.map((a) => (
                  <li key={a.id} className="border-b pb-2 last:border-0">
                    <span className="font-medium">{a.estado_anterior ?? '—'}</span> →{' '}
                    <span className="font-medium">{a.estado_nuevo ?? '—'}</span>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(a.fecha)} · {a.usuario ?? '—'}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
