import { z } from 'zod';

/** Campos editables de persona (snake_case = columnas reales). Sirve para el form. */
export const personaSchema = z.object({
  nombre_completo: z.string().min(1, 'Requerido'),
  numero_id: z
    .string()
    .regex(/^\d{7,8}-[\dkK]$/, 'RUT inválido (ej. 12345678-9)')
    .optional()
    .or(z.literal('')),
  tipo_id: z.string().optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional().or(z.literal('')),
  movil: z.string().optional().or(z.literal('')),
  direccion: z.string().optional().or(z.literal('')),
  empresa: z.string().min(1, 'Requerido'),
  cargo: z.string().optional().or(z.literal('')),
  nacionalidad: z.string().optional().or(z.literal('')),
  genero: z.string().optional().or(z.literal('')),
  estado_civil: z.string().optional().or(z.literal('')),
});

export type PersonaInput = z.infer<typeof personaSchema>;
