import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Ban, Loader2, Plus, Save, Settings, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCargosByFaena,
  useCargosProyecto,
  useGuardarCargosProyecto,
  useProyecto,
} from './hooks';
import type { CargoSolicitado } from './api';

/**
 * Exportado como `Component` para el `lazy` del router. Clon de
 * CargosAsociadosComponent (/proyecto/:id/cargos): autocomplete de cargos por
 * faena, tabla DÍA/NOCHE/turnos, validaciones y textos literales del original.
 * Guardado = full-replace (guardarCargosProyecto).
 */
export function Component() {
  const { id } = useParams();
  const proyectoId = Number(id);
  const navigate = useNavigate();

  const { data: proyecto } = useProyecto(proyectoId);
  const { data: existentes } = useCargosProyecto(proyectoId);
  const { data: disponibles } = useCargosByFaena(proyecto?.id_faena);
  const guardar = useGuardarCargosProyecto();

  const [filas, setFilas] = useState<CargoSolicitado[]>([]);
  const [sel, setSel] = useState('');

  useEffect(() => {
    if (existentes) setFilas(existentes);
  }, [existentes]);

  const agregarCargo = () => {
    const cargo = (disponibles ?? []).find((c) => c.nombre === sel || String(c.id) === sel);
    if (!cargo) return;
    if (filas.some((f) => f.idCargo === cargo.id)) {
      toast.warning('El cargo ya se encuentra asociado');
      return;
    }
    setFilas([
      ...filas,
      { idCargo: cargo.id, nombreCargo: cargo.nombre, cantidad: 0, cantidadNoche: 0, turnosEfectivos: null },
    ]);
    setSel('');
  };

  const setFila = (i: number, patch: Partial<CargoSolicitado>) =>
    setFilas((fs) => fs.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  const quitarFila = (i: number) => setFilas((fs) => fs.filter((_, idx) => idx !== i));

  const onGuardar = async () => {
    // Validaciones literales del componente real
    if (filas.some((f) => f.cantidad === 0 && f.cantidadNoche === 0)) {
      toast.error('No puede asociar cargos con cantidad cero');
      return;
    }
    if (filas.some((f) => f.cantidad < 0 || f.cantidadNoche < 0)) {
      toast.error('Las cantidades no pueden ser negativas');
      return;
    }
    // Quirk fiel: turnosEfectivos null NO bloquea (undefined <= 0 → false)
    if (filas.some((f) => f.turnosEfectivos != null && f.turnosEfectivos <= 0)) {
      toast.error('El número de turnos efectivos debe ser mayor a cero');
      return;
    }
    try {
      await guardar.mutateAsync({ id: proyectoId, cargos: filas });
      toast.success('Servicio actualizado exitosamente');
      navigate(-1);
    } catch (e) {
      toast.error(`No se pudo guardar: ${(e as Error).message}`);
    }
  };

  if (!proyecto) {
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
        <li>
          <Link to={`/proyecto/${proyectoId}`}>Ver</Link>
        </li>
        <li aria-hidden>›</li>
        <li className="active">Asociar cargos</li>
      </ul>

      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Asociar cargos</h1>
            <p className="app-page-subtitle">
              Define los cargos requeridos para el servicio y su distribución por turno.
            </p>
          </div>
        </div>
      </div>

      <div className="app-card">
        <div className="app-card-header">
          <Settings className="app-card-header__icon" size={18} />
          <h4>Agregar cargo</h4>
        </div>
        <div className="app-card-body">
          <div className="flex flex-wrap items-end gap-3">
            <div className="app-field min-w-[320px] flex-1">
              <select className="app-field__control" value={sel} onChange={(e) => setSel(e.target.value)}>
                <option value="">Selecciona un cargo…</option>
                {(disponibles ?? [])
                  .filter((c) => !filas.some((f) => f.idCargo === c.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
              </select>
            </div>
            <button type="button" className="btn btn-primary" onClick={agregarCargo} disabled={!sel}>
              <Plus size={16} /> Agregar
            </button>
          </div>
        </div>
      </div>

      <div className="app-table-wrap">
        <table className="app-table">
          <thead>
            <tr>
              <th>Cargo</th>
              <th style={{ width: 180 }}>Personal requerido DÍA</th>
              <th style={{ width: 180 }}>Personal requerido NOCHE</th>
              <th style={{ width: 160 }}>Turnos efectivos</th>
              <th style={{ width: 56 }} />
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="app-empty-state">Aún no hay cargos asociados. Agrega uno arriba.</div>
                </td>
              </tr>
            )}
            {filas.map((f, i) => (
              <tr key={f.idCargo}>
                <td className="font-semibold">{f.nombreCargo}</td>
                <td>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="app-field__control"
                    value={f.cantidad}
                    onChange={(e) => setFila(i, { cantidad: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="app-field__control"
                    value={f.cantidadNoche}
                    onChange={(e) => setFila(i, { cantidadNoche: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="app-field__control"
                    value={f.turnosEfectivos ?? ''}
                    onChange={(e) =>
                      setFila(i, { turnosEfectivos: e.target.value === '' ? null : Number(e.target.value) })
                    }
                  />
                </td>
                <td>
                  <button className="btn-icon btn-icon--danger" title="Eliminar" onClick={() => quitarFila(i)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="app-action-bar">
        <button type="button" className="btn btn-segundo" onClick={() => navigate(-1)}>
          <Ban size={16} /> Cancelar
        </button>
        <button type="button" className="btn btn-primary" onClick={onGuardar} disabled={guardar.isPending}>
          <Save size={16} /> {guardar.isPending ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
