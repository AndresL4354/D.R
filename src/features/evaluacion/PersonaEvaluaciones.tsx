import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { EncuestaDialog } from './EncuestaDialog';
import { TIPOS_EVALUACION, type EvaluacionFilaRow } from './api';
import { useEliminarEvaluacion, useEvaluacionesPersona, usePreguntasPorTipo } from './hooks';
import { usePersona } from '@/features/persona/hooks';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { RowActionsMenu } from '@/components/common/RowActionsMenu';
import { useRole } from '@/features/auth/useRole';
import { formatDateTime } from '@/lib/utils';

function respuestaDe(row: EvaluacionFilaRow, idPregunta: number): string {
  return row.respuestas.find((r) => r.id_pregunta === idPregunta)?.respuesta ?? '—';
}

/** Exportado como `Component` para el `lazy` del router. Evaluaciones de una persona (clon persona/evaluaciones). */
export function Component() {
  const { id } = useParams();
  const personaId = Number(id);
  const { hasRole } = useRole();
  const canAdmin = hasRole('ROLE_ADMIN');

  const [tipo, setTipo] = useState('NORMAL');
  const { data: persona } = usePersona(personaId);
  const { data: preguntas } = usePreguntasPorTipo(tipo);
  const { data: filas, isLoading } = useEvaluacionesPersona(personaId, tipo);
  const eliminarMut = useEliminarEvaluacion();

  const [editar, setEditar] = useState<EvaluacionFilaRow | null>(null);
  const [aEliminar, setAEliminar] = useState<EvaluacionFilaRow | null>(null);

  const rows = filas ?? [];
  const cols = preguntas ?? [];
  const nombre = persona?.nombre_completo ?? `Persona #${personaId}`;

  const doEliminar = async () => {
    if (!aEliminar) return;
    try {
      await eliminarMut.mutateAsync(aEliminar.id);
      toast.success('Encuesta eliminada con exito.');
      setAEliminar(null);
    } catch (e) {
      toast.error(`No se pudo eliminar: ${(e as Error).message}`);
    }
  };

  return (
    <div>
      <ol className="app-breadcrumb">
        <li>
          <Link to="/persona">Personas</Link>
        </li>
        <li>
          <Link to={`/persona/${personaId}`}>{nombre}</Link>
        </li>
        <li className="active">· Evaluaciones</li>
      </ol>

      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Evaluaciones</h1>
            <p className="app-page-subtitle">
              {nombre} · <strong>{rows.length}</strong> resultados
            </p>
          </div>
        </div>
        <div className="app-page-header__actions">
          <select className="app-field__control" style={{ maxWidth: 220 }} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS_EVALUACION.map((t) => (
              <option key={t.tipo} value={t.tipo}>
                {t.label}
              </option>
            ))}
          </select>
          <Link to={`/persona/${personaId}`} className="btn btn-secondary">
            <ArrowLeft size={16} /> Volver
          </Link>
        </div>
      </div>

      <div className="app-table-wrap">
        <table className="app-table app-table--hover">
          <thead>
            <tr>
              <th>Servicio</th>
              {cols.map((c) => (
                <th key={c.id} title={c.pregunta ?? ''}>
                  {c.titulo || c.pregunta}
                </th>
              ))}
              <th>Total</th>
              <th>Fecha</th>
              <th style={{ width: 56 }} />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={cols.length + 4}>
                  <div className="app-empty-state">
                    <Loader2 className="mx-auto animate-spin" size={22} />
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={cols.length + 4}>
                  <div className="app-empty-state">
                    <p className="app-empty-state__title">No se encontraron evaluaciones</p>
                  </div>
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-semibold">{r.proyecto_nombre ?? '—'}</td>
                {cols.map((c) => (
                  <td key={c.id} style={{ textAlign: 'center' }}>
                    {respuestaDe(r, c.id)}
                  </td>
                ))}
                <td>
                  <strong>{r.promedio != null ? Number(r.promedio).toFixed(2) : '—'}</strong>
                </td>
                <td>{formatDateTime(r.fecha)}</td>
                <td>
                  <RowActionsMenu
                    actions={[
                      { label: 'Editar', icon: <Pencil size={16} />, show: canAdmin && r.id_proyecto != null, onClick: () => setEditar(r) },
                      { label: 'Eliminar', icon: <Trash2 size={16} />, show: canAdmin, onClick: () => setAEliminar(r) },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editar && (
        <EncuestaDialog
          open
          tipo={editar.tipo}
          persona={{ id: personaId, nombre }}
          proyecto={{ id: editar.id_proyecto ?? 0, nombre: editar.proyecto_nombre ?? null }}
          onClose={() => setEditar(null)}
        />
      )}

      <ConfirmDialog
        open={aEliminar != null}
        title="Eliminar evaluación"
        confirmLabel="Eliminar"
        busy={eliminarMut.isPending}
        onCancel={() => setAEliminar(null)}
        onConfirm={doEliminar}
      >
        <p>
          ¿Confirmas que deseas eliminar la evaluación con ID <strong>{aEliminar?.id}</strong>?
        </p>
      </ConfirmDialog>
    </div>
  );
}
