import { CatalogoForm, type CatalogoField } from './CatalogoForm';
import { CATEGORIAS_DOCUMENTO } from './api';

const FIELDS: CatalogoField[] = [
  { key: 'nombre', label: 'Nombre', type: 'text', required: true, maxLength: 150, colSpan2: true },
  { key: 'descripcion', label: 'Descripción', type: 'textarea', maxLength: 500 },
  { key: 'categoria_documento', label: 'Categoría', type: 'select', options: CATEGORIAS_DOCUMENTO },
  { key: 'empresa', label: 'Empresa', type: 'text', maxLength: 150 },
  { key: 'tipo_resultado', label: 'Tipo de resultado', type: 'text', maxLength: 150 },
  { key: 'requerido', label: 'Requerido', type: 'checkbox' },
  { key: 'todas', label: 'Aplica a todas', type: 'checkbox' },
  { key: 'privado', label: 'Privado', type: 'checkbox' },
  { key: 'resultado', label: 'Registra resultado', type: 'checkbox' },
];

/** Exportado como `Component` para el `lazy` del router. Crear/editar documento. */
export function Component() {
  return <CatalogoForm tabla="documento" singular="documento" backTo="/documento" fields={FIELDS} />;
}
