import { Link, useParams } from 'react-router-dom';
import { Loader2, Pencil } from 'lucide-react';
import { usePersona } from './hooks';
import { formatRut, formatDate } from '@/lib/utils';

/** Exportado como `Component` para el `lazy` del router. */
export function Component() {
  const { id } = useParams();
  const personaId = Number(id);
  const { data: p, isLoading, isError } = usePersona(personaId);

  if (isLoading) {
    return (
      <div className="app-empty-state">
        <Loader2 className="mx-auto animate-spin" size={24} />
      </div>
    );
  }
  if (isError || !p) {
    return (
      <div>
        <div className="app-empty-state">
          <p className="app-empty-state__title">No se encontró la persona</p>
          o no tienes permisos para verla.
        </div>
        <div style={{ textAlign: 'center' }}>
          <Link to="/persona" className="btn btn-secondary">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  const inicial = (p.nombre_completo ?? '?').trim().charAt(0) || '?';
  const fields: { label: string; value: string | null }[] = [
    { label: 'RUT', value: formatRut(p.numero_id) },
    { label: 'Tipo ID', value: p.tipo_id },
    { label: 'Empresa', value: p.empresa },
    { label: 'Cargo', value: p.cargo },
    { label: 'Email', value: p.email },
    { label: 'Teléfono', value: p.telefono },
    { label: 'Móvil', value: p.movil },
    { label: 'Dirección', value: p.direccion },
    { label: 'Nacionalidad', value: p.nacionalidad },
    { label: 'Género', value: p.genero },
    { label: 'Estado civil', value: p.estado_civil },
    { label: 'Fecha nacimiento', value: formatDate(p.fecha_nacimiento) },
    { label: 'Región', value: p.region },
    { label: 'Comuna', value: p.comuna },
  ];

  return (
    <div>
      <div className="app-page-header">
        <div className="app-page-header__main">
          <div className="app-avatar app-avatar--lg">{inicial}</div>
          <div>
            <h1 className="app-page-title">{p.nombre_completo}</h1>
            <p className="app-page-subtitle">
              {formatRut(p.numero_id)} · ID interno {p.id}
            </p>
          </div>
        </div>
        <div className="app-page-header__actions">
          <Link to="/persona" className="btn btn-secondary">
            Volver
          </Link>
          <Link to={`/persona/${p.id}/editar`} className="btn btn-primary">
            <Pencil size={16} /> Editar
          </Link>
        </div>
      </div>

      <div className="app-card">
        <div className="app-card-header">
          <h4>Ficha</h4>
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
