import { scale, scoreFromChecks } from '../../core/scoring.js';
import type { AuditContext, AuditPlugin, Check, PluginIssue } from '../../core/types.js';
import { check, issue } from '../helpers.js';

const STOPWORDS = new Set([
  'a', 'o', 'as', 'os', 'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas',
  'para', 'por', 'com', 'sem', 'que', 'e', 'ou', 'um', 'uma', 'uns', 'umas', 'ao', 'aos',
  'se', 'ser', 'é', 'foi', 'mais', 'como', 'mas', 'seu', 'sua', 'the', 'of', 'to', 'and',
  'in', 'is', 'for', 'on', 'with', 'this', 'that', 'you', 'your', 'are', 'it', 'at', 'by',
]);

const AD_MARKERS = /\b(compre agora|assine já|clique aqui|oferta imperdível|aproveite|garanta o seu|últimas vagas|desconto exclusivo|não perca)\b/gi;

/** Índice de legibilidade Flesch adaptado ao português (Flesch–Kincaid pt-BR). */
function readability(text: string): { score: number; avgSentence: number; avgSyllables: number } {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 5);
  const words = text.split(/\s+/).filter(Boolean);
  if (sentences.length === 0 || words.length === 0) {
    return { score: 0, avgSentence: 0, avgSyllables: 0 };
  }

  const syllables = words.reduce((sum, w) => {
    const groups = w.toLowerCase().match(/[aeiouáéíóúâêôãõà]+/g);
    return sum + Math.max(1, groups?.length ?? 1);
  }, 0);

  const avgSentence = words.length / sentences.length;
  const avgSyllables = syllables / words.length;

  // Fórmula de Flesch adaptada para o português (Martins et al.)
  const score = 248.835 - 1.015 * avgSentence - 84.6 * avgSyllables;
  return { score: Math.max(0, Math.min(100, score)), avgSentence, avgSyllables };
}

