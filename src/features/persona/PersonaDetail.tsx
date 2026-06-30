import { Link, useParams } from 'react-router-dom';
import { Loader2, Pencil } from 'lucide-react';
import { usePersona } from './hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRut, formatDate } from '@/lib/utils';

/** Exportado como `Component` para el `lazy` del router. */
export function Component() {
  const { id } = useParams();
  const personaId = Number(id);
  const { data: p, isLoading, isError } = usePersona(personaId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (isError || !p) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">No se encontró la persona (o sin permisos para verla).</p>
        <Button asChild variant="outline">
          <Link to="/persona">Volver</Link>
        </Button>
      </div>
    );
  }

  const fields: { label: string; value: string | null }[] = [
    { label: 'RUT', value: formatRut(p.numero_id) },
    { label: 'Tipo ID', value: p.tipo_id },
    { label: 'Empresa', value: p.empresa },
    { label: 'Cargo', value: p.cargo },
    { label: 'Email', value: p.email },
    { label: 'Teléfono', value: p.telefono },
    { label: 'Móvil', value: p.movil },
    { label: 'Dirección', value: p.direccion },
    { label: 'Nacionalidad', value: p.nacionalidad },
    { label: 'Género', value: p.genero },
    { label: 'Estado civil', value: p.estado_civil },
    { label: 'Fecha nacimiento', value: formatDate(p.fecha_nacimiento) },
    { label: 'Región', value: p.region },
    { label: 'Comuna', value: p.comuna },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{p.nombre_completo}</h1>
          <p className="text-sm text-muted-foreground">ID interno: {p.id}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/persona">Volver</Link>
          </Button>
          <Button asChild>
            <Link to={`/persona/${p.id}/editar`}>
              <Pencil /> Editar
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ficha</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((f) => (
              <div key={f.label}>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{f.label}</dt>
                <dd className="text-sm">{f.value || '—'}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
