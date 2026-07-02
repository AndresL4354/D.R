import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateDespacho, useDespacho, useDespachoFiltrosCatalogos, useUpdateDespacho } from './hooks';
import { ESTADOS_DESPACHO } from './api';
import { useRole } from '@/features/auth/useRole';

const ROLES_DESPACHO = [
  'ROLE_ADMIN',
  'DESPACHO_ACREDITACION',
  'DESPACHO_ADMINISTRADOR',
  'DESPACHO_BODEGA',
  'DESPACHO_CURSOS',
  'DESPACHO_RECEPCION',
  'DESPACHO_SSO',
  'DESPACHO_TRANSPORTE',
];

/** Exportado como `Component` para el `lazy` del router. Crear / editar despacho. */
export function Component() {
  const { id } = useParams();
  const editId = id ? Number(id) : null;
  const isEdit = editId != null;
  const navigate = useNavigate();
  const { hasAnyRole } = useRole();

  const { data: existing, isLoading } = useDespacho(editId ?? 0);
  const { data: cat } = useDespachoFiltrosCatalogos();
  const createMut = useCreateDespacho();
  const updateMut = useUpdateDespacho();

  const [nombre, setNombre] = useState('');
  const [idProyecto, setIdProyecto] = useState('');
  const [estado, setEstado] = useState('ACTIVO');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');

  useEffect(() => {
    if (isEdit && existing) {
      setNombre(existing.nombre_despacho ?? '');
      setIdProyecto(existing.id_proyecto != null ? String(existing.id_proyecto) : '');
      setEstado(existing.estado ?? 'ACTIVO');
      if (existing.fecha_despacho) {
        const dt = new Date(existing.fecha_despacho);
        const pad = (n: number) => String(n).padStart(2, '0');
        setFecha(`${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`);
        setHora(`${pad(dt.getHours())}:${pad(dt.getMinutes())}`);
      }
    }
  }, [isEdit, existing]);

  const canManage = hasAnyRole(ROLES_DESPACHO);

  if (!canManage) {
    return (
      <div className="app-empty-state">
        <p className="app-empty-state__title">No tienes permisos</p>
        para crear o editar despachos.
      </div>
    );
  }
  if (isEdit && isLoading) {
    return (
      <div className="app-empty-state">
        <Loader2 className="mx-auto animate-spin" size={24} />
      </div>
    );
  }

  const fechaISO = fecha ? new Date(`${fecha}T${hora || '00:00'}:00`).toISOString() : null;
  const puedeGuardar =
    nombre.trim() !== '' && !!fecha && idProyecto !== '' && !createMut.isPending && !updateMut.isPending;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeGuardar) return;
    const input = {
      nombreDespacho: nombre.trim(),
      estado,
      fechaDespacho: fechaISO,
      idProyecto: idProyecto ? Number(idProyecto) : null,
    };
    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: editId!, input });
        toast.success('Despacho actualizado.');
        navigate(`/despacho/${editId}`);
      } else {
        const newId = await createMut.mutateAsync(input);
        toast.success('Despacho creado. Agrega el personal a despachar.');
        navigate(`/despacho/${newId}`);
      }
    } catch (err) {
      toast.error(`No se pudo guardar: ${(err as Error).message}`);
    }
  };

  return (
    <div>
      <ol className="app-breadcrumb">
        <li>
          <Link to="/despacho">Despachos</Link>
        </li>
        <li className="active">· {isEdit ? 'Editar' : 'Nuevo'}</li>
      </ol>

      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">{isEdit ? 'Editar despacho' : 'Nuevo despacho'}</h1>
            <p className="app-page-subtitle">Datos del despacho{isEdit ? '' : ' — el personal se agrega luego en el detalle'}</p>
          </div>
        </div>
        <div className="app-page-header__actions">
          <Link to={isEdit ? `/despacho/${editId}` : '/despacho'} className="btn btn-secondary">
            <ArrowLeft size={16} /> Volver
          </Link>
        </div>
      </div>

      <form className="app-card" onSubmit={onSubmit}>
        <div className="app-card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="app-field sm:col-span-2">
              <label className="app-field__label">Nombre del despacho *</label>
              <input className="app-field__control" maxLength={150} value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="app-field">
              <label className="app-field__label">Servicio *</label>
              <select className="app-field__control" value={idProyecto} onChange={(e) => setIdProyecto(e.target.value)}>
                <option value="">Selecciona…</option>
                {(cat?.servicios ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="app-field">
              <label className="app-field__label">Estado</label>
              <select className="app-field__control" value={estado} onChange={(e) => setEstado(e.target.value)}>
                {ESTADOS_DESPACHO.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="app-field">
              <label className="app-field__label">Fecha *</label>
              <input type="date" className="app-field__control" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="app-field">
              <label className="app-field__label">Hora</label>
              <input type="time" className="app-field__control" value={hora} onChange={(e) => setHora(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="app-modal__footer" style={{ borderTop: '1px solid var(--app-border)' }}>
          <Link to={isEdit ? `/despacho/${editId}` : '/despacho'} className="btn btn-segundo">
            Cancelar
          </Link>
          <button type="submit" className="btn btn-primary" disabled={!puedeGuardar}>
            <Save size={16} /> {createMut.isPending || updateMut.isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
