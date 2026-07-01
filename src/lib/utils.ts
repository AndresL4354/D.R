import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/** Combinador de clases Tailwind (patrón shadcn/ui). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Formatea un RUT chileno: 123456785 -> 12.345.678-5 */
export function formatRut(rut: string | null | undefined): string {
  if (!rut) return '';
  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${withDots}-${dv}`;
}

/** Formatea una fecha ISO a dd-MM-yyyy (locale es). Devuelve '' si es inválida. */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  try {
    const date = typeof value === 'string' ? parseISO(value) : value;
    return format(date, 'dd-MM-yyyy', { locale: es });
  } catch {
    return '';
  }
}

/** Formatea fecha + hora a dd-MM-yyyy HH:mm. */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '';
  try {
    const date = typeof value === 'string' ? parseISO(value) : value;
    return format(date, 'dd-MM-yyyy HH:mm', { locale: es });
  } catch {
    return '';
  }
}

/** Clon del pipe formatMediumDatetime de docnomina: dayjs 'D MMM YYYY HH:mm:ss'. */
export function formatMediumDatetime(value: string | Date | null | undefined): string {
  if (!value) return '';
  try {
    const date = typeof value === 'string' ? parseISO(value) : value;
    return format(date, 'd MMM yyyy HH:mm:ss', { locale: es });
  } catch {
    return '';
  }
}
