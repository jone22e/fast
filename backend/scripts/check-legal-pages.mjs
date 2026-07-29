/**
 * Confere as páginas legais publicadas contra as regras reais do módulo LGPD.
 *
 * As regras são importadas do módulo compilado, e não copiadas aqui: uma cópia
 * divergiria em silêncio e o teste passaria a atestar a si mesmo.
 *
 * Uso: node backend/scripts/check-legal-pages.mjs   (após `npm run build`)
 */
import { readFileSync } from 'node:fs';
import {
  DPO_CONTACT,
  LGPD_TERMS,
  POLICY_HINT,
  TERMS_HINT,
} from '../dist/plugins/lgpd/index.js';

/** Página legal de cada idioma e como o rodapé do app aponta para ela. */
const PAGES = [
  { lang: 'pt', file: 'privacidade.html', linkText: 'Política de privacidade', termsText: 'Termos de uso' },
  { lang: 'en', file: 'privacy.html', linkText: 'Privacy policy', termsText: 'Terms of use' },
  { lang: 'es', file: 'privacidad.html', linkText: 'Política de privacidad', termsText: 'Términos de uso' },
  { lang: 'zh', file: 'yinsi.html', linkText: '隐私政策', termsText: '使用条款' },
];

let failed = 0;
const fail = (msg) => {
  console.log(`  ✗ ${msg}`);
  failed += 1;
};

for (const page of PAGES) {
  const html = readFileSync(`frontend/dist/${page.file}`, 'utf8');
  console.log(`\n${page.lang} — ${page.file}`);

  // 1. O rodapé precisa ser reconhecido como link de política e de termos.
  const href = `/${page.file}`;
  if (POLICY_HINT.test(page.linkText) || POLICY_HINT.test(href)) console.log('  ✓ link reconhecido como política');
  else fail(`link "${page.linkText}" (${href}) não casa com POLICY_HINT`);

  if (TERMS_HINT.test(page.termsText)) console.log('  ✓ link reconhecido como termos');
  else fail(`link "${page.termsText}" não casa com TERMS_HINT`);

  // 2. A política precisa trazer os cinco marcadores da LGPD.
  const missing = LGPD_TERMS.filter((t) => !t.re.test(html)).map((t) => t.key);
  if (missing.length === 0) console.log(`  ✓ ${LGPD_TERMS.length}/${LGPD_TERMS.length} marcadores da LGPD`);
  else fail(`marcadores ausentes: ${missing.join(', ')}`);

  // 3. O encarregado precisa ter contato publicado.
  const dpo = html.match(DPO_CONTACT);
  if (dpo) console.log(`  ✓ encarregado com contato: ${dpo[2] ?? dpo[0]}`);
  else fail('sem contato do encarregado (DPO)');
}

console.log(
  failed === 0
    ? '\npáginas legais ok — reconhecidas pelo próprio módulo LGPD.'
    : `\n${failed} verificação(ões) falharam.`,
);
process.exit(failed === 0 ? 0 : 1);
