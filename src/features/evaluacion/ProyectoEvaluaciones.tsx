import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { TIPOS_EVALUACION, type EvaluacionFilaRow } from './api';
import { useEvaluacionesProyecto, usePreguntasPorTipo } from './hooks';
import { useProyecto } from '@/features/proyecto/hooks';
import { formatDateTime, formatRut } from '@/lib/utils';

function respuestaDe(row: EvaluacionFilaRow, idPregunta: number): string {
  return row.respuestas.find((r) => r.id_pregunta === idPregunta)?.respuesta ?? '—';
}

/** Exportado como `Component` para el `lazy` del router. Evaluaciones de un proyecto (solo lectura, clon proyecto/evaluaciones). */
export function Component() {
  const { id } = useParams();
  const proyectoId = Number(id);
  const [tipo, setTipo] = useState('NORMAL');
  const { data: proyecto } = useProyecto(proyectoId);
  const { data: preguntas } = usePreguntasPorTipo(tipo);
  const { data: filas, isLoading } = useEvaluacionesProyecto(proyectoId, tipo);

  const rows = filas ?? [];
  const cols = preguntas ?? [];
  const nombre = proyecto?.nombre ?? `Servicio #${proyectoId}`;

  return (
    <div>
      <ol className="app-breadcrumb">
        <li>
          <Link to="/proyecto">Servicios</Link>
        </li>
        <li>
          <Link to={`/proyecto/${proyectoId}`}>{nombre}</Link>
        </li>
        <li className="active">· Evaluaciones</li>
      </ol>

      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Evaluaciones del servicio</h1>
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
          <Link to={`/proyecto/${proyectoId}`} className="btn btn-secondary">
            <ArrowLeft size={16} /> Volver
          </Link>
        </div>
      </div>

      <div className="app-table-wrap">
        <table className="app-table app-table--hover">
          <thead>
            <tr>
              <th>Persona</th>
              <th>RUT</th>
              <th>Cargo</th>
              {cols.map((c) => (
                <th key={c.id} title={c.pregunta ?? ''}>
                  {c.titulo || c.pregunta}
                </th>
              ))}
              <th>Total</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={cols.length + 5}>
                  <div className="app-empty-state">
                    <Loader2 className="mx-auto animate-spin" size={22} />
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={cols.length + 5}>
                  <div className="app-empty-state">
                    <p className="app-empty-state__title">No se encontraron evaluaciones</p>
                  </div>
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link to={`/persona/${r.id_persona}`} className="font-semibold text-foreground hover:underline">
                    {r.persona_nombre ?? '—'}
                  </Link>
                </td>
                <td>{formatRut(r.num_id ?? null)}</td>
                <td>{r.cargo ?? '—'}</td>
                {cols.map((c) => (
                  <td key={c.id} style={{ textAlign: 'center' }}>
                    {respuestaDe(r, c.id)}
                  </td>
                ))}
                <td>
                  <strong>{r.promedio != null ? Number(r.promedio).toFixed(2) : '—'}</strong>
                </td>
                <td>{formatDateTime(r.fecha)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
