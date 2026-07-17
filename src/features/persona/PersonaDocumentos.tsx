import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { differenceInDays, format, parseISO, startOfDay } from 'date-fns';
import {
  Ban,
  Download,
  Eye,
  FolderOpen,
  Gavel,
  GraduationCap,
  IdCard,
  Pencil,
  Save,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useDocumentosCategoria, useIdsCargoPersona, usePersona } from './hooks';
import {
  eliminarDocumentoPersona,
  esDocumentoStorage,
  guardarFechaDocumento,
  guardarResultadoDocumento,
  limpiarDocumentosHuerfanos,
  subirDocumentoPersona,
  urlDocumentoPersona,
  type CategoriaDocumento,
  type DocumentoPersonaRow,
  type DocumentoRequeridoRow,
} from './api';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { RowActionsMenu } from '@/components/common/RowActionsMenu';
import { useRole } from '@/features/auth/useRole';

/**
 * Sub-página "Documentos" de la ficha (clon de persona/documentos/
 * documento-persona.component): 4 cards (Generales/Cursos/Acreditación/
 * Legales) con la misma tabla de 6 columnas que mezcla docs subidos con
 * placeholders (id 0) de los requeridos por los cargos de la persona.
 * Semáforo client-side (umbral 45 días; 45 exacto SIN icono — quirk fiel;
 * icono PNG 23x25 position:absolute, no fondo de celda). Un ÚNICO date-input
 * compartido entre todas las filas sin fecha (quirk fiel). Menú Editar/
 * Eliminar gateado por rol SOLO en Generales (asimetría fiel). Eliminar va
 * sin confirmación y se dispara incluso con id 0 (fiel). El botón Guardar
 * solo limpia huérfanos y navega atrás (fiel).
 * Subir y ver PDF funcionan contra Supabase Storage (0034) para documentos
 * nuevos; los 48k registros LEGACY siguen sin binario (migración Fase 8) y
 * su "ver" muestra el aviso. Descargar documentos ZIP sigue stub (Fase 5).
 */

interface DocUi extends DocumentoPersonaRow {
  semaforo: string | null;
  titulo: string | null;
}

const CARDS: Array<{
  categoria: CategoriaDocumento;
  titulo: string;
  Icon: typeof FolderOpen;
  metaSufijo: string;
  /** Solo la tabla de Generales gatea Editar/Eliminar por rol (quirk fiel). */
  menuGateado: boolean;
}> = [
  { categoria: 'Documentos generales', titulo: 'Documentos generales', Icon: FolderOpen, metaSufijo: 'documento(s)', menuGateado: true },
  { categoria: 'Cursos', titulo: 'Cursos', Icon: GraduationCap, metaSufijo: 'curso(s)', menuGateado: false },
  { categoria: 'Documentos de acreditacion', titulo: 'Documentos de acreditación', Icon: IdCard, metaSufijo: 'documento(s)', menuGateado: false },
  { categoria: 'Documentos legales', titulo: 'Documentos legales', Icon: Gavel, metaSufijo: 'documento(s)', menuGateado: false },
];

/** Roles que suben/editan fecha y ven el Guardar (jhiHasAnyAuthority fiel). */
const ROLES_EDITAR = ['ROLE_ADMIN', 'VALIDADOR_RRHH', 'ENCARGADO_RRHH'];
/** Roles del lápiz "resultado" (lista de 8, incluye 'SUPERADMINISTRADOR BP'). */
const ROLES_RESULTADO = [
  'ROLE_ADMIN',
  'SUPERADMINISTRADOR',
  'SUPERADMINISTRADOR BP',
  'SUPERVISOR',
  'OPERACIONES',
  'RRHH',
  'SSO',
  'ENCARGADO_RRHH',
];

function placeholder(req: DocumentoRequeridoRow): DocUi {
  // Placeholder estándar del original: id 0, sin fecha ni semáforo.
  return {
    id: 0,
    nombre_documento: req.nombre,
    vencido: false,
    fecha_vencimiento: null,
    tipo_documento: null,
    valor_resultado: null,
    tipo_resultado: null,
    documento: null,
    semaforo: null,
    titulo: null,
  };
}

/** Semáforo fiel (asignarSemaforoLista): <=0 Rojo · <45 Amarillo · >45 Verde ·
 *  45 EXACTO sin icono (hueco del original) · títulos sin cerrar paréntesis. */
