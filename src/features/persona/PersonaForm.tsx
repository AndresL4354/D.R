import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { personaSchema, type PersonaInput } from './schema';
import { useCreatePersona, usePersona, useUpdatePersona } from './hooks';
import { useEmpresa } from '@/hooks/useEmpresa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FIELDS: { name: keyof PersonaInput; label: string; type?: string }[] = [
  { name: 'nombre_completo', label: 'Nombre completo' },
  { name: 'numero_id', label: 'RUT' },
  { name: 'tipo_id', label: 'Tipo de identificación' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'telefono', label: 'Teléfono' },
  { name: 'movil', label: 'Móvil' },
  { name: 'direccion', label: 'Dirección' },
  { name: 'empresa', label: 'Empresa' },
  { name: 'cargo', label: 'Cargo' },
  { name: 'nacionalidad', label: 'Nacionalidad' },
  { name: 'genero', label: 'Género' },
  { name: 'estado_civil', label: 'Estado civil' },
];

const EMPTY: PersonaInput = {
  nombre_completo: '',
  numero_id: '',
  tipo_id: '',
  email: '',
  telefono: '',
  movil: '',
  direccion: '',
  empresa: '',
  cargo: '',
  nacionalidad: '',
  genero: '',
  estado_civil: '',
};

/** Exportado como `Component` para el `lazy` del router. Sirve para alta y edición. */
export function Component() {
  const { id } = useParams();
  const editId = id ? Number(id) : null;
  const isEdit = editId !== null;
  const navigate = useNavigate();
  const empresa = useEmpresa();

  const { data: existing } = usePersona(editId ?? 0);
  const create = useCreatePersona();
  const update = useUpdatePersona();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PersonaInput>({
    resolver: zodResolver(personaSchema),
    defaultValues: { ...EMPTY, empresa: empresa || '' },
  });

  useEffect(() => {
    if (isEdit && existing) {
      reset({
        nombre_completo: existing.nombre_completo ?? '',
        numero_id: existing.numero_id ?? '',
        tipo_id: existing.tipo_id ?? '',
        email: existing.email ?? '',
        telefono: existing.telefono ?? '',
        movil: existing.movil ?? '',
        direccion: existing.direccion ?? '',
        empresa: existing.empresa ?? '',
        cargo: existing.cargo ?? '',
        nacionalidad: existing.nacionalidad ?? '',
        genero: existing.genero ?? '',
        estado_civil: existing.estado_civil ?? '',
      });
    }
  }, [isEdit, existing, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (isEdit && editId) {
      await update.mutateAsync({ id: editId, input: values });
      toast.success('Persona actualizada');
      navigate(`/persona/${editId}`);
    } else {
      const nueva = await create.mutateAsync(values);
      toast.success('Persona creada');
      navigate(`/persona/${nueva.id}`);
    }
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">
        {isEdit ? 'Editar persona' : 'Nueva persona'}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.name} className="space-y-1.5">
                  <label htmlFor={f.name} className="text-sm font-medium">
                    {f.label}
                  </label>
                  <Input id={f.name} type={f.type ?? 'text'} {...register(f.name)} />
                  {errors[f.name] && (
                    <p className="text-xs text-destructive">{errors[f.name]?.message}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button asChild variant="outline" type="button">
                <Link to={isEdit && editId ? `/persona/${editId}` : '/persona'}>Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear persona'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
