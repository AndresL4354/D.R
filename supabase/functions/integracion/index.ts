// =============================================================================
// integracion — API server-to-server para Gesta OS (porta IntegracionResource)
// =============================================================================
// Autenticación por header X-Internal-Api-Key (constant-time), como el
// InternalApiKeyFilter del original. Consultas con service_role (el original
// servía todo con la sola API key — sin scoping por empresa). Solo lectura.
//
// Rutas (mismas que /api/integracion/*):
//   GET /integracion/trabajadores/{id}                      → ficha + servicios + servicio actual + licencia MEL/Gesta
//   GET /integracion/trabajadores/{id}/servicio-actual      → solo servicio actual (204 si no tiene)
//   GET /integracion/trabajadores/buscar?rut=…              → ficha por RUT (match EXACTO sobre numero_id, fiel)
//   GET /integracion/trabajadores/buscar/servicio-actual?rut=…
//   GET /integracion/trabajadores/buscar/evaluaciones?rut=…&tipo=…  → promedios por dimensión + listado
//   GET /integracion/servicios?q=…&faena=…                  → proyectos ACTIVOS
//   GET /integracion/servicios/{id}/personal?turno=…        → personal (excluye ELIMINADO/BACKUP) + turno
//   GET /integracion/servicios/{id}/turnos?tipo=…           → turnos con su personal
//   GET /integracion/stats/login                            → cifras agregadas (caché 60s)
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { constantTimeEquals, json } from '../_shared/http.ts';

type Row = Record<string, unknown>;

const STATS_CACHE_TTL_MS = 60_000;
let statsCache: { value: Row; expiry: number } | null = null;

function service(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
}

/** RutUtil.normalizar fiel: sin puntos/espacios, mayúscula, guion antes del DV. */
function normalizarRut(rut: string | null | undefined): string | null {
  if (rut == null) return null;
  let s = rut.trim().replaceAll('.', '').replaceAll(' ', '').toUpperCase();
  if (s === '') return null;
  if (!s.includes('-') && s.length > 1) s = `${s.slice(0, -1)}-${s.slice(-1)}`;
  return s;
}

/** LicenciaSpotDTO.calcularEstado / DiasRestantes / esVigente (fecha-solo). */
function hoyLocalDate(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}
function diasRestantes(vencimiento: string | null): number | null {
  if (!vencimiento) return null;
  const v = new Date(`${vencimiento}T00:00:00Z`);
  return Math.round((v.getTime() - hoyLocalDate().getTime()) / 86_400_000);
}
function estadoMel(vencimiento: string | null): string {
  const d = diasRestantes(vencimiento);
  if (d === null) return 'SIN_FECHA';
  if (d < 0) return 'VENCIDA';
  return d <= 30 ? 'POR_VENCER' : 'VIGENTE';
}

