import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Ban, Check, Download, Eye, FileSpreadsheet, Loader2, UserPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { Workbook } from 'exceljs';
import {
  asociarPersonasProyectoMasivo,
  getPersonasCatalogoRut,
  type AsociacionMasivaResultado,
  type CargoSolicitado,
  type PersonalRow,
  type Proyecto,
} from './api';
import { useCargosProyecto } from './hooks';
import { getCargosCatalogo } from '@/features/persona/api';

/**
 * Carga masiva de personal a un servicio desde un Excel (clon del
 * CargaMasivaDialogComponent del original, commits 1ab1556 + 887e4b2):
 * pasos 1) archivo (con descarga de formato) → 2) normalizar cargos del Excel
 * contra los solicitados del servicio (o el catálogo completo si no tiene) →
 * 3) vista previa con validaciones client-side (RUT/estado/eliminados/nómina)
 * → 4) resultado por fila del servidor. En 3 y 4: export Excel de los NO
 * agregados con su motivo. exceljs se importa lazy (chunk aparte).
 */

interface FilaExcel {
  rut: string;
  nombre: string;
  cargoExcel: string;
  estado?: string;
  detalle?: string;
  idCargo?: number | null;
  nombreCargo?: string | null;
  idPersona?: number;
  nombrePersona?: string;
}

interface MapeoCargo {
  cargoExcel: string;
  cantidad: number;
  idCargo: number | null;
}

interface CargoOpcion {
  idCargo: number;
  nombreCargo: string;
}

