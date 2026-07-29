/**
 * Converte a extração bruta em backend/src/i18n/catalog/pt.ts.
 *
 * As interpolações `${expr}` viram marcadores posicionais {0}, {1}… — é a
 * forma canônica usada pelo tradutor: o texto em pt-BR vira o padrão que
 * casa com a string já montada em tempo de execução, e as capturas entram
 * no mesmo lugar na tradução.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const src = JSON.parse(readFileSync(process.argv[2], 'utf8'));

function toTemplate(text) {
  if (text === null || text === undefined) return null;
  let i = 0;
  return text.replace(/\$\{(?:[^{}]|\{[^{}]*\})*\}/g, () => `{${i++}}`);
}

function q(text) {
  return `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

const out = [];
out.push('/* eslint-disable */');
out.push('/**');
out.push(' * Catálogo pt-BR — GERADO a partir dos plugins de auditoria.');
out.push(' *');
out.push(' * Este arquivo não é a fonte dos textos: a fonte continua sendo cada plugin,');
out.push(' * em português. O catálogo existe para o tradutor saber, por id, qual texto');
out.push(' * original corresponde a qual entrada — inclusive nos textos com números,');
out.push(' * onde os marcadores {0}, {1}… casam com os valores medidos.');
out.push(' *');
out.push(' * Para regerar: npm run i18n:extract (na raiz do projeto).');
out.push(' */');
out.push('');
out.push("import type { LangCatalog } from '../types.js';");
out.push('');
out.push('export const pt: LangCatalog = {');

out.push('  plugins: {');
for (const [id, p] of Object.entries(src.plugins)) {
  out.push(`    ${id}: { name: ${q(p.name)}, description: ${q(p.description)} },`);
}
out.push('  },');

out.push('  checks: {');
for (const [plugin, checks] of Object.entries(src.checks)) {
  if (!Object.keys(checks).length) continue;
  out.push(`    ${plugin}: {`);
  for (const [id, label] of Object.entries(checks)) {
    out.push(`      ${q(id)}: ${q(toTemplate(label))},`);
  }
  out.push('    },');
}
out.push('  },');

out.push('  issues: {');
for (const [plugin, issues] of Object.entries(src.issues)) {
  if (!Object.keys(issues).length) continue;
  out.push(`    ${plugin}: {`);
  for (const [id, fields] of Object.entries(issues)) {
    const parts = [];
    for (const key of ['title', 'description', 'fix', 'gain']) {
      const value = toTemplate(fields[key]);
      if (value) parts.push(`        ${key}: ${q(value)},`);
    }
    out.push(`      ${q(id)}: {`);
    out.push(...parts);
    out.push('      },');
  }
  out.push('    },');
}
out.push('  },');
out.push('};');
out.push('');

writeFileSync(process.argv[3], out.join('\n'));
console.log('linhas:', out.length);
