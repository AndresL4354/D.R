import { useEffect, useState } from 'react';
import { Ban, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { TIPOS_EVALUACION } from './api';
import { useEvaluacionExistente, useGuardarEvaluacion, usePreguntasPorTipo } from './hooks';

interface Ref {
  id: number;
  nombre: string | null;
}
type Answers = Record<number, { respuesta: string; motivo: string }>;

/**
 * Diálogo de encuesta (clon de EncuestaUpdateDialogComponent): carga las preguntas
 * del tipo y la evaluación existente (persona+proyecto+tipo) para crear o editar.
 * Cada pregunta se responde con la escala del tipo; si la respuesta ≤ umbral se
 * pide motivo. promedio y persistencia los resuelve la RPC evaluacion_guardar.
 */
export function EncuestaDialog({
  open,
  persona,
  proyecto,
  tipo,
  onClose,
}: {
  open: boolean;
  persona: Ref;
  proyecto: Ref;
  tipo: string;
  onClose: (saved: boolean) => void;
}) {
  const cfg = TIPOS_EVALUACION.find((t) => t.tipo === tipo) ?? TIPOS_EVALUACION[0]!;
  const { data: preguntas, isLoading: loadingPreg } = usePreguntasPorTipo(tipo, open);
  const { data: existente, isLoading: loadingEx } = useEvaluacionExistente(persona.id, proyecto.id, tipo, open);
  const guardarMut = useGuardarEvaluacion();

  const [answers, setAnswers] = useState<Answers>({});
  const [obs, setObs] = useState('');
  const [levantaMano, setLevantaMano] = useState('');
  const [mejora, setMejora] = useState('');
  const [peticion, setPeticion] = useState('');
  const [comentario, setComentario] = useState('');
  const [horas, setHoras] = useState('');

  useEffect(() => {
    if (!open) return;
    const seed: Answers = {};
    for (const p of preguntas ?? []) {
      const r = existente?.respuestas.find((x) => x.id_pregunta === p.id);
      seed[p.id] = { respuesta: r?.respuesta ?? '', motivo: r?.motivo ?? '' };
    }
    setAnswers(seed);
    setObs(existente?.observacion ?? '');
    setLevantaMano(existente?.levanta_mano ?? '');
    setMejora(existente?.mejora ?? '');
    setPeticion(existente?.peticion ?? '');
    setComentario(existente?.comentario ?? '');
    setHoras(existente?.horas_vertical != null ? String(existente.horas_vertical) : '');
  }, [open, preguntas, existente, tipo]);

  if (!open) return null;

  const cargando = loadingPreg || loadingEx;
  const listaPreguntas = preguntas ?? [];
  const setResp = (id: number, respuesta: string) =>
    setAnswers((a) => ({ ...a, [id]: { respuesta, motivo: a[id]?.motivo ?? '' } }));
  const setMotivo = (id: number, motivo: string) =>
    setAnswers((a) => ({ ...a, [id]: { respuesta: a[id]?.respuesta ?? '', motivo } }));

  const todasRespondidas =
    listaPreguntas.length > 0 && listaPreguntas.every((p) => (answers[p.id]?.respuesta ?? '') !== '');
  const esVertical = tipo !== 'NORMAL';

  const onGuardar = async () => {
    if (!todasRespondidas) return;
    const respuestas = listaPreguntas.map((p) => ({
      id_pregunta: p.id,
      respuesta: answers[p.id]?.respuesta ?? '',
      motivo: answers[p.id]?.motivo || '',
    }));
    try {
      await guardarMut.mutateAsync({
        header: {
          id: existente?.id ?? null,
          idPersona: persona.id,
          idProyecto: proyecto.id,
          tipo,
          observacion: obs || null,
          levantaMano: levantaMano || null,
          mejora: mejora || null,
          peticion: peticion || null,
          comentario: comentario || null,
          horasVertical: horas ? Number(horas) : null,
        },
        respuestas,
      });
      toast.success('Encuesta almacenada con exito.');
      onClose(true);
    } catch (e) {
      toast.error(`No se pudo guardar: ${(e as Error).message}`);
    }
  };

  return (
    <div className="app-modal-backdrop" role="dialog" aria-modal="true">
      <div className="app-modal" style={{ maxWidth: 640, width: '92vw' }}>
        <div className="app-modal__header">
          <h4 className="app-modal__title">Encuesta — {cfg.label}</h4>
          <button type="button" className="app-modal__close" aria-label="Cerrar" onClick={() => onClose(false)}>
            ×
          </button>
        </div>
        <div className="app-modal__body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          <p style={{ color: 'var(--app-text-muted)', marginTop: 0 }}>
            <strong>{persona.nombre}</strong> · {proyecto.nombre}
            {existente?.id ? ' · (editando)' : ''}
          </p>

          {cargando ? (
            <div className="app-empty-state">
              <Loader2 className="mx-auto animate-spin" size={22} />
            </div>
          ) : listaPreguntas.length === 0 ? (
            <p style={{ color: 'var(--app-text-muted)' }}>No hay preguntas configuradas para este tipo.</p>
          ) : (
            <>
              {listaPreguntas.map((p, i) => {
                const val = answers[p.id]?.respuesta ?? '';
                const bajoUmbral = val !== '' && Number(val) <= cfg.umbral;
                return (
                  <div key={p.id} className="app-field" style={{ marginBottom: 'var(--app-space-3)' }}>
                    <label className="app-field__label">
                      {i + 1}. {p.titulo ? `[${p.titulo}] ` : ''}
                      {p.pregunta}
                    </label>
                    <select
                      className="app-field__control"
                      value={val}
                      onChange={(e) => setResp(p.id, e.target.value)}
                    >
                      <option value="">Selecciona…</option>
                      {cfg.escala.map((op) => (
                        <option key={op.valor} value={String(op.valor)}>
                          {op.valor} · {op.texto}
                        </option>
                      ))}
                    </select>
                    {bajoUmbral && (
                      <textarea
                        className="app-field__control"
                        rows={2}
                        maxLength={500}
                        placeholder="Motivo (calificación baja)…"
                        value={answers[p.id]?.motivo ?? ''}
                        onChange={(e) => setMotivo(p.id, e.target.value)}
                        style={{ marginTop: 'var(--app-space-2)' }}
                      />
                    )}
                  </div>
                );
              })}

              <hr style={{ border: 0, borderTop: '1px solid var(--app-border)', margin: 'var(--app-space-3) 0' }} />
              <div className="app-field">
                <label className="app-field__label">Observación</label>
                <textarea className="app-field__control" rows={2} maxLength={500} value={obs} onChange={(e) => setObs(e.target.value)} />
              </div>
              <div className="app-field" style={{ marginTop: 'var(--app-space-2)' }}>
                <label className="app-field__label">Mejora</label>
                <textarea className="app-field__control" rows={2} maxLength={500} value={mejora} onChange={(e) => setMejora(e.target.value)} />
              </div>
              <div className="app-field" style={{ marginTop: 'var(--app-space-2)' }}>
                <label className="app-field__label">Petición</label>
                <textarea className="app-field__control" rows={2} maxLength={500} value={peticion} onChange={(e) => setPeticion(e.target.value)} />
              </div>
              <div className="app-field" style={{ marginTop: 'var(--app-space-2)' }}>
                <label className="app-field__label">Comentario</label>
                <textarea className="app-field__control" rows={2} maxLength={500} value={comentario} onChange={(e) => setComentario(e.target.value)} />
              </div>
              <div className="app-field" style={{ marginTop: 'var(--app-space-2)' }}>
                <label className="app-field__label">Levanta la mano</label>
                <input className="app-field__control" maxLength={250} value={levantaMano} onChange={(e) => setLevantaMano(e.target.value)} />
              </div>
              {esVertical && (
                <div className="app-field" style={{ marginTop: 'var(--app-space-2)' }}>
                  <label className="app-field__label">Horas vertical</label>
                  <input type="number" className="app-field__control" value={horas} onChange={(e) => setHoras(e.target.value)} />
                </div>
              )}
            </>
          )}
        </div>
        <div className="app-modal__footer">
          <button type="button" className="btn btn-segundo" onClick={() => onClose(false)} disabled={guardarMut.isPending}>
            <Ban size={16} /> Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={onGuardar} disabled={!todasRespondidas || guardarMut.isPending}>
            <Save size={16} /> {guardarMut.isPending ? 'Guardando…' : 'Finalizar'}
          </button>
        </div>
      </div>
    </div>
  );
}
