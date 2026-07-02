import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Ban, Info, Loader2, Save } from 'lucide-react';
import { useCreateProyecto, useFaenasParaForm, useProyecto, useUpdateProyecto } from './hooks';
import { useAuth } from '@/features/auth/useAuth';
import { useRole } from '@/features/auth/useRole';

/** Hoy a las 00:00 en formato datetime-local (default del form real: dayjs().startOf('day')). */
function hoyInicioDia(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T00:00`;
}

/** timestamp de BD → valor de input datetime-local. */
function aDatetimeLocal(v: string | null): string {
  if (!v) return '';
  return v.slice(0, 16).replace(' ', 'T');
}

/**
 * Exportado como `Component` para el `lazy` del router. Clon de
 * proyecto-update.component: breadcrumb 'Servicios › Crear/Editar', card
 * 'Datos del servicio' con Nombre/Faena/Fechas/Descripción.
 * Quirk fiel: el form real NO tiene validators (editForm.invalid nunca es
 * true) — Guardar no se bloquea por campos vacíos, y la faena es opcional
 * en la práctica. estado lo pone el backend (ACTIVO al crear).
 */
export function Component() {
  const { id } = useParams();
  const esCrear = !id;
  const proyectoId = id ? Number(id) : 0;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { empresa } = useRole();

  const { data: proyecto } = useProyecto(proyectoId);
  const { data: faenas } = useFaenasParaForm();
  const crear = useCreateProyecto();
  const actualizar = useUpdateProyecto();

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    idFaena: '',
    fechaInicio: hoyInicioDia(),
    fechaFin: hoyInicioDia(),
  });

  useEffect(() => {
    if (!esCrear && proyecto) {
      setForm({
        nombre: proyecto.nombre ?? '',
        descripcion: proyecto.descripcion ?? '',
        idFaena: proyecto.id_faena != null ? String(proyecto.id_faena) : '',
        fechaInicio: aDatetimeLocal(proyecto.fecha_inicio),
        fechaFin: aDatetimeLocal(proyecto.fecha_fin),
      });
    }
  }, [esCrear, proyecto]);

  const isSaving = crear.isPending || actualizar.isPending;
  const pantalla = esCrear ? 'Crear' : 'Editar';

  const guardar = async () => {
    const faenaSel = (faenas ?? []).find((f) => String(f.id) === form.idFaena);
    const input = {
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      faena: faenaSel?.nombre ?? null,
      idFaena: faenaSel?.id ?? null,
      fechaInicio: form.fechaInicio || null,
      fechaFin: form.fechaFin || null,
    };
    const usuario = user?.email ?? '';
    if (esCrear) await crear.mutateAsync({ input, usuario, empresa });
    else await actualizar.mutateAsync({ id: proyectoId, input, usuario });
    navigate(-1); // fiel: onSaveSuccess → history.back(), sin toast
  };

  if (!esCrear && !proyecto) {
    return (
      <div className="app-empty-state">
        <Loader2 className="mx-auto animate-spin" size={22} />
      </div>
    );
  }

  return (
    <div>
      <ul className="app-breadcrumb">
        <li>
          <Link to="/proyecto">Servicios</Link>
        </li>
        <li aria-hidden>›</li>
        <li className="active">{pantalla}</li>
      </ul>

      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">{pantalla} servicio</h1>
            <p className="app-page-subtitle">Completa los datos del servicio.</p>
          </div>
        </div>
      </div>

      <div className="app-card">
        <div className="app-card-header">
          <Info className="app-card-header__icon" size={18} />
          <h4>Datos del servicio</h4>
        </div>
        <div className="app-card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="app-field">
              <span className="app-field__label">Nombre</span>
              <input
                className="app-field__control"
                maxLength={150}
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </label>
            <label className="app-field">
              <span className="app-field__label">Faena</span>
              <select
                className="app-field__control"
                value={form.idFaena}
                onChange={(e) => setForm({ ...form, idFaena: e.target.value })}
              >
                <option value="">Seleccione una faena</option>
                {(faenas ?? []).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="app-field">
              <span className="app-field__label">Fecha inicio</span>
              <input
                type="datetime-local"
                className="app-field__control"
                value={form.fechaInicio}
                onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
              />
            </label>
            <label className="app-field">
              <span className="app-field__label">Fecha fin</span>
              <input
                type="datetime-local"
                className="app-field__control"
                value={form.fechaFin}
                onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
              />
            </label>
            <label className="app-field sm:col-span-2">
              <span className="app-field__label">Descripción</span>
              <textarea
                className="app-field__control"
                style={{ height: 'auto', minHeight: 84, paddingTop: 8 }}
                rows={3}
                maxLength={200}
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="app-action-bar">
        <button type="button" className="btn btn-segundo" onClick={() => navigate(-1)} disabled={isSaving}>
          <Ban size={16} /> Cancelar
        </button>
        <button type="button" className="btn btn-primary" onClick={guardar} disabled={isSaving}>
          <Save size={16} /> {isSaving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
