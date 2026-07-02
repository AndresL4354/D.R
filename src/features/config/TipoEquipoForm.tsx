import { CatalogoForm, type CatalogoField } from './CatalogoForm';

const FIELDS: CatalogoField[] = [
  { key: 'nombre', label: 'Nombre', type: 'text', required: true, maxLength: 150 },
  { key: 'tipo', label: 'Tipo', type: 'text', maxLength: 150 },
];

/** Exportado como `Component` para el `lazy` del router. Crear/editar tipo de equipo. */
export function Component() {
  return <CatalogoForm tabla="tipo_equipo" singular="tipo de equipo" backTo="/tipo-equipo" fields={FIELDS} />;
}
