import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardList,
  Download,
  Eraser,
  Eye,
  Filter,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  QrCode,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePersonaFiltrosCatalogos, usePersonasFiltradas } from './hooks';
import type { PersonaListFilters } from './api';
import { useRole } from '@/features/auth/useRole';

const PAGE_SIZE = 20;
const ESTADOS = [
  'Registrado',
  'Activo',
  'En Revisión',
  'Inactivo',
  'Observación',
  'Desvinculado',
  'Renuncia',
  'Licencia Médica',
];

interface Draft {
  rut: string;
  nombre: string;
  estado: string;
  comuna: string;
  idCargo: string;
  idFaena: string;
}
const EMPTY: Draft = { rut: '', nombre: '', estado: '', comuna: '', idCargo: '', idFaena: '' };

/** Menú kebab de acciones por fila (clon del mat-menu real). */
function RowActionsMenu({ id, canEdit, canAdmin }: { id: number; canEdit: boolean; canAdmin: boolean }) {
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
  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };
  return (
    <div className="relative inline-block" ref={ref}>
      <button className="btn-icon btn-icon--primary" title="Acciones" onClick={() => setOpen((o) => !o)}>
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="app-navbar__dropdown app-navbar__dropdown--end" style={{ marginTop: 4 }}>
          {canEdit && (
            <button className="app-navbar__dropdown-item" onClick={() => go(`/persona/${id}`)}>
              <Eye size={16} /> <span>Ver</span>
            </button>
          )}
          <button className="app-navbar__dropdown-item" onClick={() => go(`/persona/${id}/evaluaciones`)}>
            <ClipboardList size={16} /> <span>Ver evaluaciones</span>
          </button>
          {canEdit && (
            <button className="app-navbar__dropdown-item" onClick={() => go(`/persona/${id}/editar`)}>
              <Pencil size={16} /> <span>Editar</span>
            </button>
          )}
          {canAdmin && (
            <button
              className="app-navbar__dropdown-item"
              onClick={() => {
                setOpen(false);
                toast.info('Eliminar persona: disponible al portar la mutación (Fase 2/3).');
              }}
            >
              <Trash2 size={16} /> <span>Eliminar</span>
            </button>
          )}
          {canAdmin && (
            <button
              className="app-navbar__dropdown-item"
              onClick={() => {
                setOpen(false);
                toast.info('Generar QR: disponible en Fase 5.');
              }}
            >
              <QrCode size={16} /> <span>Generar QR</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Exportado como `Component` para el `lazy` del router. Clon de persona.component.html (list). */
export function Component() {
  const navigate = useNavigate();
  const { hasAnyRole } = useRole();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [applied, setApplied] = useState<PersonaListFilters>({});
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = usePersonasFiltradas(applied, page, PAGE_SIZE);
  const { data: cat } = usePersonaFiltrosCatalogos();

  const total = data?.total ?? 0;
  const rows = data?.rows ?? [];
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
  const fromN = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const toN = Math.min(total, (page + 1) * PAGE_SIZE);

  const canUpload = hasAnyRole(['ROLE_ADMIN', 'ENCARGADO_RRHH', 'VALIDADOR_RRHH']);
  const canCreate = hasAnyRole(['ROLE_ADMIN', 'VALIDADOR_RRHH', 'ENCARGADO_RRHH']);
  const canDescargar = hasAnyRole(['ROLE_ADMIN', 'OPERACIONES', 'ENCARGADO_RRHH', 'VALIDADOR_RRHH']);
  const canEdit = hasAnyRole(['ROLE_ADMIN', 'VALIDADOR_RRHH', 'ENCARGADO_RRHH']);
  const canAdmin = hasAnyRole(['ROLE_ADMIN', 'SUPERADMINISTRADOR', 'SUPERADMINISTRADOR BP']);

  const apply = () => {
    setApplied({
      rut: draft.rut,
      nombre: draft.nombre,
      estado: draft.estado || null,
      comuna: draft.comuna || null,
      idCargo: draft.idCargo ? Number(draft.idCargo) : null,
      idFaena: draft.idFaena ? Number(draft.idFaena) : null,
    });
    setPage(0);
  };
  const clear = () => {
    setDraft(EMPTY);
    setApplied({});
    setPage(0);
  };
  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') apply();
  };

  return (
    <div>
      <ul className="app-breadcrumb">
        <li className="active">Personas</li>
      </ul>

      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Personas</h1>
            <p className="app-page-subtitle">
              Listado de personas registradas
              {total > 0 && (
                <>
                  {' '}
                  · <strong>{total}</strong> resultados
                </>
              )}
            </p>
          </div>
        </div>
        <div className="app-page-header__actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Volver
          </button>
          {canUpload && (
            <Link to="/upload-personas" className="btn btn-secondary">
              <Upload size={16} /> Cargue Personas
            </Link>
          )}
          {canCreate && (
            <Link to="/persona/nueva" className="btn btn-primary">
              <Plus size={16} /> Nueva persona
            </Link>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="app-card">
        <div className="app-card-header">
          <Filter className="app-card-header__icon" size={18} />
          <h4>Filtros</h4>
        </div>
        <div className="app-card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <input
              className="app-field__control"
              placeholder="RUT"
              maxLength={10}
              value={draft.rut}
              onChange={(e) => setDraft({ ...draft, rut: e.target.value })}
              onKeyDown={onEnter}
            />
            <input
              className="app-field__control"
              placeholder="Nombre completo"
              maxLength={150}
              value={draft.nombre}
              onChange={(e) => setDraft({ ...draft, nombre: e.target.value })}
              onKeyDown={onEnter}
            />
            <select
              className="app-field__control"
              value={draft.estado}
              onChange={(e) => setDraft({ ...draft, estado: e.target.value })}
            >
              <option value="">Estado</option>
              {ESTADOS.map((es) => (
                <option key={es} value={es}>
                  {es}
                </option>
              ))}
            </select>
            <select
              className="app-field__control"
              value={draft.idCargo}
              onChange={(e) => setDraft({ ...draft, idCargo: e.target.value })}
            >
              <option value="">Cargo</option>
              {(cat?.cargos ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <select
              className="app-field__control"
              value={draft.idFaena}
              onChange={(e) => setDraft({ ...draft, idFaena: e.target.value })}
            >
              <option value="">Faena</option>
              {(cat?.faenas ?? []).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nombre}
                </option>
              ))}
            </select>
            <select
              className="app-field__control"
              value={draft.comuna}
              onChange={(e) => setDraft({ ...draft, comuna: e.target.value })}
            >
              <option value="">Ciudad</option>
              {(cat?.comunas ?? []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="app-filter-actions">
            <button type="button" className="btn btn-secondary" onClick={clear}>
              <Eraser size={16} /> Limpiar
            </button>
            <button type="button" className="btn btn-primary" onClick={apply}>
              <Filter size={16} /> Filtrar
            </button>
            {canDescargar && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => toast.info('Exportar a Excel: disponible en Fase 5.')}
              >
                <Download size={16} /> Descargar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="app-table-wrap">
        <table className="app-table app-table--hover">
          <thead>
            <tr>
              <th>Número identificación</th>
              <th>Nombre completo</th>
              <th>Cargos</th>
              <th>Ciudad</th>
              <th>Teléfono</th>
              <th>Servicio</th>
              <th>Estado</th>
              <th style={{ width: 56 }} />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8}>
                  <div className="app-empty-state">
                    <Loader2 className="mx-auto animate-spin" size={22} />
                  </div>
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={8}>
                  <div className="app-empty-state" style={{ color: 'var(--app-color-danger)' }}>
                    Error al cargar personas (¿permisos / sesión?).
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && !isError && rows.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="app-empty-state">
                    <p className="app-empty-state__title">No se encontraron personas</p>
                    Ajusta los filtros o crea una nueva.
                  </div>
                </td>
              </tr>
            )}
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.num_id}</td>
                <td>
                  <Link to={`/persona/${p.id}`} className="font-semibold text-foreground hover:underline">
                    {p.nombre_completo}
                  </Link>
                </td>
                <td>{p.cargos}</td>
                <td>{p.comuna}</td>
                <td>{p.telefono}</td>
                <td>{p.servicio}</td>
                <td>{p.estado_persona}</td>
                <td>
                  <RowActionsMenu id={p.id} canEdit={canEdit} canAdmin={canAdmin} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="app-pagination-bar">
        <div className="app-pagination-bar__meta">
          Mostrando{' '}
          <strong>
            {fromN}–{toN}
          </strong>{' '}
          de <strong>{total}</strong>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Anterior
          </button>
          <span>
            {page + 1} / {lastPage + 1}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page >= lastPage}
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
