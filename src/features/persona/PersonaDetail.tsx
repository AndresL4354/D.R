import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  ClipboardList,
  Download,
  FileDown,
  FolderOpen,
  IdCard,
  Loader2,
  Mail,
  MessageCircle,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePersona, usePersonaExtras } from './hooks';
import { formatRut, formatDate } from '@/lib/utils';

/** Exportado como `Component` para el `lazy` del router. Clon de persona-detail.component.html. */
export function Component() {
  const { id } = useParams();
  const personaId = Number(id);
  const { data: p, isLoading, isError } = usePersona(personaId);
  const { data: extras } = usePersonaExtras(personaId);
  const [tipoDoc, setTipoDoc] = useState('');

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
  const cargos = extras?.cargos ?? [];
  const empresas = extras?.empresas ?? [];
  const tiposDoc = extras?.tiposDoc ?? [];

  const telDigits = (p.telefono ?? '').replace(/\D/g, '');
  const waHref = telDigits ? `https://wa.me/${telDigits.length === 9 ? '56' + telDigits : telDigits}` : null;
  const stub = () => toast.info('Generación de documentos disponible en Fase 5.');

  const fields: { label: string; value: string | null }[] = [
    { label: 'Nombre completo', value: p.nombre_completo },
    { label: 'Tipo identificación', value: p.tipo_id },
    { label: 'Número identificación', value: formatRut(p.numero_id) },
    { label: 'Fecha de nacimiento', value: formatDate(p.fecha_nacimiento) },
    { label: 'País', value: p.pais },
    { label: 'Región', value: p.region },
    { label: 'Comuna', value: p.comuna },
    { label: 'Dirección', value: p.direccion },
    { label: 'Teléfono', value: p.telefono },
    { label: 'Correo', value: p.email },
    { label: 'Nacionalidad', value: p.nacionalidad },
    { label: 'Género', value: p.genero },
    { label: 'Estado civil', value: p.estado_civil },
    { label: 'Teléfono emergencia', value: p.telefono_emergencia },
    { label: 'Cargo', value: cargos.length ? cargos.join(', ') : p.cargo },
    { label: 'Empresas', value: empresas.length ? empresas.join(', ') : p.empresa },
    { label: 'Licencia conducción', value: p.licencia_conduccion },
    { label: 'Estado', value: p.estado_persona },
  ];

  return (
    <div>
      <ul className="app-breadcrumb">
        <li>
          <Link to="/persona">Personas</Link>
        </li>
        <li aria-hidden>›</li>
        <li className="active">Detalle</li>
      </ul>

      <div className="app-page-header">
        <div className="app-page-header__main">
          <div className="app-avatar app-avatar--lg">{inicial}</div>
          <div className="min-w-0">
            <h1 className="app-page-title">{p.nombre_completo}</h1>
            <p className="app-page-subtitle">
              Rut: <strong style={{ color: 'var(--app-text)' }}>{formatRut(p.numero_id)}</strong>
              {cargos.length > 0 && <> · {cargos.join(', ')}</>}
            </p>
          </div>
        </div>
      </div>

      {/* Barra de acciones (clon de la action bar real) */}
      <div className="app-action-bar app-action-bar--bordered" style={{ justifyContent: 'flex-start', marginTop: 0 }}>
        <Link to="/persona" className="btn btn-secondary">
          <ArrowLeft size={16} /> Volver
        </Link>
        {waHref && (
          <a className="btn-icon btn-icon--success" href={waHref} target="_blank" rel="noreferrer" title="WhatsApp">
            <MessageCircle size={18} />
          </a>
        )}
        {p.email && (
          <a className="btn-icon btn-icon--primary" href={`mailto:${p.email}`} title="Correo">
            <Mail size={18} />
          </a>
        )}
        <button type="button" className="btn btn-secondary" onClick={stub}>
          <Download size={16} /> Descargar documentos
        </button>
        <Link to={`/persona/${p.id}/documentos`} className="btn btn-secondary">
          <FolderOpen size={16} /> Documentos
        </Link>
        <Link to={`/persona/${p.id}/evaluaciones`} className="btn btn-secondary">
          <ClipboardList size={16} /> Ver evaluaciones
        </Link>
        <Link to={`/persona/${p.id}/servicios`} className="btn btn-secondary">
          <Briefcase size={16} /> Servicios
        </Link>
        <Link to={`/persona/${p.id}/editar`} className="btn btn-primary">
          <Pencil size={16} /> Editar
        </Link>
      </div>

      {/* Descargar por tipo de documento */}
      <div className="app-card">
        <div className="app-card-header">
          <FileDown className="app-card-header__icon" size={18} />
          <h4>Descargar por tipo de documento</h4>
        </div>
        <div className="app-card-body">
          <div className="flex flex-wrap items-end gap-3">
            <div className="app-field min-w-[280px] flex-1">
              <select
                className="app-field__control"
                value={tipoDoc}
                onChange={(e) => setTipoDoc(e.target.value)}
              >
                <option value="">Tipo de documento</option>
                {tiposDoc.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="btn btn-secondary" onClick={stub} disabled={!tipoDoc}>
              <Download size={16} /> Descargar
            </button>
          </div>
        </div>
      </div>

      {/* Información personal */}
      <div className="app-card">
        <div className="app-card-header">
          <IdCard className="app-card-header__icon" size={18} />
          <h4>Información personal</h4>
        </div>
        <div className="app-card-body">
          <dl className="grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2">
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
