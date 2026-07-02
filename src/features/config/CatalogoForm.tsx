import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useCatalogo, useSaveCatalogo } from './hooks';
import type { CatalogoRow, CatalogoTabla } from './api';
import { useAuth } from '@/features/auth/useAuth';
import { useRole } from '@/features/auth/useRole';

export interface CatalogoField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'checkbox' | 'select' | 'date' | 'datetime';
  options?: string[];
  required?: boolean;
  maxLength?: number;
  colSpan2?: boolean;
}

type FieldValue = string | boolean;

/** Gating de escritura de catálogos = policies 0028 (ROLE_ADMIN/SUPER/SUPER BP). */
const CATALOGO_WRITE_ROLES = ['ROLE_ADMIN', 'SUPERADMINISTRADOR', 'SUPERADMINISTRADOR BP'];

/**
 * Formulario genérico de catálogo (crear/editar) dirigido por `fields`.
 * Escritura por PostgREST directo (gated por RLS 0028). Reutilizable por
 * faena/cargo/articulo/tipo_equipo y futuros catálogos.
 */
export function CatalogoForm({
  tabla,
  singular,
  fields,
  backTo,
  createExtras,
}: {
  tabla: CatalogoTabla;
  singular: string;
  fields: CatalogoField[];
  backTo: string;
  /** Campos extra a persistir SOLO al crear (p.ej. faena → usuario_sistema/fecha_sistema). */
  createExtras?: (login: string) => CatalogoRow;
}) {
  const { id } = useParams();
  const editId = id ? Number(id) : null;
  const isEdit = editId != null;
  const navigate = useNavigate();
  const { hasAnyRole } = useRole();
  const { user } = useAuth();
  const login = user?.email ?? '';

  const { data: existing, isLoading } = useCatalogo(tabla, editId ?? 0);
  const saveMut = useSaveCatalogo(tabla);

  const seed = (): Record<string, FieldValue> => {
    const o: Record<string, FieldValue> = {};
    for (const f of fields) o[f.key] = f.type === 'checkbox' ? false : '';
    return o;
  };
  const [values, setValues] = useState<Record<string, FieldValue>>(seed);

  useEffect(() => {
    if (isEdit && existing) {
      const o: Record<string, FieldValue> = {};
      for (const f of fields) {
        const v = existing[f.key];
        if (f.type === 'checkbox') o[f.key] = Boolean(v);
        else if (f.type === 'date') o[f.key] = v ? String(v).slice(0, 10) : '';
        else if (f.type === 'datetime') o[f.key] = v ? String(v).slice(0, 16) : '';
        else o[f.key] = v == null ? '' : String(v);
      }
      setValues(o);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existing]);

  const canManage = hasAnyRole(CATALOGO_WRITE_ROLES);
  if (!canManage) {
    return (
      <div className="app-empty-state">
        <p className="app-empty-state__title">No tienes permisos</p>
        para crear o editar {singular}.
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

  const set = (key: string, v: FieldValue) => setValues((prev) => ({ ...prev, [key]: v }));

  const requiredOk = fields.every((f) => !f.required || String(values[f.key] ?? '').trim() !== '');
  const canSave = requiredOk && !saveMut.isPending;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    const row: CatalogoRow = {};
    for (const f of fields) {
      const raw = values[f.key];
      if (f.type === 'checkbox') row[f.key] = Boolean(raw);
      else if (f.type === 'number') row[f.key] = raw === '' ? null : Number(raw);
      else row[f.key] = raw === '' ? null : (raw as string);
    }
    if (!isEdit && createExtras) Object.assign(row, createExtras(login));
    try {
      await saveMut.mutateAsync({ id: editId, row });
      toast.success(isEdit ? 'Registro actualizado.' : 'Registro creado.');
      navigate(backTo);
    } catch (err) {
      toast.error(`No se pudo guardar: ${(err as Error).message}`);
    }
  };

  return (
    <div>
      <ol className="app-breadcrumb">
        <li>
          <Link to={backTo}>{singular.charAt(0).toUpperCase() + singular.slice(1)}s</Link>
        </li>
        <li className="active">· {isEdit ? 'Editar' : 'Nuevo'}</li>
      </ol>

      <div className="app-page-header">
        <div className="app-page-header__main">
          <div>
            <h1 className="app-page-title">
              {isEdit ? 'Editar' : 'Nuevo'} {singular}
            </h1>
          </div>
        </div>
        <div className="app-page-header__actions">
          <Link to={backTo} className="btn btn-secondary">
            <ArrowLeft size={16} /> Volver
          </Link>
        </div>
      </div>

      <form className="app-card" onSubmit={onSubmit}>
        <div className="app-card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key} className={`app-field ${f.colSpan2 || f.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                {f.type === 'checkbox' ? (
                  <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(values[f.key])}
                      onChange={(e) => set(f.key, e.target.checked)}
                    />
                    <span className="app-field__label" style={{ margin: 0 }}>
                      {f.label}
                    </span>
                  </label>
                ) : (
                  <>
                    <label className="app-field__label">
                      {f.label}
                      {f.required ? ' *' : ''}
                    </label>
                    {f.type === 'textarea' ? (
                      <textarea
                        className="app-field__control"
                        rows={3}
                        maxLength={f.maxLength ?? 500}
                        value={String(values[f.key] ?? '')}
                        onChange={(e) => set(f.key, e.target.value)}
                      />
                    ) : f.type === 'select' ? (
                      <select
                        className="app-field__control"
                        value={String(values[f.key] ?? '')}
                        onChange={(e) => set(f.key, e.target.value)}
                      >
                        <option value="">Selecciona…</option>
                        {(f.options ?? []).map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={
                          f.type === 'number'
                            ? 'number'
                            : f.type === 'date'
                              ? 'date'
                              : f.type === 'datetime'
                                ? 'datetime-local'
                                : 'text'
                        }
                        className="app-field__control"
                        maxLength={f.type === 'text' ? (f.maxLength ?? 150) : undefined}
                        value={String(values[f.key] ?? '')}
                        onChange={(e) => set(f.key, e.target.value)}
                      />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="app-modal__footer" style={{ borderTop: '1px solid var(--app-border)' }}>
          <Link to={backTo} className="btn btn-segundo">
            Cancelar
          </Link>
          <button type="submit" className="btn btn-primary" disabled={!canSave}>
            <Save size={16} /> {saveMut.isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