function conSemaforo(d: DocUi): DocUi {
  const out: DocUi = { ...d, semaforo: null, titulo: null };
  if (d.fecha_vencimiento) {
    const diferencia = differenceInDays(parseISO(d.fecha_vencimiento), startOfDay(new Date()));
    if (diferencia <= 0) {
      out.semaforo = 'Rojo';
      out.titulo = `Documento Vencido (${diferencia} días`;
      out.vencido = true;
    } else if (diferencia < 45) {
      out.semaforo = 'Amarillo';
      out.titulo = `Documento por Vencer (${diferencia} días`;
    } else if (diferencia > 45) {
      out.semaforo = 'Verde';
      out.titulo = `Documento Vigente (${diferencia} días`;
    }
  } else {
    out.semaforo = '';
  }
  return out;
}

/** Merge servidor + placeholders (consultarDocumentosXPersona fiel). */
function mergeCategoria(docs: DocumentoPersonaRow[], requeridos: DocumentoRequeridoRow[]): DocUi[] {
  const base: DocUi[] = docs.map((d) => ({ ...d, semaforo: null, titulo: null }));
  if (base.length === 0) {
    // Sin docs del server: solo placeholders, SIN pasar el semáforo (fiel).
    return requeridos.map(placeholder);
  }
  for (const req of requeridos) {
    if (!base.some((x) => x.nombre_documento === req.nombre)) base.push(placeholder(req));
  }
  return base.map(conSemaforo);
}

const claseSemaforo = (s: string | null): string | undefined =>
  s === 'Rojo' ? 'clase-rojo' : s === 'Amarillo' ? 'clase-amarillo' : s === 'Verde' ? 'clase-verde' : undefined;

