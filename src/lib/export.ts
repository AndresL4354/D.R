/**
 * Exportación client-side a CSV (compatible con Excel) — sin dependencias.
 * Reemplaza los "Descargar Excel" del backend (Fase 5) para los listados: genera
 * un CSV UTF-8 con BOM y separador ';' (el que espera Excel en locales es-CL),
 * escapando comillas/saltos/;. No es .xlsx real, pero abre directo en Excel.
 */
export interface ExportColumn<T> {
  header: string;
  value: (row: T) => string | number | boolean | null | undefined;
}

function escaparCampo(v: unknown): string {
  if (v == null) return '';
  const s = String(v);
  return /["\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Descarga `rows` como CSV con las columnas dadas. */
export function downloadCsv<T>(filename: string, columns: ExportColumn<T>[], rows: T[]): void {
  const sep = ';';
  const encabezado = columns.map((c) => escaparCampo(c.header)).join(sep);
  const cuerpo = rows.map((r) => columns.map((c) => escaparCampo(c.value(r))).join(sep)).join('\r\n');
  const bom = String.fromCharCode(0xfeff);
  const csv = `${bom}${encabezado}\r\n${cuerpo}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
