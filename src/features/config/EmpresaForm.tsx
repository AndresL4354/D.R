import { CatalogoForm, type CatalogoField } from './CatalogoForm';

const FIELDS: CatalogoField[] = [
  { key: 'razon_social', label: 'Razón social', type: 'text', required: true, maxLength: 200, colSpan2: true },
  { key: 'nit', label: 'RUT / NIT', type: 'text', maxLength: 50 },
  { key: 'estado', label: 'Estado', type: 'text', maxLength: 50 },
  { key: 'direccion', label: 'Dirección', type: 'text', maxLength: 200 },
  { key: 'telefono', label: 'Teléfono', type: 'text', maxLength: 50 },
  { key: 'persona_contacto', label: 'Persona de contacto', type: 'text', maxLength: 150 },
  { key: 'telefono_contacto', label: 'Teléfono de contacto', type: 'text', maxLength: 50 },
  { key: 'descripcion', label: 'Descripción', type: 'textarea', maxLength: 500 },
];

/** Exportado como `Component` para el `lazy` del router. Crear/editar empresa. */
export function Component() {
  return <CatalogoForm tabla="empresa" singular="empresa" backTo="/empresa" fields={FIELDS} />;
}
