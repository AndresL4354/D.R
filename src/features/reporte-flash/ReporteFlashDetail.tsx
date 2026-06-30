import { Link, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useReporteFlash } from './hooks';
import { formatDate } from '@/lib/utils';

export function Component() {
  const { id } = useParams();
  const rfId = Number(id);
  const { data: r, isLoading, isError } = useReporteFlash(rfId);

  if (isLoading) {
    return (
      <div className="app-empty-state">
        <Loader2 className="mx-auto animate-spin" size={24} />
      </div>
    );
  }
  if (isError || !r) {
    return (
      <div>
        <div className="app-empty-state">
          <p className="app-empty-state__title">No se encontró el reporte</p>
          o no tienes permisos (solo admin por ahora).
        </div>
        <div style={{ textAlign: 'center' }}>
          <Link to="/reporte-flash" className="btn btn-secondary">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  const fields: { label: string; value: string | null }[] = [
    { label: 'Fecha incidente', value: formatDate(r.fecha_incidente) },
    { label: 'Clasificación', value: r.clasificacion },
    { label: 'Faena', value: r.faena },
    { label: 'Empresa cliente', value: r.empresa_cliente },
    { label: 'Estado', value: r.estado },
    { label: 'Potencial', value: r.potencial },
    { label: 'Lesión', value: r.lesion == null ? null : r.lesion ? 'Sí' : 'No' },
    { label: 'Parte del cuerpo', value: r.parte_cuerpo_afectada },
    { label: 'Tipo actividad', value: r.tipo_actividad },
    { label: 'Actividad específica', value: r.actividad_especifica },
    { label: 'Reportado por', value: r.reportado_por },
    { label: 'Supervisor', value: r.nombre_supervisor },
    { label: 'Revisor', value: r.nombre_revisor },
    { label: 'Fecha compromiso', value: formatDate(r.fecha_compromiso) },
    { label: 'Fecha cierre', value: formatDate(r.fecha_cierre) },
  ];

  return (
    <div>
      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">Reporte Flash #{r.id}</h1>
            <p className="app-page-subtitle">
              {r.clasificacion ?? '—'} · {formatDate(r.fecha_incidente)}
            </p>
          </div>
        </div>
        <div className="app-page-header__actions">
          {r.is_riesgo_fatalidad && <span className="app-badge app-badge--danger">Riesgo fatalidad</span>}
          {r.alto_potencial && <span className="app-badge app-badge--warning">Alto potencial</span>}
          <Link to="/reporte-flash" className="btn btn-secondary">
            Volver
          </Link>
        </div>
      </div>

      <div className="app-card">
        <div className="app-card-header">
          <h4>Datos del incidente</h4>
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

      <div className="app-card">
        <div className="app-card-header">
          <h4>Descripción del evento</h4>
        </div>
        <div className="app-card-body">
          <p style={{ whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.6 }}>
            {r.descripcion_evento || '—'}
          </p>
        </div>
      </div>

      <div className="app-card">
        <div className="app-card-header">
          <h4>Medidas inmediatas</h4>
        </div>
        <div className="app-card-body">
          <p style={{ whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.6 }}>
            {r.medidas_inmediatas_ejecutadas || '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
