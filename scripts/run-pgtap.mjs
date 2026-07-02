// Ejecuta las suites pgTAP de supabase/tests/ contra la BD del proyecto vía
// Management API. Requiere SUPABASE_ACCESS_TOKEN (sbp_...) en el entorno.
// Uso:  SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/run-pgtap.mjs
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? 'sfuwzgcvmczsoydueeog';
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('Falta SUPABASE_ACCESS_TOKEN (token sbp_... de Supabase).');
  process.exit(2);
}

const testsDir = path.join(import.meta.dirname, '..', 'supabase', 'tests');
const files = fs.readdirSync(testsDir).filter((f) => f.endsWith('.sql')).sort();
let failed = 0;

for (const file of files) {
  const sql = fs.readFileSync(path.join(testsDir, file), 'utf8');
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.json();
  if (!res.ok) {
    console.error(`✗ ${file}: error al ejecutar —`, JSON.stringify(body).slice(0, 400));
    failed++;
    continue;
  }
  const tap = Array.isArray(body) ? (body[0]?.tap_output ?? '') : '';
  console.log(`── ${file} ──`);
  console.log(tap);
  const notOk = tap.split('\n').filter((l) => l.startsWith('not ok'));
  if (notOk.length) {
    failed++;
    console.error(`✗ ${file}: ${notOk.length} aserciones fallidas`);
  } else {
    console.log(`✓ ${file}`);
  }
}

process.exitCode = failed ? 1 : 0;
