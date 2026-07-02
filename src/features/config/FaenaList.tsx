import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Filter, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CatalogoPage } from './CatalogoPage';
import { useFaenasListado } from './hooks';
import { RowActionsMenu } from '@/components/common/RowActionsMenu';

/**
 * Clon de faena.component.html: Nombre/Empresa/Descripcion (sin tilde, fiel al
 * i18n)/Usuarios (logins) + kebab sin gating. Filtro Nombre = IGUALDAD EXACTA
 * y SOLO botón Filtrar (sin Limpiar), como el real.
 */
export function Component() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [applied, setApplied] = useState<string | null>(null);
  const { data: faenas, isLoading, isError } = useFaenasListado(applied);
  const rows = faenas ?? [];

  return (
    <CatalogoPage
      breadcrumb="Faenas"
      title="Faenas"
      subtitleBase="Listado de faenas registradas"
      count={rows.length}
      nuevoLabel="Nueva faena"
      onNuevo={() => navigate('/faena/nueva')}
      isLoading={isLoading}
      isError={isError}
      emptyTitle="No se encontraron resultados"
      emptyHint="Ajusta los filtros o crea una nueva faena."
      filtros={
        <input
          className="app-field__control"
          placeholder="Nombre"
          maxLength={150}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setApplied(nombre || null)}
        />
      }
      filtroActions={
        <button type="button" className="btn btn-primary" onClick={() => setApplied(nombre || null)}>
          <Filter size={16} /> Filtrar
        </button>
      }
    >
      <table className="app-table app-table--hover">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Empresa</th>
            <th>Descripcion</th>
            <th>Usuarios</th>
            <th style={{ width: 56 }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.id}>
              <td className="font-semibold">{f.nombre}</td>
              <td>{f.empresa}</td>
              <td>{f.descripcion}</td>
              <td>{f.usuarios}</td>
              <td>
                <RowActionsMenu
                  actions={[
                    { label: 'Ver', icon: <Eye size={16} />, onClick: () => navigate(`/faena/${f.id}/ver`) },
                    { label: 'Editar', icon: <Pencil size={16} />, onClick: () => navigate(`/faena/${f.id}/editar`) },
                    {
                      label: 'Eliminar',
                      icon: <Trash2 size={16} />,
                      onClick: () => toast.info('Eliminar faena: disponible al portar la mutación (Fase 4).'),
                    },
                  ]}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CatalogoPage>
  );
}
