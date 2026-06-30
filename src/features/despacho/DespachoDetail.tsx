import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuditoria, useDespacho, useTrabajadores, useUpdateEstadoDespacho } from './hooks';
import { ESTADOS_DESPACHO } from './api';
import { EstadoPill } from './DespachoList';
import { formatDate, formatDateTime } from '@/lib/utils';

/** Exportado como `Component` para el `lazy` del router. */
export function Component() {
  const { id } = useParams();
  const despachoId = Number(id);
  const { data: d, isLoading, isError } = useDespacho(despachoId);
  const { data: trabajadores } = useTrabajadores(despachoId);
  const { data: auditoria } = useAuditoria(despachoId);
  const updateEstado = useUpdateEstadoDespacho();

  const [estado, setEstado] = useState('');
  useEffect(() => {
    if (d?.estado) setEstado(d.estado);
  }, [d?.estado]);

  if (isLoading) {
    return (
      <div className="app-empty-state">
        <Loader2 className="mx-auto animate-spin" size={24} />
      </div>
    );
  }
  if (isError || !d) {
    return (
      <div>
        <div className="app-empty-state">
          <p className="app-empty-state__title">No se encontró el despacho</p>
          o no tienes permisos.
        </div>
        <div style={{ textAlign: 'center' }}>
          <Link to="/despacho" className="btn btn-secondary">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  const onSave = async () => {
    if (estado === d.estado) return;
    await updateEstado.mutateAsync({ id: despachoId, estado });
    toast.success('Estado actualizado (queda registrado en auditoría)');
  };

  return (
    <div>
      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">{d.nombre_despacho ?? `Despacho #${d.id}`}</h1>
            <p className="app-page-subtitle">
              Fecha {formatDate(d.fecha_despacho)} · Proyecto {d.id_proyecto ?? '—'}
            </p>
          </div>
        </div>
        <div className="app-page-header__actions">
          <Link to="/despacho" className="btn btn-secondary">
            Volver
          </Link>
        </div>
      </div>

      <div className="app-card">
        <div className="app-card-header">
          <h4>Estado</h4>
        </div>
        <div className="app-card-body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--app-space-3)', flexWrap: 'wrap' }}>
          <EstadoPill estado={d.estado} />
          <span style={{ color: 'var(--app-text-muted)' }}>→</span>
          <select
            className="app-field__control"
            style={{ maxWidth: 200 }}
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            {ESTADOS_DESPACHO.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={onSave}
            disabled={estado === d.estado || updateEstado.isPending}
          >
            {updateEstado.isPending ? 'Guardando…' : 'Cambiar estado'}
          </button>
        </div>
      </div>

      <div className="app-card">
        <div className="app-card-header">
          <h4>Trabajadores ({trabajadores?.length ?? 0})</h4>
        </div>
        <div className="app-card-body">
          {!trabajadores || trabajadores.length === 0 ? (
            <p style={{ color: 'var(--app-text-muted)', margin: 0 }}>Sin trabajadores.</p>
          ) : (
            <div className="app-table-wrap" style={{ marginBottom: 0 }}>
              <table className="app-table app-table--hover">
                <thead>
                  <tr>
                    <th>Persona</th>
                    <th>ID</th>
                  </tr>
                </thead>
                <tbody>
                  {trabajadores.map((t) => (
                    <tr key={t.id}>
                      <td>{t.persona ?? `Persona #${t.id_persona ?? '—'}`}</td>
                      <td>{t.id_persona ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="app-card">
        <div className="app-card-header">
          <h4>Auditoría de estados</h4>
        </div>
        <div className="app-card-body">
          {!auditoria || auditoria.length === 0 ? (
            <p style={{ color: 'var(--app-text-muted)', margin: 0 }}>Sin cambios registrados.</p>
          ) : (
            <div className="app-table-wrap" style={{ marginBottom: 0 }}>
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Anterior</th>
                    <th>Nuevo</th>
                    <th>Usuario</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {auditoria.map((a) => (
                    <tr key={a.id}>
                      <td>{a.estado_anterior ?? '—'}</td>
                      <td>{a.estado_nuevo ?? '—'}</td>
                      <td>{a.usuario ?? '—'}</td>
                      <td>{formatDateTime(a.fecha)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