function normalizarTexto(texto: string): string {
  return (texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function normalizarRut(rut?: string | null): string {
  return (rut ?? '').toUpperCase().replace(/[^0-9K]/g, '');
}

async function nuevoWorkbook(): Promise<Workbook> {
  const mod = (await import('exceljs')) as unknown as {
    Workbook?: new () => Workbook;
    default?: { Workbook: new () => Workbook };
  };
  const Ctor = mod.Workbook ?? mod.default?.Workbook;
  if (!Ctor) throw new Error('exceljs no disponible');
  return new Ctor();
}

function descargarXlsx(buffer: ArrayBuffer, nombre: string): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const MOTIVOS: Record<string, string> = {
  SIN_CARGO: 'Cargo sin normalizar',
  RUT_NO_ENCONTRADO: 'RUT no encontrado en el catálogo',
  PERSONA_NO_ACTIVA: 'Persona no activa',
  EN_ELIMINADOS: 'Está en Personal Eliminado del servicio',
  YA_EN_NOMINA: 'Ya estaba en la nómina o BackUp',
  YA_ASOCIADA: 'Ya asociada al servicio',
};

export function CargaMasivaDialog({
  proyecto,
  personal,
  usuarioCreacion,
  onClose,
}: {
  proyecto: Proyecto;
  /** persona_proyecto del servicio (todos los estados) — para validar nómina/backup/eliminados. */
  personal: PersonalRow[];
  usuarioCreacion: string;
  /** reason 'success' si se asoció al menos una persona. */
  onClose: (reason: 'success' | 'sin-cambios' | 'dismiss') => void;
}) {
  const [paso, setPaso] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorArchivo, setErrorArchivo] = useState('');
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [filas, setFilas] = useState<FilaExcel[]>([]);
  const [mapeos, setMapeos] = useState<MapeoCargo[]>([]);
  const [resultados, setResultados] = useState<AsociacionMasivaResultado[]>([]);

  // Cargos del servicio; si no tiene solicitados → catálogo completo (aviso)
  const { data: cargosSolicitados } = useCargosProyecto(proyecto.id);
  const sinSolicitados = cargosSolicitados != null && cargosSolicitados.length === 0;
  const { data: catalogoCompleto } = useQuery({
    queryKey: ['proyecto', 'cargos-catalogo-completo'],
    queryFn: getCargosCatalogo,
    enabled: sinSolicitados,
    staleTime: 5 * 60 * 1000,
  });
  const usandoCatalogoCompleto = sinSolicitados;
  const cargosServicio: CargoOpcion[] = useMemo(() => {
    if (!sinSolicitados) {
      return (cargosSolicitados ?? []).map((c: CargoSolicitado) => ({
        idCargo: c.idCargo,
        nombreCargo: c.nombreCargo,
      }));
    }
    return (catalogoCompleto ?? []).map((c) => ({ idCargo: c.id, nombreCargo: c.nombre }));
  }, [cargosSolicitados, catalogoCompleto, sinSolicitados]);

  // Catálogo de personas visibles (como `this.personas` del original)
  const { data: personasCatalogo } = useQuery({
    queryKey: ['proyecto', 'personas-catalogo-rut'],
    queryFn: getPersonasCatalogoRut,
    staleTime: 60 * 1000,
  });

  // ------------------------------------------------------------------
  // Paso 1: formato + lectura del Excel
  // ------------------------------------------------------------------
  const descargarFormato = async () => {
    const wb = await nuevoWorkbook();
    const nomina = wb.addWorksheet('Nomina');
    nomina.columns = [
      { header: 'RUT', key: 'rut', width: 16 },
      { header: 'NOMBRE', key: 'nombre', width: 40 },
      { header: 'CARGO', key: 'cargo', width: 40 },
    ];
    nomina.getRow(1).font = { bold: true };
    const cargoEjemplo = cargosServicio[0]?.nombreCargo ?? 'CARGO DEL SERVICIO';
    nomina.addRow(['12345678-9', 'JUAN PEREZ PEREZ (fila de ejemplo: reemplazar)', cargoEjemplo]);

    const cargos = wb.addWorksheet('Cargos del servicio');
    cargos.columns = [{ header: 'CARGO', key: 'cargo', width: 50 }];
    cargos.getRow(1).font = { bold: true };
    cargosServicio.forEach((c) => cargos.addRow([c.nombreCargo ?? '']));

    const buffer = await wb.xlsx.writeBuffer();
    descargarXlsx(buffer as ArrayBuffer, 'formato_carga_masiva_personal.xlsx');
  };

  const leerExcel = async (file: File): Promise<FilaExcel[]> => {
    const wb = await nuevoWorkbook();
    await wb.xlsx.load(await file.arrayBuffer());
    const ws = wb.worksheets[0];
    if (!ws) throw new Error('Sin hojas');

    let colRut = 0;
    let colNombre = 0;
    let colCargo = 0;
    ws.getRow(1).eachCell((cell, colNumber) => {
      const header = normalizarTexto(cell.text);
      if (!colRut && header.includes('RUT')) colRut = colNumber;
      else if (!colNombre && header.includes('NOMBRE')) colNombre = colNumber;
      else if (!colCargo && header.includes('CARGO')) colCargo = colNumber;
    });
    if (!colRut || !colCargo) throw new Error('Encabezados no encontrados');

    const out: FilaExcel[] = [];
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const rut = row.getCell(colRut).text.trim();
      const cargoExcel = normalizarTexto(row.getCell(colCargo).text);
      if (rut && cargoExcel) {
        out.push({ rut, nombre: colNombre ? row.getCell(colNombre).text.trim() : '', cargoExcel });
      }
    });
    return out;
  };

  const autoMatch = (cargoExcel: string): number | null => {
    const objetivo = normalizarTexto(cargoExcel);
    const candidatos = cargosServicio.filter((c) => {
      const nombre = normalizarTexto(c.nombreCargo ?? '');
      return nombre === objetivo || nombre.includes(objetivo) || objetivo.includes(nombre);
    });
    return candidatos.length === 1 ? (candidatos[0]?.idCargo ?? null) : null;
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorArchivo('');
    setNombreArchivo(file.name);
    setIsLoading(true);
    leerExcel(file)
      .then((fs) => {
        setFilas(fs);
        if (fs.length === 0) {
          setErrorArchivo('El archivo no tiene filas con RUT y cargo. Se esperan columnas RUT / NOMBRE / CARGO.');
        } else {
          const conteo = new Map<string, number>();
          fs.forEach((f) => conteo.set(f.cargoExcel, (conteo.get(f.cargoExcel) ?? 0) + 1));
          setMapeos(
            [...conteo.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([cargoExcel, cantidad]) => ({ cargoExcel, cantidad, idCargo: autoMatch(cargoExcel) })),
          );
          setPaso(2);
        }
      })
      .catch(() => {
        setErrorArchivo('No se pudo leer el archivo. Verifique que sea un Excel (.xlsx) con columnas RUT / NOMBRE / CARGO.');
      })
      .finally(() => {
        setIsLoading(false);
        e.target.value = '';
      });
  };

  // ------------------------------------------------------------------
  // Paso 2 → 3: vista previa con validaciones
  // ------------------------------------------------------------------
  const cargosSinMapear = mapeos.filter((m) => m.idCargo === null).length;

  const irAVistaPrevia = () => {
    const porCargo = new Map<string, number | null>();
    mapeos.forEach((m) => porCargo.set(m.cargoExcel, m.idCargo));
    const nombrePorId = new Map<number, string>();
    cargosServicio.forEach((c) => {
      if (c.idCargo != null) nombrePorId.set(c.idCargo, c.nombreCargo ?? '');
    });

    // Índices: catálogo por RUT (duplicado → id mayor) y estado en el servicio
    const porRut = new Map<string, { id: number; nombre: string | null; estado: string | null }>();
    (personasCatalogo ?? []).forEach((p) => {
      const k = normalizarRut(p.numero_id);
      const previa = porRut.get(k);
      if (k && (!previa || p.id > previa.id)) {
        porRut.set(k, { id: p.id, nombre: p.nombre_completo, estado: p.estado_persona });
      }
    });
    const idsEnNomina = new Set<number>();
    const idsEliminados = new Set<number>();
    personal.forEach((r) => {
      if (r.estado === 'ELIMINADO') idsEliminados.add(r.idPersona);
      else idsEnNomina.add(r.idPersona); // nómina (PRESEL/OFIC) + BACKUP, como el original
    });

    setFilas((prev) =>
      prev.map((fila) => {
        const f: FilaExcel = { ...fila };
        f.idCargo = porCargo.get(f.cargoExcel) ?? null;
        f.nombreCargo = f.idCargo != null ? nombrePorId.get(f.idCargo) : null;
        const persona = porRut.get(normalizarRut(f.rut));
        f.idPersona = persona?.id;
        f.nombrePersona = persona?.nombre ?? undefined;

        if (f.idCargo === null) {
          f.estado = 'SIN_CARGO';
          f.detalle = 'Cargo sin normalizar: no se asociará.';
        } else if (!persona) {
          f.estado = 'RUT_NO_ENCONTRADO';
          f.detalle = 'No existe en el catálogo de personas.';
        } else if (persona.estado !== 'Activo') {
          f.estado = 'PERSONA_NO_ACTIVA';
          f.detalle = `Estado: ${persona.estado ?? ''}`;
        } else if (idsEliminados.has(persona.id)) {
          f.estado = 'EN_ELIMINADOS';
          f.detalle = 'Está en "Personal Eliminado": reincorporar con la opción Asociar de esa sección.';
        } else if (idsEnNomina.has(persona.id)) {
          f.estado = 'YA_EN_NOMINA';
          f.detalle = 'Ya está en la nómina o en BackUp de este servicio.';
        } else {
          f.estado = 'ASOCIAR';
          f.detalle = '';
        }
        return f;
      }),
    );
    setPaso(3);
  };

  const filasPorEstado = (estado: string) => filas.filter((f) => f.estado === estado);
  const filasConProblemas = () => filas.filter((f) => f.estado !== 'ASOCIAR');
  const resultadosPorTipo = (tipo: string) => resultados.filter((r) => r.resultado === tipo);
  const resultadosConProblemas = () => resultados.filter((r) => r.resultado !== 'ASOCIADA');
  const totalNoAgregados = () => filasConProblemas().length + resultadosConProblemas().length;

  const noAgregadosDetalle = (): Array<{ rut: string; nombre: string; motivo: string; detalle: string }> => {
    const filaPorRut = new Map<string, FilaExcel>();
    filas.forEach((f) => filaPorRut.set(f.rut, f));
    return [
      ...filasConProblemas().map((f) => ({
        rut: f.rut,
        nombre: f.nombre,
        motivo: f.estado ?? '',
        detalle: f.detalle ?? '',
      })),
      ...resultadosConProblemas().map((r) => ({
        rut: r.rut ?? '',
        nombre: r.nombre_persona ?? filaPorRut.get(r.rut ?? '')?.nombre ?? '',
        motivo: r.resultado ?? '',
        detalle: r.detalle ?? '',
      })),
    ];
  };

  /** Excel con las filas que NO se agregaron y su motivo (commit 887e4b2). */
  const exportarNoAgregados = async () => {
    const filaPorRut = new Map<string, FilaExcel>();
    filas.forEach((f) => filaPorRut.set(f.rut, f));
    const noAgregados: string[][] = filasConProblemas().map((f) => [
      f.rut,
      f.nombre,
      f.cargoExcel,
      f.nombreCargo ?? '',
      MOTIVOS[f.estado ?? ''] ?? f.estado ?? '',
      f.detalle ?? '',
    ]);
    resultadosConProblemas().forEach((r) => {
      const f = filaPorRut.get(r.rut ?? '');
      noAgregados.push([
        r.rut ?? '',
        r.nombre_persona ?? f?.nombre ?? '',
        f?.cargoExcel ?? '',
        f?.nombreCargo ?? '',
        MOTIVOS[r.resultado ?? ''] ?? r.resultado ?? '',
        r.detalle ?? '',
      ]);
    });

    const wb = await nuevoWorkbook();
    const ws = wb.addWorksheet('No agregados');
    ws.columns = [
      { header: 'RUT', key: 'rut', width: 16 },
      { header: 'NOMBRE', key: 'nombre', width: 40 },
      { header: 'CARGO (EXCEL)', key: 'cargoExcel', width: 34 },
      { header: 'CARGO DOCNOMINA', key: 'cargoDocnomina', width: 34 },
      { header: 'MOTIVO', key: 'motivo', width: 34 },
      { header: 'DETALLE', key: 'detalle', width: 60 },
    ];
    ws.getRow(1).font = { bold: true };
    noAgregados.forEach((fila) => ws.addRow(fila));
    const buffer = await wb.xlsx.writeBuffer();
    descargarXlsx(buffer as ArrayBuffer, 'carga_masiva_no_agregados.xlsx');
  };

  // ------------------------------------------------------------------
  // Paso 3 → 4: asociar
  // ------------------------------------------------------------------
  const asociar = async () => {
    const asociables = filasPorEstado('ASOCIAR');
    if (!proyecto.id || asociables.length === 0 || isSaving) return;
    setIsSaving(true);
    setErrorArchivo('');
    try {
      const res = await asociarPersonasProyectoMasivo(
        proyecto.id,
        usuarioCreacion,
        asociables.map((f) => ({ rut: f.rut, id_cargo: f.idCargo ?? null })),
      );
      setResultados(res);
      setPaso(4);
    } catch {
      setErrorArchivo('Se presentó un error al asociar el personal. Ninguna fila fue confirmada; revise e intente de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const cerrar = () => {
    const asociadas = resultados.some((r) => r.resultado === 'ASOCIADA');
    onClose(asociadas ? 'success' : 'sin-cambios');
  };

  // ESC no cierra (backdrop static del original) — solo la × y los botones.
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const strip = (label: string, value: number, brand = false) => (
    <div className="app-info-strip__item">
      <span className="app-info-strip__label">{label}</span>
      <span className={`app-info-strip__value${brand ? ' app-info-strip__value--brand' : ''}`}>{value}</span>
    </div>
  );

  return (
    <div className="app-modal-backdrop" role="dialog" aria-modal="true">
      <div className="app-modal" style={{ maxWidth: 1100, width: '95vw' }}>
        <div className="app-modal__header">
          <h4 className="app-modal__title">
            Carga masiva de personal
            {proyecto.nombre && <small style={{ color: 'var(--app-text-muted)' }}> · {proyecto.nombre}</small>}
          </h4>
          <button type="button" className="app-modal__close" aria-label="Cerrar" onClick={() => onClose('dismiss')}>
            ×
          </button>
        </div>

        <div className="app-modal__body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          {/* ===== PASO 1: ARCHIVO ===== */}
          {paso === 1 && (
            <div>
              <p>
                Seleccione un Excel (<strong>.xlsx</strong>) con columnas <strong>RUT</strong>, <strong>NOMBRE</strong>{' '}
                y <strong>CARGO</strong>. Cada persona se asociará al servicio con el cargo normalizado que definas en
                el paso siguiente.
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: 'var(--app-space-2)' }}>
                <button type="button" className="btn btn-secondary" onClick={descargarFormato}>
                  <Download size={16} /> Descargar formato
                </button>
                <small style={{ color: 'var(--app-text-muted)' }}>
                  Planilla con las columnas requeridas y la lista de cargos que solicita este servicio.
                </small>
              </p>
              <input type="file" accept=".xlsx" onChange={onFileSelected} disabled={isLoading} />
              {isLoading && (
                <div style={{ marginTop: 'var(--app-space-2)' }}>
                  <Loader2 size={16} className="animate-spin" style={{ display: 'inline' }} /> Leyendo archivo…
                </div>
              )}
              {errorArchivo && <div className="app-alert app-alert--warning" style={{ marginTop: 'var(--app-space-2)' }}>{errorArchivo}</div>}
            </div>
          )}

          {/* ===== PASO 2: NORMALIZAR CARGOS ===== */}
          {paso === 2 && (
            <div>
              <p>
                <strong>{filas.length}</strong> filas leídas de <em>{nombreArchivo}</em>. Normaliza cada cargo del
                Excel a un cargo {usandoCatalogoCompleto ? 'del catálogo' : 'de los solicitados por el servicio'}. Los
                cargos en «No asociar» se omiten.
              </p>
              {usandoCatalogoCompleto && (
                <div className="app-alert app-alert--warning">
                  Este servicio no tiene cargos solicitados configurados: se muestra el catálogo completo de cargos.
                </div>
              )}
              <div className="app-table-wrap" style={{ maxHeight: '45vh', overflowY: 'auto' }}>
                <table className="app-table">
                  <thead>
                    <tr>
                      <th scope="col">Cargo en el Excel</th>
                      <th scope="col">Personas</th>
                      <th scope="col">Cargo en DocNómina</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mapeos.map((mapeo, i) => (
                      <tr key={i}>
                        <td>{mapeo.cargoExcel}</td>
                        <td>{mapeo.cantidad}</td>
                        <td>
                          <select
                            className="app-field__control"
                            value={mapeo.idCargo == null ? '' : String(mapeo.idCargo)}
                            onChange={(e) =>
                              setMapeos((prev) =>
                                prev.map((m, j) =>
                                  j === i ? { ...m, idCargo: e.target.value === '' ? null : Number(e.target.value) } : m,
                                ),
                              )
                            }
                          >
                            <option value="">— No asociar —</option>
                            {cargosServicio.map((c) => (
                              <option key={c.idCargo} value={c.idCargo}>
                                {c.nombreCargo}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {cargosSinMapear > 0 && (
                <div className="app-alert app-alert--warning" style={{ marginTop: 'var(--app-space-2)' }}>
                  {cargosSinMapear} cargo(s) sin normalizar: sus personas <strong>no</strong> se asociarán.
                </div>
              )}
            </div>
          )}

          {/* ===== PASO 3: VISTA PREVIA ===== */}
          {paso === 3 && (
            <div>
              <div className="app-info-strip">
                {strip('Se asociarán', filasPorEstado('ASOCIAR').length, true)}
                {strip('Ya en nómina', filasPorEstado('YA_EN_NOMINA').length)}
                {strip('En eliminados', filasPorEstado('EN_ELIMINADOS').length)}
                {strip('RUT no encontrado', filasPorEstado('RUT_NO_ENCONTRADO').length)}
                {strip('No activas', filasPorEstado('PERSONA_NO_ACTIVA').length)}
                {strip('Sin cargo', filasPorEstado('SIN_CARGO').length)}
              </div>

              {filasConProblemas().length > 0 && (
                <div style={{ marginTop: 'var(--app-space-3)' }}>
                  <p style={{ display: 'flex', alignItems: 'center', gap: 'var(--app-space-2)', marginBottom: 4 }}>
                    <strong>Filas que no se asociarán</strong>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={exportarNoAgregados}>
                      <FileSpreadsheet size={14} /> Exportar Excel
                    </button>
                  </p>
                  <div className="app-table-wrap" style={{ maxHeight: '35vh', overflowY: 'auto' }}>
                    <table className="app-table">
                      <thead>
                        <tr>
                          <th scope="col">RUT</th>
                          <th scope="col">Nombre (Excel)</th>
                          <th scope="col">Cargo (Excel)</th>
                          <th scope="col">Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filasConProblemas().map((fila, i) => (
                          <tr key={i}>
                            <td>{fila.rut}</td>
                            <td>{fila.nombre}</td>
                            <td>{fila.cargoExcel}</td>
                            <td>
                              <span className="app-badge app-badge--info">{fila.estado}</span>
                              {fila.detalle && <small> {fila.detalle}</small>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {errorArchivo && <div className="app-alert app-alert--warning" style={{ marginTop: 'var(--app-space-2)' }}>{errorArchivo}</div>}
            </div>
          )}

          {/* ===== PASO 4: RESULTADO ===== */}
          {paso === 4 && (
            <div>
              <div className="app-info-strip">
                {strip('Asociadas', resultadosPorTipo('ASOCIADA').length, true)}
                {strip('Ya asociadas', resultadosPorTipo('YA_ASOCIADA').length)}
                {strip('Otras', resultadosConProblemas().length - resultadosPorTipo('YA_ASOCIADA').length)}
              </div>

              {totalNoAgregados() > 0 && (
                <div style={{ marginTop: 'var(--app-space-3)' }}>
                  <p style={{ display: 'flex', alignItems: 'center', gap: 'var(--app-space-2)', marginBottom: 4 }}>
                    <strong>No agregados: {totalNoAgregados()}</strong>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={exportarNoAgregados}>
                      <FileSpreadsheet size={14} /> Exportar Excel (con motivo)
                    </button>
                  </p>
                  <div className="app-table-wrap" style={{ maxHeight: '35vh', overflowY: 'auto' }}>
                    <table className="app-table">
                      <thead>
                        <tr>
                          <th scope="col">RUT</th>
                          <th scope="col">Nombre</th>
                          <th scope="col">Motivo</th>
                          <th scope="col">Detalle</th>
                        </tr>
                      </thead>
                      <tbody>
                        {noAgregadosDetalle().map((fila, i) => (
                          <tr key={i}>
                            <td>{fila.rut}</td>
                            <td>{fila.nombre}</td>
                            <td>
                              <span className="app-badge app-badge--info">{fila.motivo}</span>
                            </td>
                            <td>
                              <small>{fila.detalle}</small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="app-modal__footer">
          {paso === 1 && (
            <button type="button" className="btn btn-segundo" onClick={() => onClose('dismiss')}>
              <Ban size={16} /> Cancelar
            </button>
          )}
          {paso === 2 && (
            <>
              <button type="button" className="btn btn-segundo" onClick={() => setPaso(1)}>
                <ArrowLeft size={16} /> Atrás
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!personasCatalogo}
                title={!personasCatalogo ? 'Cargando catálogo de personas…' : undefined}
                onClick={irAVistaPrevia}
              >
                {!personasCatalogo ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />} Vista previa
              </button>
            </>
          )}
          {paso === 3 && (
            <>
              <button type="button" className="btn btn-segundo" disabled={isSaving} onClick={() => setPaso(2)}>
                <ArrowLeft size={16} /> Atrás
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isSaving || filasPorEstado('ASOCIAR').length === 0}
                onClick={asociar}
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                {isSaving ? ' Asociando…' : ` Asociar ${filasPorEstado('ASOCIAR').length} persona(s)`}
              </button>
            </>
          )}
          {paso === 4 && (
            <button type="button" className="btn btn-primary" onClick={cerrar}>
              <Check size={16} /> Finalizar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
