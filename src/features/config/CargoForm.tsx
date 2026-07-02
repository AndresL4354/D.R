import { CatalogoForm, type CatalogoField } from './CatalogoForm';

const FIELDS: CatalogoField[] = [
  { key: 'nombre', label: 'Nombre', type: 'text', required: true, maxLength: 150 },
  { key: 'descripcion', label: 'Descripción', type: 'textarea', maxLength: 500 },
  { key: 'tipo_cargo', label: 'Tipo de cargo', type: 'text', maxLength: 150 },
  { key: 'valor_turno', label: 'Valor turno', type: 'number' },
];

/** Exportado como `Component` para el `lazy` del router. Crear/editar cargo. */
export function Component() {
  return <CatalogoForm tabla="cargo" singular="cargo" backTo="/cargo" fields={FIELDS} />;
}