const plugin: AuditPlugin = {
  id: 'content',
  name: 'Conteúdo',
  description: 'Clareza, profundidade, legibilidade, redundância, escaneabilidade e sinais de conteúdo raso.',
  category: 'content',
  weight: 2,
  checks: [
    'Volume de conteúdo', 'Legibilidade', 'Tamanho médio das frases', 'Escaneabilidade',
    'Organização por headings', 'Densidade de palavras-chave', 'Redundância',
    'Conteúdo duplicado', 'Excesso de propaganda', 'Profundidade', 'Contexto',
  ],

  async run(ctx: AuditContext) {
    const checks: Check[] = [];
    const issues: PluginIssue[] = [];
    const recommendations: string[] = [];
    const d = ctx.dom;
    const text = d.text;
    const words = text.split(/\s+/).filter(Boolean);

    // ---- Volume -----------------------------------------------------------
    checks.push(check('word-count', 'Volume de conteúdo', scale(d.wordCount, 600, 120), 2, `${d.wordCount} palavras`));

    if (d.wordCount < 300) {
      issues.push(
        issue({
          id: 'content-thin',
          title: `Conteúdo raso (${d.wordCount} palavras)`,
          description:
            'Páginas com pouco texto raramente respondem completamente à intenção do usuário e são preteridas tanto por buscadores quanto por modelos de IA, que precisam de material suficiente para extrair uma resposta.',
          severity: d.wordCount < 150 ? 'high' : 'medium',
          impact: 'alto',
          difficulty: 'dificil',
          minutes: 180,
          fix:
            'Expanda o conteúdo cobrindo as dúvidas reais do público: contexto, como funciona, para quem serve, comparações e exemplos. Mire em 600+ palavras de substância, não de enchimento.',
          gain: 'Cobertura de mais termos de busca e maior chance de citação por IA.',
          evidence: [`${d.wordCount} palavras detectadas no conteúdo principal`],
        }),
      );
    }

    // ---- Legibilidade -----------------------------------------------------
    const read = readability(text);
    checks.push(check('readability', 'Índice de legibilidade', scale(read.score, 60, 25), 2, `${Math.round(read.score)}/100`));
    checks.push(check('sentence-length', 'Tamanho médio das frases', scale(read.avgSentence, 18, 35), 1, `${read.avgSentence.toFixed(1)} palavras`));

    if (read.score < 40 && d.wordCount > 200) {
      issues.push(
        issue({
          id: 'content-hard-to-read',
          title: `Texto de leitura difícil (índice ${Math.round(read.score)}/100)`,
          description: `Frases com média de ${read.avgSentence.toFixed(0)} palavras e vocabulário longo tornam a leitura cansativa e reduzem a permanência na página.`,
          severity: 'medium',
          impact: 'medio',
          difficulty: 'media',
          minutes: 90,
          fix: 'Quebre frases longas em duas, prefira voz ativa, substitua termos técnicos desnecessários e limite parágrafos a 3 ou 4 linhas.',
          gain: 'Maior tempo de permanência e menor taxa de rejeição.',
          evidence: [`Média de ${read.avgSentence.toFixed(1)} palavras por frase`, `Média de ${read.avgSyllables.toFixed(2)} sílabas por palavra`],
        }),
      );
    }

    // ---- Escaneabilidade --------------------------------------------------
    const headingDensity = d.wordCount > 0 ? d.headings.length / (d.wordCount / 200) : 0;
    checks.push(check('scannability', 'Escaneabilidade (headings a cada ~200 palavras)', scale(headingDensity, 1, 0.2), 1.5, `${d.headings.length} headings`));
    checks.push(check('structure', 'Uso de listas e tabelas', d.lists + d.tables >= 2 ? 1 : (d.lists + d.tables) / 2, 1, `${d.lists} listas, ${d.tables} tabelas`));

    if (d.wordCount > 500 && d.headings.length < 3) {
      issues.push(
        issue({
          id: 'content-no-structure',
          title: 'Texto longo sem subdivisão em seções',
          description: `${d.wordCount} palavras com apenas ${d.headings.length} heading(s). Blocos densos de texto são difíceis de escanear e de segmentar automaticamente.`,
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 40,
          fix: 'Divida o conteúdo em seções de 150 a 300 palavras, cada uma com um H2 ou H3 descritivo.',
          gain: 'Leitura mais rápida e melhor extração por mecanismos de IA.',
        }),
      );
    }

    // ---- Densidade de palavras-chave --------------------------------------
    const freq = new Map<string, number>();
    for (const raw of words) {
      const w = raw.toLowerCase().replace(/[^a-záéíóúâêôãõçà]/g, '');
      if (w.length < 4 || STOPWORDS.has(w)) continue;
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }

    const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    const topDensity = words.length > 0 && top.length > 0 ? top[0][1] / words.length : 0;

    checks.push(check('keyword-density', 'Densidade de palavra-chave saudável', topDensity < 0.04 ? 1 : topDensity < 0.06 ? 0.5 : 0, 1.5, `${(topDensity * 100).toFixed(1)}%`));

    if (topDensity > 0.04 && words.length > 200) {
      issues.push(
        issue({
          id: 'content-keyword-stuffing',
          title: `Repetição excessiva do termo "${top[0][0]}" (${(topDensity * 100).toFixed(1)}%)`,
          description:
            'Densidade acima de 4% é interpretada como tentativa de manipulação por buscadores e torna o texto artificial para o leitor.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 45,
          fix: 'Substitua repetições por sinônimos e variações naturais, e reescreva as frases onde o termo aparece de forma forçada.',
          gain: 'Texto mais natural e menor risco de penalização.',
          evidence: top.slice(0, 5).map(([w, n]) => `"${w}": ${n} ocorrências`),
        }),
      );
    }

    // ---- Redundância ------------------------------------------------------
    const sentences = text.split(/[.!?]+/).map((s) => s.trim().toLowerCase()).filter((s) => s.length > 25);
    const seen = new Set<string>();
    let duplicates = 0;
    for (const s of sentences) {
      const key = s.slice(0, 80);
      if (seen.has(key)) duplicates++;
      else seen.add(key);
    }
    const dupRatio = sentences.length > 0 ? duplicates / sentences.length : 0;

    checks.push(check('redundancy', 'Baixa redundância', 1 - Math.min(1, dupRatio * 4), 1, `${duplicates} frase(s) repetida(s)`));

    if (dupRatio > 0.08 && sentences.length > 10) {
      issues.push(
        issue({
          id: 'content-duplicate',
          title: `${duplicates} frases repetidas no conteúdo`,
          description: 'Repetição de trechos indica conteúdo gerado por template ou revisão insuficiente, e reduz o valor percebido da página.',
          severity: 'low',
          impact: 'baixo',
          difficulty: 'media',
          minutes: 60,
          fix: 'Revise o texto eliminando parágrafos redundantes e consolidando informações repetidas.',
          gain: 'Conteúdo mais denso em informação por palavra lida.',
        }),
      );
    }

    // ---- Propaganda -------------------------------------------------------
    const adHits = text.match(AD_MARKERS) ?? [];
    const adDensity = words.length > 0 ? adHits.length / (words.length / 100) : 0;
    checks.push(check('promotional', 'Equilíbrio entre conteúdo e propaganda', scale(adDensity, 0.5, 3), 1, `${adHits.length} chamada(s) comercial(is)`));

    if (adDensity > 1.5 && words.length > 150) {
      issues.push(
        issue({
          id: 'content-too-promotional',
          title: 'Excesso de linguagem promocional',
          description: `${adHits.length} chamadas comerciais em ${words.length} palavras. Conteúdo predominantemente promocional é desvalorizado por buscadores e raramente citado por IA como fonte informativa.`,
          severity: 'medium',
          impact: 'medio',
          difficulty: 'media',
          minutes: 60,
          fix: 'Equilibre a página: informe primeiro (o que é, como funciona, para quem), venda depois. Mantenha as CTAs, mas reduza a repetição.',
          gain: 'Mais confiança do leitor e maior elegibilidade como fonte informativa.',
          evidence: [...new Set(adHits)].slice(0, 6),
        }),
      );
    }

    // ---- Profundidade e contexto ------------------------------------------
    const hasContext = /\b(porque|portanto|no entanto|além disso|por outro lado|isso significa|ou seja)\b/i.test(text);
    checks.push(check('depth', 'Profundidade argumentativa', hasContext ? 1 : 0.4, 1, hasContext ? 'presente' : 'limitada'));

    const uniqueRatio = words.length > 0 ? freq.size / words.length : 0;
    checks.push(check('vocabulary', 'Riqueza de vocabulário', scale(uniqueRatio, 0.35, 0.12), 1, `${(uniqueRatio * 100).toFixed(0)}% de termos únicos`));

    if (!hasContext && d.wordCount > 300) {
      recommendations.push('Use conectivos explicativos (porque, portanto, no entanto) para tornar o raciocínio rastreável por leitores e por modelos de IA.');
    }

    return {
      score: scoreFromChecks(checks),
      checks,
      issues,
      recommendations,
      evidence: {
        wordCount: d.wordCount,
        readability: read,
        topKeywords: top,
        headings: d.headings.length,
        lists: d.lists,
        tables: d.tables,
        duplicateSentences: duplicates,
        promotionalHits: adHits.length,
      },
    };
  },
};

export default plugin;
