import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { personaSchema, type PersonaInput } from './schema';
import { useCreatePersona, usePersona, useUpdatePersona } from './hooks';
import { useEmpresa } from '@/hooks/useEmpresa';

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

/** Exportado como `Component` para el `lazy` del router. Alta y edición. */
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
    <div>
      <div className="app-page-header">
        <div className="app-page-header__main">
          <h1 className="app-page-title">{isEdit ? 'Editar persona' : 'Nueva persona'}</h1>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate>
        <div className="app-card">
          <div className="app-card-header">
            <h4>Datos</h4>
          </div>
          <div className="app-card-body">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 'var(--app-space-4)',
              }}
            >
              {FIELDS.map((f) => (
                <div key={f.name} className="app-field">
                  <label htmlFor={f.name} className="app-field__label">
                    {f.label}
                  </label>
                  <input
                    id={f.name}
                    type={f.type ?? 'text'}
                    className="app-field__control"
                    {...register(f.name)}
                  />
                  {errors[f.name] && <p className="app-field__error">{errors[f.name]?.message}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="app-action-bar app-action-bar--bordered">
          <Link
            to={isEdit && editId ? `/persona/${editId}` : '/persona'}
            className="btn btn-secondary"
          >
            Cancelar
          </Link>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear persona'}
          </button>
        </div>
      </form>
    </div>
  );
}
