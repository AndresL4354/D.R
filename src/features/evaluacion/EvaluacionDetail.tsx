import { Link, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useEvaluacion } from './hooks';
import { formatDate } from '@/lib/utils';

export function Component() {
  const { id } = useParams();
  const evalId = Number(id);
  const { data: e, isLoading, isError } = useEvaluacion(evalId);

  if (isLoading) {
    return (
      <div className="app-empty-state">
        <Loader2 className="mx-auto animate-spin" size={24} />
      </div>
    );
  }
  if (isError || !e) {
    return (
      <div>
        <div className="app-empty-state">
          <p className="app-empty-state__title">No se encontró la evaluación</p>
          o no tienes permisos.
        </div>
        <div style={{ textAlign: 'center' }}>
          <Link to="/evaluacion" className="btn btn-secondary">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  const fields: { label: string; value: string | null }[] = [
    { label: 'Trabajador', value: e._persona },
    { label: 'Servicio', value: e._proyecto },
    { label: 'Fecha', value: formatDate(e.fecha) },
    { label: 'Tipo', value: e.tipo },
    { label: 'Promedio', value: e.promedio != null ? e.promedio.toFixed(2) : null },
    { label: 'Horas vertical', value: e.horas_vertical != null ? String(e.horas_vertical) : null },
    { label: 'Observación', value: e.observacion },
    { label: 'Mejora', value: e.mejora },
    { label: 'Petición', value: e.peticion },
    { label: 'Comentario', value: e.comentario },
  ];

  return (
    <div>
      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Evaluación #{e.id}</h1>
            <p className="app-page-subtitle">
              {e._persona ?? '—'} · {formatDate(e.fecha)}
            </p>
          </div>
        </div>
        <div className="app-page-header__actions">
          <Link to="/evaluacion" className="btn btn-secondary">
            Volver
          </Link>
        </div>
      </div>

      <div className="app-card">
        <div className="app-card-header">
          <h4>Detalle de la evaluación</h4>
        </div>
        <div className="app-card-body">
          <dl className="app-detail-list">
            {fields.map((f) => (
              <div key={f.label} className="app-detail-list__item">
                <dt>{f.label}</dt>
                <dd>{f.value || '—'}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
