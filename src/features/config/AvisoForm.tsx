import { CatalogoForm, type CatalogoField } from './CatalogoForm';

const FIELDS: CatalogoField[] = [
  { key: 'titulo', label: 'Título', type: 'text', required: true, maxLength: 200, colSpan2: true },
  { key: 'mensaje', label: 'Mensaje', type: 'textarea', required: true, maxLength: 1000 },
  { key: 'fecha_inicio', label: 'Fecha/hora de inicio', type: 'datetime' },
  { key: 'duracion_minutos', label: 'Duración (min)', type: 'number' },
  { key: 'anticipacion_minutos', label: 'Anticipación (min)', type: 'number' },
  { key: 'activo', label: 'Activo', type: 'checkbox' },
];

/** Exportado como `Component` para el `lazy` del router. Crear/editar aviso de mantenimiento. */
export function Component() {
  return (
    <CatalogoForm
      tabla="aviso_mantenimiento"
      singular="aviso"
      backTo="/aviso-mantenimiento"
      fields={FIELDS}
      createExtras={(login) => ({ created_by: login, created_date: new Date().toISOString() })}
    />
  );
}
