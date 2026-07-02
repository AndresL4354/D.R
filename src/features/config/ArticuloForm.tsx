import { CatalogoForm, type CatalogoField } from './CatalogoForm';
import { CLASIFICACIONES_ARTICULO } from './api';

const FIELDS: CatalogoField[] = [
  { key: 'descripcion', label: 'Descripción', type: 'text', required: true, maxLength: 250, colSpan2: true },
  { key: 'marca', label: 'Marca', type: 'text', maxLength: 150 },
  { key: 'clasificacion', label: 'Clasificación', type: 'select', options: CLASIFICACIONES_ARTICULO },
  { key: 'tipo', label: 'Tipo', type: 'text', maxLength: 150 },
  { key: 'modelo', label: 'Modelo', type: 'text', maxLength: 150 },
  { key: 'talla', label: 'Talla', type: 'text', maxLength: 50 },
  { key: 'color', label: 'Color', type: 'text', maxLength: 50 },
  { key: 'fecha_fabricacion', label: 'Fecha de fabricación', type: 'date' },
  { key: 'fecha_expiracion', label: 'Fecha de expiración', type: 'date' },
  { key: 'opcional', label: 'Opcional', type: 'checkbox' },
  { key: 'identificador', label: 'Identificador', type: 'checkbox' },
];

/** Exportado como `Component` para el `lazy` del router. Crear/editar artículo. */
export function Component() {
  return <CatalogoForm tabla="articulo" singular="artículo" backTo="/articulo" fields={FIELDS} />;
}
