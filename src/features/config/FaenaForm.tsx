import { CatalogoForm, type CatalogoField } from './CatalogoForm';
import { useEmpresaClienteNombres } from './hooks';

/** Exportado como `Component` para el `lazy` del router. Crear/editar faena. */
export function Component() {
  const { data: empresas } = useEmpresaClienteNombres();
  const fields: CatalogoField[] = [
    { key: 'nombre', label: 'Nombre', type: 'text', required: true, maxLength: 150 },
    { key: 'descripcion', label: 'Descripción', type: 'textarea', maxLength: 500 },
    { key: 'empresa', label: 'Empresa', type: 'select', options: empresas ?? [] },
  ];
  return (
    <CatalogoForm
      tabla="faena"
      singular="faena"
      backTo="/faena"
      fields={fields}
      createExtras={(login) => ({ usuario_sistema: login, fecha_sistema: new Date().toISOString() })}
    />
  );
}