/** ServicioHistoricoDTO por persona (misma query que persona_servicios/JPQL). */
async function serviciosHistoricos(sb: SupabaseClient, idPersona: number): Promise<Row[]> {
  const { data: pps, error } = await sb
    .from('persona_proyecto')
    .select('id, id_proyecto, id_cargo, estado, fecha_creacion, acreditado, nuevo')
    .eq('id_persona', idPersona)
    .or('estado.is.null,estado.neq.ELIMINADO')
    .order('id', { ascending: false });
  if (error) throw error;
  const rows = pps ?? [];
  const pids = [...new Set(rows.map((r) => r.id_proyecto).filter((x): x is number => x != null))];
  const cids = [...new Set(rows.map((r) => r.id_cargo).filter((x): x is number => x != null))];
  const [proys, cargos] = await Promise.all([
    pids.length
      ? sb.from('proyecto').select('id, nombre, faena').in('id', pids)
      : Promise.resolve({ data: [], error: null }),
    cids.length
      ? sb.from('cargo').select('id, nombre').in('id', cids)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const pMap = new Map((proys.data ?? []).map((p: Row) => [p.id, p]));
  const cMap = new Map((cargos.data ?? []).map((c: Row) => [c.id, c]));
  return rows
    // INNER JOIN a proyecto (fiel): asociaciones sin proyecto existente se descartan
    .filter((r) => r.id_proyecto != null && pMap.has(r.id_proyecto))
    .map((r, i) => {
      const p = pMap.get(r.id_proyecto) as Row;
      const c = r.id_cargo != null ? (cMap.get(r.id_cargo) as Row | undefined) : undefined;
      return {
        idProyecto: r.id_proyecto,
        nombreServicio: p?.nombre ?? null,
        faena: p?.faena ?? null,
        nombreCargo: c?.nombre ?? null,
        estado: r.estado,
        fechaCreacion: r.fecha_creacion,
        acreditado: r.acreditado,
        nuevo: r.nuevo,
        actual: i === 0, // primera fila del ORDER BY id DESC (fiel)
      };
    });
}

/** Persona por RUT: findByNumIdSolo fiel (match EXACTO, ORDER BY id DESC → primera). */
async function personaPorRut(sb: SupabaseClient, rut: string): Promise<Row | null> {
  const { data, error } = await sb
    .from('persona')
    .select('*')
    .eq('numero_id', rut)
    .order('id', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0] ?? null;
}

/** construirIntegracion fiel: ficha + servicios + servicio actual + licencia Spot. */
async function trabajadorIntegracion(sb: SupabaseClient, persona: Row): Promise<Row> {
  const servicios = await serviciosHistoricos(sb, persona.id as number);
  const actual = servicios.find((s) => s.actual === true) ?? null;

  const dto: Row = {
    id: persona.id,
    rut: persona.numero_id,
    tipoId: persona.tipo_id,
    nombreCompleto: persona.nombre_completo,
    fechaNacimiento: persona.fecha_nacimiento,
    nacionalidad: persona.nacionalidad,
    genero: persona.genero,
    estadoCivil: persona.estado_civil,
    licenciaConduccion: persona.licencia_conduccion,
    telefono: persona.telefono,
    movil: persona.movil,
    email: persona.email,
    pais: persona.pais,
    region: persona.region,
    comuna: persona.comuna,
    direccion: persona.direccion,
    empresa: persona.empresa,
    estado: persona.estado_persona, // estado de la PERSONA, no del servicio (fiel)
    servicios,
    totalServicios: servicios.length,
    servicioActual: actual,
    cargoActual: actual ? (actual.nombreCargo ?? null) : null,
    licenciaMelVigente: null as boolean | null,
    licenciaMelVencimiento: null as string | null,
    licenciaMelEstado: null as string | null,
    licenciaMelDiasRestantes: null as number | null,
    licenciaGestaEntregada: null as boolean | null,
  };

  const rutNorm = normalizarRut(persona.numero_id as string | null);
  if (rutNorm) {
    const { data: lic } = await sb
      .from('licencia_spot')
      .select('vencimiento_mel, licencia_gesta')
      .eq('rut', rutNorm)
      .maybeSingle();
    if (lic) {
      const v = (lic.vencimiento_mel as string | null) ?? null;
      dto.licenciaMelVencimiento = v;
      dto.licenciaMelEstado = estadoMel(v);
      dto.licenciaMelDiasRestantes = diasRestantes(v);
      dto.licenciaMelVigente = v != null && (diasRestantes(v) ?? -1) >= 0;
      dto.licenciaGestaEntregada = lic.licencia_gesta === true;
    }
  }
  return dto;
}

/** Turnos del servicio con su personal (consultarTurnosIntegracion fiel). */
async function turnosIntegracion(sb: SupabaseClient, idProyecto: number, tipo: string | null): Promise<Row[]> {
  const { data: tts, error } = await sb
    .from('trabajador_turno')
    .select('id_turno, id_persona')
    .eq('id_proyecto', idProyecto);
  if (error) throw error;
  const idsTurno = [...new Set((tts ?? []).map((t) => t.id_turno).filter((x): x is number => x != null))];
  if (!idsTurno.length) return [];
  const { data: turnos } = await sb.from('turno').select('id, tipo').in('id', idsTurno);
  const filtro = tipo?.trim();
  const out: Row[] = [];
  for (const t of turnos ?? []) {
    if (filtro && (t.tipo == null || (t.tipo as string).trim().toLowerCase() !== filtro.toLowerCase())) continue;
    // consultarPersonasEnTurno: por id_turno SIN filtrar por proyecto (fiel)
    const { data: ttsTurno } = await sb.from('trabajador_turno').select('id_persona').eq('id_turno', t.id);
    const pids = [...new Set((ttsTurno ?? []).map((x) => x.id_persona).filter((x): x is number => x != null))];
    let personas: Row[] = [];
    if (pids.length) {
      const { data: ps } = await sb.from('persona').select('id, numero_id, nombre_completo').in('id', pids);
      const orden = new Map(pids.map((id, i) => [id, i]));
      personas = (ps ?? [])
        .sort((a, b) => (orden.get(a.id) ?? 0) - (orden.get(b.id) ?? 0))
        .map((p) => ({ rut: p.numero_id, nombre: p.nombre_completo }));
    }
    out.push({ idTurno: t.id, tipo: t.tipo, personas, totalPersonas: personas.length });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // ---- API Key (InternalApiKeyFilter) ----
  const expected = Deno.env.get('DOCNOMINA_INTERNAL_API_KEY');
  const got = req.headers.get('X-Internal-Api-Key') ?? '';
  if (!expected || !constantTimeEquals(got, expected)) {
    return json({ message: 'API key inválida', status: 401 }, 401);
  }
  if (req.method !== 'GET') return json({ message: 'Método no soportado', status: 405 }, 405);

  const sb = service();
  const url = new URL(req.url);
  // path tras el nombre de la función: /integracion/<resto>
  const parts = url.pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('integracion');
  const rest = parts.slice(idx + 1);

  try {
    // ---- /stats/login ----
    if (rest[0] === 'stats' && rest[1] === 'login') {
      const now = Date.now();
      if (statsCache && now < statsCache.expiry) return json(statsCache.value);
      const { data, error } = await sb.rpc('integracion_stats_login');
      if (error) throw error;
      const r = (data as Row[])[0] ?? {};
      const value = {
        personas: Number(r.personas ?? 0),
        personasActivas: Number(r.personas_activas ?? 0),
        servicios: Number(r.servicios ?? 0),
        faenas: Number(r.faenas ?? 0),
      };
      statsCache = { value, expiry: now + STATS_CACHE_TTL_MS };
      return json(value);
    }

    // ---- /servicios… ----
    if (rest[0] === 'servicios') {
      if (rest.length === 1) {
        const q = url.searchParams.get('q')?.trim().toLowerCase() ?? null;
        const faena = url.searchParams.get('faena')?.trim().toLowerCase() ?? null;
        const { data, error } = await sb
          .from('proyecto')
          .select('id, nombre, faena, empresa, estado, fecha_inicio, fecha_fin')
          .eq('estado', 'ACTIVO');
        if (error) throw error;
        const servicios = (data ?? [])
          .filter((p) => faena == null || (p.faena != null && (p.faena as string).toLowerCase() === faena))
          .filter((p) => {
            if (!q) return true;
            const nombre = ((p.nombre as string | null) ?? '').toLowerCase();
            const f = ((p.faena as string | null) ?? '').toLowerCase();
            return nombre.includes(q) || f.includes(q);
          })
          .map((p) => ({
            id: p.id,
            nombre: p.nombre,
            faena: p.faena,
            empresa: p.empresa,
            estado: p.estado,
            fechaInicio: p.fecha_inicio,
            fechaFin: p.fecha_fin,
          }));
        return json(servicios);
      }

      const idProyecto = Number(rest[1]);
      if (!Number.isFinite(idProyecto)) return json({ message: 'id inválido', status: 400 }, 400);

      if (rest[2] === 'turnos') {
        return json(await turnosIntegracion(sb, idProyecto, url.searchParams.get('tipo')));
      }

      if (rest[2] === 'personal') {
        // Mapa RUT → tipo de turno (primer turno gana, fiel a putIfAbsent)
        const turnoPorRut = new Map<string, string>();
        for (const t of await turnosIntegracion(sb, idProyecto, null)) {
          for (const p of t.personas as Row[]) {
            const rut = p.rut as string | null;
            if (rut && !turnoPorRut.has(rut)) turnoPorRut.set(rut, t.tipo as string);
          }
        }
        const { data: pps, error } = await sb
          .from('persona_proyecto')
          .select('id_persona, id_cargo, estado, acreditado, nuevo')
          .eq('id_proyecto', idProyecto)
          .not('estado', 'in', '(ELIMINADO,BACKUP)'); // NOT IN: excluye también NULL (fiel al JPQL)
        if (error) throw error;
        const rows = pps ?? [];
        const pids = [...new Set(rows.map((r) => r.id_persona).filter((x): x is number => x != null))];
        const cids = [...new Set(rows.map((r) => r.id_cargo).filter((x): x is number => x != null))];
        const [personas, cargos] = await Promise.all([
          pids.length ? sb.from('persona').select('id, numero_id, nombre_completo').in('id', pids) : Promise.resolve({ data: [] }),
          cids.length ? sb.from('cargo').select('id, nombre, tipo_cargo').in('id', cids) : Promise.resolve({ data: [] }),
        ]);
        const pMap = new Map((personas.data ?? []).map((p: Row) => [p.id, p]));
        const cMap = new Map((cargos.data ?? []).map((c: Row) => [c.id, c]));
        let personal = rows
          .map((r) => {
            const per = r.id_persona != null ? (pMap.get(r.id_persona) as Row | undefined) : undefined;
            const c = r.id_cargo != null ? (cMap.get(r.id_cargo) as Row | undefined) : undefined;
            return {
              rut: per?.numero_id ?? null,
              nombreCompleto: per?.nombre_completo ?? null,
              cargo: c?.nombre ?? null,
              tipoCargo: c?.tipo_cargo ?? null,
              estado: r.estado,
              acreditado: r.acreditado,
              nuevo: r.nuevo,
              turno: (per?.numero_id ? turnoPorRut.get(per.numero_id as string) : undefined) ?? null,
            };
          })
          .sort((a, b) => ((a.nombreCompleto as string) ?? '').localeCompare((b.nombreCompleto as string) ?? ''));
        const turno = url.searchParams.get('turno')?.trim();
        if (turno) personal = personal.filter((d) => d.turno != null && (d.turno as string).toLowerCase() === turno.toLowerCase());
        return json(personal);
      }
      return json({ message: 'ruta no encontrada', status: 404 }, 404);
    }

    // ---- /trabajadores… ----
    if (rest[0] === 'trabajadores') {
      // /trabajadores/buscar[/servicio-actual|/evaluaciones]?rut=…
      if (rest[1] === 'buscar') {
        const rut = url.searchParams.get('rut');
        if (!rut) return json({ message: 'rut requerido', status: 400 }, 400);
        const persona = await personaPorRut(sb, rut);
        if (!persona) return json({ message: 'no encontrado', status: 404 }, 404);

        if (rest[2] === 'evaluaciones') {
          return json(await evaluacionesIntegracion(sb, persona, url.searchParams.get('tipo')));
        }
        const dto = await trabajadorIntegracion(sb, persona);
        if (rest[2] === 'servicio-actual') {
          return dto.servicioActual == null ? new Response(null, { status: 204, headers: corsHeaders }) : json(dto.servicioActual);
        }
        return json(dto);
      }

      const id = Number(rest[1]);
      if (!Number.isFinite(id)) return json({ message: 'id inválido', status: 400 }, 400);
      const { data: persona, error } = await sb.from('persona').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!persona) return json({ message: 'no encontrado', status: 404 }, 404);
      const dto = await trabajadorIntegracion(sb, persona);
      if (rest[2] === 'servicio-actual') {
        return dto.servicioActual == null ? new Response(null, { status: 204, headers: corsHeaders }) : json(dto.servicioActual);
      }
      return json(dto);
    }

    return json({ message: 'ruta no encontrada', status: 404 }, 404);
  } catch (e) {
    console.error('integracion error:', e);
    return json({ message: (e as Error).message ?? 'error interno', status: 500 }, 500);
  }
});

/** Normaliza a MAYÚSCULAS sin tildes (comparación robusta de títulos de pregunta). */
function normalizarTexto(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase();
}

/** obtenerEvaluacionesIntegracion fiel: promedios por dimensión + listado por servicio. */
async function evaluacionesIntegracion(sb: SupabaseClient, persona: Row, tipoParam: string | null): Promise<Row> {
  const tipo = tipoParam?.trim() || 'NORMAL';
  const idPersona = persona.id as number;

  const { data: evals, error } = await sb
    .from('evaluacion')
    .select('id, tipo, fecha, promedio, id_proyecto')
    .eq('id_persona', idPersona)
    .eq('tipo', tipo);
  if (error) throw error;
  const evaluaciones = evals ?? [];

  // respuestas + títulos de pregunta
  const evalIds = evaluaciones.map((e) => e.id);
  const respuestas: Array<{ id_evaluacion: number; titulo: string; valor: number }> = [];
  if (evalIds.length) {
    const { data: rs } = await sb
      .from('respuestas')
      .select('id_evaluacion, id_pregunta, respuesta')
      .in('id_evaluacion', evalIds);
    const qids = [...new Set((rs ?? []).map((r) => r.id_pregunta).filter((x): x is number => x != null))];
    const { data: qs } = qids.length
      ? await sb.from('pregunta').select('id, titulo').in('id', qids)
      : { data: [] };
    const qMap = new Map((qs ?? []).map((q: Row) => [q.id, q.titulo as string | null]));
    for (const r of rs ?? []) {
      if (r.id_pregunta == null || r.respuesta == null) continue;
      const titulo = qMap.get(r.id_pregunta);
      if (titulo == null) continue;
      respuestas.push({ id_evaluacion: r.id_evaluacion as number, titulo, valor: Number(r.respuesta) });
    }
  }

  // promedios por título + Total = promedio de promedios (fiel)
  let promedios: Row | null = null;
  if (evaluaciones.length) {
    const grupos = new Map<string, number[]>();
    for (const r of respuestas) {
      if (!grupos.has(r.titulo)) grupos.set(r.titulo, []);
      grupos.get(r.titulo)!.push(r.valor);
    }
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const porTitulo = new Map<string, number>();
    for (const [t, xs] of grupos) porTitulo.set(t, avg(xs));
    const total = porTitulo.size ? avg([...porTitulo.values()]) : 0;
    promedios = { total, seguridad: null, calidadTecnica: null, comportamiento: null };
    for (const [t, v] of porTitulo) {
      const clave = normalizarTexto(t);
      if (clave.includes('SEGURIDAD')) promedios.seguridad = v;
      else if (clave.includes('CALIDAD')) promedios.calidadTecnica = v;
      else if (clave.includes('COMPORTAMIENTO')) promedios.comportamiento = v;
    }
  }

  // cargo por servicio desde el historial (putIfAbsent → primera aparición gana)
  const cargoPorProyecto = new Map<number, string | null>();
  for (const s of await serviciosHistoricos(sb, idPersona)) {
    const idP = s.idProyecto as number | null;
    if (idP != null && !cargoPorProyecto.has(idP)) cargoPorProyecto.set(idP, s.nombreCargo as string | null);
  }

  // nombres de proyecto
  const pids = [...new Set(evaluaciones.map((e) => e.id_proyecto).filter((x): x is number => x != null))];
  const { data: proys } = pids.length
    ? await sb.from('proyecto').select('id, nombre').in('id', pids)
    : { data: [] };
  const pMap = new Map((proys ?? []).map((p: Row) => [p.id, p.nombre as string | null]));

  const items = evaluaciones.map((e) => {
    const item: Row = {
      id: e.id,
      tipo: e.tipo,
      total: e.promedio,
      fecha: e.fecha,
      idProyecto: e.id_proyecto,
      servicio: e.id_proyecto != null ? (pMap.get(e.id_proyecto) ?? null) : null,
      cargo:
        (e.id_proyecto != null ? cargoPorProyecto.get(e.id_proyecto) : null) ??
        (persona.cargo as string | null),
      seguridad: null as number | null,
      calidadTecnica: null as number | null,
      comportamiento: null as number | null,
    };
    for (const r of respuestas.filter((x) => x.id_evaluacion === e.id)) {
      const titulo = normalizarTexto(r.titulo);
      if (titulo.includes('SEGURIDAD')) item.seguridad = r.valor;
      else if (titulo.includes('CALIDAD')) item.calidadTecnica = r.valor;
      else if (titulo.includes('COMPORTAMIENTO')) item.comportamiento = r.valor;
    }
    return item;
  });
  // más recientes primero, fechas nulas al final (fiel)
  items.sort((a, b) => {
    const fa = a.fecha as string | null;
    const fb = b.fecha as string | null;
    if (fa == null && fb == null) return 0;
    if (fa == null) return 1;
    if (fb == null) return -1;
    return fb.localeCompare(fa);
  });

  return {
    rut: persona.numero_id,
    nombreCompleto: persona.nombre_completo,
    evaluaciones: items,
    totalEvaluaciones: items.length,
    promedios: items.length ? promedios : null,
  };
}
