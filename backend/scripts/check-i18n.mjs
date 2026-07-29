/**
 * Confere os catálogos de tradução contra o original em pt-BR.
 *
 * Três coisas quebram silenciosamente uma tradução e nenhuma delas o
 * compilador pega:
 *   1. um id que existe em português e falta no outro idioma;
 *   2. um id que só existe na tradução (renomeado no plugin e esquecido aqui);
 *   3. um texto com números cujos marcadores {0}, {1}… não batem — é o que
 *      produziria "3 links quebrados em 25" virando "25 links quebrados em 3".
 *
 * Uso: node backend/scripts/check-i18n.mjs
 * Sai com código 1 quando encontra qualquer divergência.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../src/i18n/catalog');
const LANGS = ['en', 'es', 'zh'];

const problems = [];

/** Extrai pares chave→texto de um arquivo TS de catálogo, sem executá-lo. */
function parseCatalog(source) {
  const entries = new Map();
  // Casa 'chave': 'texto' e chave: 'texto', com aspas simples ou duplas.
  const re = /(?:^|\s)'?([a-zA-Z][\w-]*)'?:\s*\n?\s*((?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")(?:\s*\+\s*(?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"))*)/g;
  let m;
  while ((m = re.exec(source))) {
    const text = m[2]
      .split(/\s*\+\s*/)
      .map((part) => part.slice(1, -1))
      .join('');
    entries.set(m[1], text);
  }
  return entries;
}

function placeholders(text) {
  return [...text.matchAll(/\{(\d+)\}/g)].map((m) => m[1]).sort().join(',');
}

// ---- pt-BR: a referência -----------------------------------------------------
const ptSource = readFileSync(path.join(ROOT, 'pt.ts'), 'utf8');
const ptEntries = parseCatalog(ptSource);

for (const lang of LANGS) {
  const dir = path.join(ROOT, lang);
  const files = readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'index.ts');

  const langEntries = new Map();
  for (const file of files) {
    for (const [key, text] of parseCatalog(readFileSync(path.join(dir, file), 'utf8'))) {
      // 'name' e 'description' se repetem por módulo; a chave ganha o prefixo.
      const scoped = key === 'name' || key === 'description' ? `${file.replace('.ts', '')}.${key}` : key;
      langEntries.set(scoped, text);
    }
  }

  for (const [key, ptText] of ptEntries) {
    if (key === 'name' || key === 'description' || key === 'pt') continue;
    const translated = langEntries.get(key);

    if (translated === undefined) {
      problems.push(`[${lang}] falta a chave "${key}"`);
      continue;
    }

    if (placeholders(ptText) !== placeholders(translated)) {
      problems.push(
        `[${lang}] marcadores diferentes em "${key}": pt {${placeholders(ptText)}} vs {${placeholders(translated)}}`,
      );
    }
  }
}

// ---- padrões: o lado pt precisa existir de verdade nos plugins ---------------
const patternsSource = readFileSync(path.join(ROOT, 'patterns.ts'), 'utf8');
for (const block of patternsSource.matchAll(/\{\s*pt:\s*('(?:\\.|[^'\\])*')/g)) {
  const pt = block[1].slice(1, -1);
  const langCount = (patternsSource.slice(block.index, block.index + 2000).match(/\b(en|es|zh):/g) ?? [])
    .slice(0, 3).length;
  if (langCount < 3) problems.push(`[patterns] "${pt.slice(0, 40)}…" não tem os três idiomas`);
}

if (problems.length) {
  console.error(`\n${problems.length} problema(s) de tradução:\n`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}

console.log(`i18n ok — ${ptEntries.size} entradas conferidas em ${LANGS.join(', ')}.`);