/** Exportado como `Component` para el `lazy` del router. */
export function Component() {
  const { id } = useParams();
  const personaId = Number(id);
  const qc = useQueryClient();
  const { hasRole, hasAnyRole } = useRole();
  const canEditar = hasAnyRole(ROLES_EDITAR);
  const canResultado = hasAnyRole(ROLES_RESULTADO);
  const soloPublicos = !hasRole('DOC_PRIVADO');

  const { data: persona } = usePersona(personaId);
  const { data: idsCargo } = useIdsCargoPersona(personaId);

  const qGenerales = useDocumentosCategoria(personaId, 'Documentos generales', soloPublicos, idsCargo);
  const qCursos = useDocumentosCategoria(personaId, 'Cursos', soloPublicos, idsCargo);
  const qAcred = useDocumentosCategoria(personaId, 'Documentos de acreditacion', soloPublicos, idsCargo);
  const qLegales = useDocumentosCategoria(personaId, 'Documentos legales', soloPublicos, idsCargo);
  const queries = useMemo(
    () =>
      ({
        'Documentos generales': qGenerales,
        Cursos: qCursos,
        'Documentos de acreditacion': qAcred,
        'Documentos legales': qLegales,
      }) as const,
    [qGenerales, qCursos, qAcred, qLegales],
  );

  // Listas mutables por categoría (el original las manipula in-place).
  const [listas, setListas] = useState<Record<CategoriaDocumento, DocUi[]>>({
    'Documentos generales': [],
    Cursos: [],
    'Documentos de acreditacion': [],
    'Documentos legales': [],
  });
  useEffect(() => {
    if (qGenerales.data)
      setListas((p) => ({ ...p, 'Documentos generales': mergeCategoria(qGenerales.data.docs, qGenerales.data.requeridos) }));
  }, [qGenerales.data]);
  useEffect(() => {
    if (qCursos.data) setListas((p) => ({ ...p, Cursos: mergeCategoria(qCursos.data.docs, qCursos.data.requeridos) }));
  }, [qCursos.data]);
  useEffect(() => {
    if (qAcred.data)
      setListas((p) => ({ ...p, 'Documentos de acreditacion': mergeCategoria(qAcred.data.docs, qAcred.data.requeridos) }));
  }, [qAcred.data]);
  useEffect(() => {
    if (qLegales.data)
      setListas((p) => ({ ...p, 'Documentos legales': mergeCategoria(qLegales.data.docs, qLegales.data.requeridos) }));
  }, [qLegales.data]);

  // Un ÚNICO control de fecha compartido por TODAS las filas sin fecha (fiel).
  const [fechaCompartida, setFechaCompartida] = useState('');
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Diálogos
  const [docEditar, setDocEditar] = useState<{ doc: DocUi; categoria: CategoriaDocumento } | null>(null);
  const [fechaEdit, setFechaEdit] = useState('');
  const [docResultado, setDocResultado] = useState<{ doc: DocUi; categoria: CategoriaDocumento } | null>(null);
  const [valorResultado, setValorResultado] = useState('');

  const actualizarFila = (categoria: CategoriaDocumento, idx: number, cambios: Partial<DocUi>) =>
    setListas((p) => ({
      ...p,
      [categoria]: p[categoria].map((d, i) => (i === idx ? { ...d, ...cambios } : d)),
    }));

  // Localiza la fila por identidad (id + nombre) y no por referencia: un
  // re-merge de fondo crea objetos nuevos y dejaría obsoleta la referencia
  // capturada al abrir un diálogo.
  const indiceDe = (categoria: CategoriaDocumento, doc: DocUi) =>
    listas[categoria].findIndex(
      (d) => d.id === doc.id && d.nombre_documento === doc.nombre_documento,
    );

  // --- Acciones ---

  const validarFechaCompartida = (v: string) => {
    setFechaCompartida(v);
    if (!v) setAlertMsg('La fecha ingresada no es válida.');
  };

  // Quirk fiel de clearFileInput(): limpia el PRIMER input file del DOM (no
  // necesariamente el usado) — con fecha inválida en una fila que no es la
  // primera, el input usado conserva el archivo elegido.
  const clearFileInput = () => {
    const el = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (el) el.value = '';
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>, doc: DocUi, categoria: CategoriaDocumento) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validaciones fieles al original (fecha primero, luego tipo PDF):
    if (!fechaCompartida) {
      setAlertMsg('La fecha ingresada no es válida.');
      clearFileInput();
      return;
    }
    if (file.type !== 'application/pdf') {
      toast.warning('Solo se permiten archivos pdf');
      return; // el original NO limpia el input en este caso (quirk)
    }
    // Subida real (Storage + fila con fecha). Al terminar se re-consulta la
    // categoría: la fila llega del server con fecha y semáforo recalculado.
    // (No replicamos el splice destructivo transitorio de isArrayModificado.)
    void subirDocumentoPersona(personaId, doc.nombre_documento ?? '', file, fechaCompartida)
      .then(() => {
        void qc.invalidateQueries({ queryKey: ['persona', 'documentos', personaId, categoria] });
      })
      .catch(() => {
        toast.warning('Se presento un error al subir el archivo, intentelo nuevamente');
      })
      .finally(() => clearFileInput());
  };

  const ver = (doc: DocUi) => {
    if (!esDocumentoStorage(doc.documento)) {
      // Registros legacy: la ruta apunta al filesystem del server antiguo.
      toast.info('Los PDF del sistema antiguo aún no están migrados a Storage (Fase 8).');
      return;
    }
    void urlDocumentoPersona(doc.documento!)
      .then((url) => window.open(url))
      .catch(() => toast.warning('Se presento un error al subir en la previsualización del archivo'));
  };

  const descargarDocumentos = () => toast.info('Generación de documentos disponible en Fase 5.');

  const abrirEditar = (doc: DocUi, categoria: CategoriaDocumento) => {
    setFechaEdit(doc.fecha_vencimiento ? format(parseISO(doc.fecha_vencimiento), "yyyy-MM-dd'T'HH:mm") : '');
    setDocEditar({ doc, categoria });
  };

  // editar-doc fiel: muta la fila ANTES del POST, cierra SIEMPRE (éxito o
  // error) y recarga solo la categoría 'generales' (las otras 3 conservan el
  // semáforo viejo — quirk fiel). Con fecha vacía el original muestra
  // 'Invalid Date' en la celda hasta la recarga; aquí la fila vuelve a modo
  // subir de inmediato (el estado final server-side —fecha NULL— es idéntico).
  const confirmarEditar = async () => {
    if (!docEditar) return;
    const { doc, categoria } = docEditar;
    const idx = indiceDe(categoria, doc);
    if (idx >= 0) actualizarFila(categoria, idx, { fecha_vencimiento: fechaEdit || null });
    try {
      await guardarFechaDocumento(doc.id, fechaEdit || null);
    } catch {
      // fiel: el original no muestra error y cierra igual
    }
    setDocEditar(null);
    // Quirk fiel: el original solo recarga Generales si persona.cargo es
    // truthy (condición muerta para personas sin ese campo).
    if (persona?.cargo) {
      void qc.invalidateQueries({
        queryKey: ['persona', 'documentos', personaId, 'Documentos generales'],
      });
    }
  };

  const deleteDoc = (doc: DocUi, categoria: CategoriaDocumento, idx: number) => {
    // Fiel: el DELETE se dispara SIN confirmación e incluso para placeholders
    // (id 0), y los errores se ignoran.
    void eliminarDocumentoPersona(doc.id).catch(() => undefined);
    if (doc.id) {
      // Reset in-place a placeholder conservando nombre (y — quirk fiel —
      // valor_resultado/tipo_resultado NO se limpian).
      actualizarFila(categoria, idx, {
        id: 0,
        fecha_vencimiento: null,
        semaforo: null,
        titulo: null,
        vencido: false,
        tipo_documento: null,
      });
    }
  };

  const abrirResultado = (doc: DocUi, categoria: CategoriaDocumento) => {
    setValorResultado(doc.valor_resultado ?? '');
    setDocResultado({ doc, categoria });
  };

  const confirmarResultado = async () => {
    if (!docResultado) return;
    if (!valorResultado) {
      toast.warning('Debe ingresar un valor para el resultado del documento');
      return;
    }
    const { doc, categoria } = docResultado;
    const idx = indiceDe(categoria, doc);
    if (idx >= 0) actualizarFila(categoria, idx, { valor_resultado: valorResultado });
    try {
      await guardarResultadoDocumento(doc.id, valorResultado);
    } catch {
      // fiel: sin mensaje; el modal cierra igual
    }
    setDocResultado(null);
    // Fiel: al cerrar con 'success' el original re-ejecuta ngOnInit completo.
    void qc.invalidateQueries({ queryKey: ['persona', 'documentos', personaId] });
    void qc.invalidateQueries({ queryKey: ['persona', 'ids-cargo', personaId] });
  };

  // Botón Guardar fiel: NO guarda nada — limpia huérfanos y navega atrás.
  const save = async () => {
    setIsSaving(true);
    try {
      await limpiarDocumentosHuerfanos();
      window.history.back();
    } catch (e) {
      toast.error(`No se pudo completar la operación: ${(e as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const tipoRes = docResultado?.doc.tipo_resultado ?? '';

  return (
    <div className="container-fluid">
      {/* Breadcrumb — el último crumb dice 'Documentos generales' (quirk fiel) */}
      <ol className="app-breadcrumb">
        <li>
          <Link to="/persona">Personas</Link>
        </li>
        <li>›</li>
        <li>
          <Link to={`/persona/${personaId}`}>Ver</Link>
        </li>
        <li>›</li>
        <li className="active">Documentos generales</li>
      </ol>

      <div className="app-page-header">
        <div className="app-page-header__main">
          <h1 className="app-page-title">Documentos</h1>
          <p className="app-page-subtitle">
            <strong>{persona?.nombre_completo}</strong>
            {persona?.numero_id && <span> · {persona.numero_id}</span>}
          </p>
        </div>
        <div className="app-page-header__actions">
          <button type="button" className="btn btn-primary" onClick={descargarDocumentos}>
            <Download size={16} /> Descargar documentos
          </button>
        </div>
      </div>

      {CARDS.map(({ categoria, titulo, Icon, metaSufijo, menuGateado }) => {
        const lista = listas[categoria];
        if (!lista || lista.length === 0) return null; // sin card ni empty-state (fiel)
        const cargando = queries[categoria].isLoading;
        return (
          <div className="app-card" key={categoria}>
            <div className="app-card-header">
              <Icon className="app-card-header__icon" size={18} />
              <h4>{titulo}</h4>
              <span className="app-card-header__meta">
                {lista.length} {metaSufijo}
              </span>
            </div>
            <div className="app-card-body">
              <div className="app-table-wrap">
                <table
                  className="app-table app-table--hover"
                  aria-describedby="page-heading"
                  style={cargando ? { opacity: 0.6 } : undefined}
                >
                  <thead>
                    <tr>
                      <th scope="col">Nombre archivo</th>
                      <th scope="col">Fecha vencimiento</th>
                      <th scope="col">Vigencia</th>
                      <th scope="col">Resultado</th>
                      <th scope="col"></th>
                      <th scope="col" style={{ width: 56 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((doc, i) => (
                      <tr key={`${doc.nombre_documento}-${i}`}>
                        <td>
                          <strong>{doc.nombre_documento}</strong>
                        </td>
                        <td>
                          {doc.fecha_vencimiento ? (
                            format(parseISO(doc.fecha_vencimiento), 'dd/MM/yyyy')
                          ) : canEditar ? (
                            <div className="d-flex">
                              <input
                                type="date"
                                className="app-field__control"
                                value={fechaCompartida}
                                onChange={(e) => validarFechaCompartida(e.target.value)}
                              />
                            </div>
                          ) : null}
                        </td>
                        {/* Celda semáforo: icono PNG position:absolute (fiel) */}
                        <td className={claseSemaforo(doc.semaforo)}></td>
                        <td>
                          {doc.tipo_resultado ? (
                            <div className="flex items-center">
                              {doc.tipo_resultado === 'Porcentaje'
                                ? doc.valor_resultado && <span>{doc.valor_resultado}%</span>
                                : <span>{doc.valor_resultado}</span>}
                              {canResultado && (
                                <Pencil
                                  size={14}
                                  style={{ cursor: 'pointer', marginLeft: '0.5rem' }}
                                  onClick={() => abrirResultado(doc, categoria)}
                                />
                              )}
                            </div>
                          ) : null}
                        </td>
                        <td>
                          {!doc.fecha_vencimiento ? (
                            canEditar ? (
                              <input
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => onFileSelected(e, doc, categoria)}
                              />
                            ) : null
                          ) : (
                            <button
                              type="button"
                              className="btn-icon btn-icon--primary"
                              title={doc.titulo ?? undefined}
                              onClick={() => ver(doc)}
                            >
                              <Eye size={16} />
                            </button>
                          )}
                        </td>
                        <td>
                          <RowActionsMenu
                            actions={[
                              {
                                label: 'Editar',
                                icon: <Pencil size={14} />,
                                onClick: () => abrirEditar(doc, categoria),
                                show: menuGateado ? canEditar : true,
                              },
                              {
                                label: 'Eliminar',
                                icon: <Trash2 size={14} />,
                                onClick: () => deleteDoc(doc, categoria, i),
                                show: menuGateado ? canEditar : true,
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}

      {/* Barra de acciones final */}
      <div className="app-action-bar app-action-bar--bordered">
        <button type="button" className="btn btn-segundo" onClick={() => window.history.back()}>
          <Ban size={16} /> Cancelar
        </button>
        {canEditar && (
          <button type="button" className="btn btn-primary" disabled={isSaving} onClick={save}>
            <Save size={16} /> Guardar
          </button>
        )}
      </div>

      {/* CustomAlertDialog (fecha inválida) */}
      <ConfirmDialog
        open={alertMsg != null}
        title="Error"
        permanent={false}
        danger={false}
        confirmLabel="Aceptar"
        confirmIcon={<Save size={16} />}
        onCancel={() => setAlertMsg(null)}
        onConfirm={() => setAlertMsg(null)}
      >
        <p>{alertMsg}</p>
      </ConfirmDialog>

      {/* editar-doc: 'Actualización de fecha' — un único campo datetime-local,
          sin validación (fecha vacía → null, fiel) */}
      <ConfirmDialog
        open={docEditar != null}
        title="Actualización de fecha"
        permanent={false}
        danger={false}
        confirmLabel="Guardar"
        confirmIcon={<Save size={16} />}
        onCancel={() => setDocEditar(null)}
        onConfirm={confirmarEditar}
      >
        <div className="app-field">
          <label className="app-field__label" htmlFor="field_fechaVencimiento">
            Fecha de vencimiento
          </label>
          <input
            id="field_fechaVencimiento"
            type="datetime-local"
            className="app-field__control"
            value={fechaEdit}
            onChange={(e) => setFechaEdit(e.target.value)}
          />
        </div>
      </ConfirmDialog>

      {/* Modificar resultado — input según tipo_resultado (Color/Porcentaje/Número) */}
      <ConfirmDialog
        open={docResultado != null}
        title="Modificar resultado"
        permanent={false}
        danger={false}
        confirmLabel="Guardar"
        confirmIcon={<Save size={16} />}
        onCancel={() => setDocResultado(null)}
        onConfirm={confirmarResultado}
      >
        <div className="app-field">
          <label className="app-field__label">Resultado</label>
          {tipoRes === 'Color' ? (
            <select
              className="app-field__control"
              value={valorResultado}
              onChange={(e) => setValorResultado(e.target.value)}
            >
              <option value="">Seleccione…</option>
              <option value="Verde">Verde</option>
              <option value="Amarillo">Amarillo</option>
              <option value="Rojo">Rojo</option>
            </select>
          ) : (
            <div className="flex items-center" style={{ gap: 'var(--app-space-2)' }}>
              <input
                type="number"
                step={0.1}
                min={tipoRes === 'Porcentaje' ? 0 : undefined}
                max={tipoRes === 'Porcentaje' ? 100 : undefined}
                className="app-field__control"
                value={valorResultado}
                onChange={(e) => setValorResultado(e.target.value)}
              />
              {tipoRes === 'Porcentaje' && <span>%</span>}
            </div>
          )}
        </div>
      </ConfirmDialog>
    </div>
  );
}
