/**
 * Extrai as strings pt-BR dos plugins de auditoria para servir de referência
 * ao catálogo de tradução. Roda sobre o texto-fonte: os plugins seguem um
 * padrão bem regular (check(...) e issue({...})), o que torna a varredura
 * confiável sem precisar de um parser de TypeScript.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = '/Users/jone/Flexi/fast/backend/src/plugins';

/** Lê um literal de string TS a partir de um índice (aspas simples ou crase). */
function readLiteral(src, from) {
  const quote = src[from];
  if (quote !== "'" && quote !== '`' && quote !== '"') return null;
  let out = '';
  let i = from + 1;
  // Escapes precisam ser DECODIFICADOS aqui: o catálogo guarda o texto como ele
  // sai em tempo de execução. Mantendo "\'" literal, uma frase com apóstrofo
  // (Let's Encrypt, default-src 'self') nunca casaria com a string real.
  const UNESCAPE = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };
  while (i < src.length) {
    const c = src[i];
    if (c === '\\') {
      const next = src[i + 1];
      out += UNESCAPE[next] ?? next;
      i += 2;
      continue;
    }
    if (c === quote) return { value: out, end: i + 1 };
    out += c;
    i += 1;
  }
  return null;
}

/** Concatena literais ligados por + (padrão comum nas descrições longas). */
function readConcat(src, from) {
  let i = from;
  let value = '';
  for (;;) {
    while (/\s/.test(src[i])) i += 1;
    const lit = readLiteral(src, i);
    if (!lit) break;
    value += lit.value;
    i = lit.end;
    let j = i;
    while (/\s/.test(src[j])) j += 1;
    if (src[j] === '+') {
      i = j + 1;
      continue;
    }
    break;
  }
  return value ? { value, end: i } : null;
}

const catalog = { plugins: {}, checks: {}, issues: {} };

for (const dir of readdirSync(ROOT, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const file = path.join(ROOT, dir.name, 'index.ts');
  let src;
  try {
    src = readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  // ---- identidade do plugin ----
  const idMatch = src.match(/^\s{2}id:\s*'([^']+)'/m);
  const nameMatch = src.match(/^\s{2}name:\s*'([^']+)'/m);
  const descMatch = src.match(/^\s{2}description:\s*\n?\s*'/m);
  const pluginId = idMatch?.[1] ?? dir.name;
  if (nameMatch) {
    const dPos = src.search(/^\s{2}description:\s*/m);
    let description = '';
    if (dPos >= 0) {
      const q = src.indexOf("'", dPos);
      const lit = readConcat(src, q);
      description = lit?.value ?? '';
    }
    catalog.plugins[pluginId] = { name: nameMatch[1], description };
  }

  // ---- checks: check('id', 'label', ...) ----
  catalog.checks[pluginId] = {};
  const checkRe = /\bcheck\(\s*\n?\s*'([^']+)',\s*\n?\s*/g;
  let m;
  while ((m = checkRe.exec(src))) {
    const label = readConcat(src, checkRe.lastIndex);
    if (label) catalog.checks[pluginId][m[1]] = label.value;
  }

  // ---- issues: issue({ id: '...', title: ..., description: ..., fix, gain }) ----
  catalog.issues[pluginId] = {};
  const issueRe = /\bissue\(\{/g;
  while ((m = issueRe.exec(src))) {
    // Delimita o objeto contando chaves.
    let depth = 1;
    let i = m.index + m[0].length;
    while (i < src.length && depth > 0) {
      if (src[i] === '{') depth += 1;
      else if (src[i] === '}') depth -= 1;
      i += 1;
    }
    const body = src.slice(m.index, i);
    const field = (name) => {
      const pos = body.search(new RegExp(`\\b${name}:\\s*`));
      if (pos < 0) return null;
      const start = pos + body.slice(pos).match(new RegExp(`\\b${name}:\\s*`))[0].length;
      const lit = readConcat(body, start);
      return lit?.value ?? null;
    };
    const id = field('id');
    if (!id) continue;
    catalog.issues[pluginId][id] = {
      title: field('title'),
      description: field('description'),
      fix: field('fix'),
      gain: field('gain'),
    };
  }
}

const counts = {
  plugins: Object.keys(catalog.plugins).length,
  checks: Object.values(catalog.checks).reduce((n, o) => n + Object.keys(o).length, 0),
  issues: Object.values(catalog.issues).reduce((n, o) => n + Object.keys(o).length, 0),
};

writeFileSync(process.argv[2], JSON.stringify(catalog, null, 2));
console.log(JSON.stringify(counts));
