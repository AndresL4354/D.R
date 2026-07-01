import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Loader2, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEquipos } from './hooks';
import { useRole } from '@/features/auth/useRole';

/** Menú kebab (clon del mat-menu real). */
function RowMenu({ id, canDelete }: { id: number; canDelete: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  return (
    <div className="relative inline-block" ref={ref}>
      <button className="btn-icon btn-icon--primary" title="Acciones" onClick={() => setOpen((o) => !o)}>
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="app-navbar__dropdown app-navbar__dropdown--end" style={{ marginTop: 4 }}>
          <button className="app-navbar__dropdown-item" onClick={() => { setOpen(false); navigate(`/equipo/${id}`); }}>
            <Eye size={16} /> <span>Ver</span>
          </button>
          <button className="app-navbar__dropdown-item" onClick={() => { setOpen(false); navigate(`/equipo/${id}/editar`); }}>
            <Pencil size={16} /> <span>Editar</span>
          </button>
          {canDelete && (
            <button
              className="app-navbar__dropdown-item"
              onClick={() => {
                setOpen(false);
                toast.info('Eliminar equipo: disponible al portar la mutación (Fase 4).');
              }}
            >
              <Trash2 size={16} /> <span>Eliminar</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Exportado como `Component` para el `lazy` del router. Clon de
 * equipo.component.html (list) — en el navbar real este listado se abre desde
 * "Reportabilidad → Evaluaciones" (REP_PERSONAS) pese a titularse "Equipos".
 * Sin filtros, sin paginación ni orden (findAll), igual que el original.
 */
export function Component() {
  const navigate = useNavigate();
  const { hasAnyRole } = useRole();
  const { data: equipos, isLoading, isError } = useEquipos();
  const canDelete = hasAnyRole(['ROLE_ADMIN', 'SUPERADMINISTRADOR', 'SUPERADMINISTRADOR BP']);

  return (
    <div>
      <ul className="app-breadcrumb">
        <li className="active">Equipos</li>
      </ul>

      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Equipos</h1>
            <p className="app-page-subtitle">
              Listado de equipos registrados
              {(equipos?.length ?? 0) > 0 && (
                <>
                  {' '}
                  · <strong>{equipos!.length}</strong> resultados
                </>
              )}
            </p>
          </div>
        </div>
        <div className="app-page-header__actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Volver
          </button>
          <Link to="/equipo/nuevo" className="btn btn-primary">
            <Plus size={16} /> Nuevo equipo
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="app-empty-state">
          <Loader2 className="mx-auto animate-spin" size={22} />
        </div>
      )}
      {isError && (
        <div className="app-empty-state" style={{ color: 'var(--app-color-danger)' }}>
          Error al cargar equipos.
        </div>
      )}

      {!isLoading && !isError && (equipos?.length ?? 0) === 0 && (
        <div className="app-card">
          <div className="app-card-body">
            <div className="app-empty-state">
              <p className="app-empty-state__title">No se encontraron equipos</p>
              Crea un nuevo equipo para comenzar.
            </div>
          </div>
        </div>
      )}

      {(equipos?.length ?? 0) > 0 && (
        <div className="app-table-wrap">
          <table className="app-table app-table--hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo de equipo</th>
                <th>Persona</th>
                <th>Tipo de propiedad</th>
                <th style={{ width: 56 }} />
              </tr>
            </thead>
            <tbody>
              {equipos!.map((e) => (
                <tr key={e.id}>
                  <td className="font-semibold">{e.id}</td>
                  <td>{e.tipoEquipo}</td>
                  <td>{e.persona}</td>
                  <td>{e.tipoPropiedad}</td>
                  <td>
                    <RowMenu id={e.id} canDelete={canDelete} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
