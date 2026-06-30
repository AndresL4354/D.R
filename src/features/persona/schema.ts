import { z } from 'zod';

/** Schema reutilizable: vale para el form del front Y para validar en Edge Functions. */
export const personaSchema = z.object({
  nombreCompleto: z.string().min(1, 'Requerido'),
  numId: z.string().regex(/^\d{7,8}-[\dkK]$/, 'RUT inválido (ej. 12345678-9)'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  empresa: z.string().min(1, 'Requerido'),
});

export type PersonaInput = z.infer<typeof personaSchema>;
