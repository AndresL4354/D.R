import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  eliminarEvaluacion,
  getEvaluacion,
  getEvaluacionesPersona,
  getEvaluacionesProyecto,
  getEvaluacionExistente,
  getPreguntasPorTipo,
  guardarEvaluacion,
  listEvaluaciones,
  type EvaluacionHeaderInput,
  type RespuestaEval,
} from './api';

export function useEvaluaciones(params: { page: number; size: number }) {
  return useQuery({
    queryKey: ['evaluacion', 'list', params],
    queryFn: () => listEvaluaciones(params),
    placeholderData: (prev) => prev,
  });
}

export function useEvaluacion(id: number) {
  return useQuery({
    queryKey: ['evaluacion', 'detail', id],
    queryFn: () => getEvaluacion(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

// ---- Encuesta (0030) ----
export function usePreguntasPorTipo(tipo: string, enabled = true) {
  return useQuery({
    queryKey: ['evaluacion', 'preguntas', tipo],
    queryFn: () => getPreguntasPorTipo(tipo),
    enabled: enabled && !!tipo,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEvaluacionExistente(idPersona: number, idProyecto: number, tipo: string, enabled = true) {
  return useQuery({
    queryKey: ['evaluacion', 'existente', idPersona, idProyecto, tipo],
    queryFn: () => getEvaluacionExistente(idPersona, idProyecto, tipo),
    enabled: enabled && idPersona > 0 && idProyecto > 0 && !!tipo,
  });
}

export function useEvaluacionesPersona(idPersona: number, tipo: string) {
  return useQuery({
    queryKey: ['evaluacion', 'persona', idPersona, tipo],
    queryFn: () => getEvaluacionesPersona(idPersona, tipo),
    enabled: idPersona > 0 && !!tipo,
  });
}

export function useEvaluacionesProyecto(idProyecto: number, tipo: string) {
  return useQuery({
    queryKey: ['evaluacion', 'proyecto', idProyecto, tipo],
    queryFn: () => getEvaluacionesProyecto(idProyecto, tipo),
    enabled: idProyecto > 0 && !!tipo,
  });
}

export function useGuardarEvaluacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ header, respuestas }: { header: EvaluacionHeaderInput; respuestas: RespuestaEval[] }) =>
      guardarEvaluacion(header, respuestas),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evaluacion'] }),
  });
}

export function useEliminarEvaluacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eliminarEvaluacion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evaluacion'] }),
  });
}
