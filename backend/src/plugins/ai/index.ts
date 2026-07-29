import { config } from '../../config.js';
import type { AiAnalysis, AuditContext, CategoryScore, Issue } from '../../core/types.js';
import { UI } from '../../i18n/catalog/ui.js';
import type { Lang } from '../../i18n/types.js';

/**
 * Módulo 10 — Inteligência Artificial (via Ollama self-hosted).
 *
 * Não é um plugin de auditoria: roda depois de todos os outros e interpreta
 * os resultados técnicos, produzindo uma avaliação em linguagem natural.
 *
 * Usa um modelo local através do endpoint /api/generate do Ollama. Os dados
 * não saem da infraestrutura — nada é enviado a serviços externos.
 */

interface AnalysisShape {
  executiveSummary: string;
  mainProblems: string[];
  impacts: string;
  priorities: string[];
  estimatedGains: string;
  actionPlan: { step: number; title: string; detail: string; effort: string }[];
  technicalNotes: string[];
}

/** Descreve o formato de saída esperado — incluído no prompt. */
const OUTPUT_SPEC = `Responda APENAS com um objeto JSON válido, sem texto antes ou depois, com exatamente estas chaves:
{
  "executiveSummary": "resumo executivo de 3 a 5 frases, acessível a quem não é técnico",
  "mainProblems": ["3 a 6 problemas mais relevantes, um por item, uma frase cada"],
  "impacts": "parágrafo explicando o impacto em tráfego, conversão e visibilidade em IA",
  "priorities": ["correções em ordem de prioridade, da mais urgente para a menos"],
  "estimatedGains": "estimativa realista dos ganhos após as correções prioritárias",
  "actionPlan": [{"step": 1, "title": "título curto", "detail": "como executar", "effort": "ex.: 30 minutos"}],
  "technicalNotes": ["observações técnicas para a equipe de desenvolvimento"]
}`;

/**
 * Instrução de idioma da resposta.
 *
 * Vai no início do system prompt e é repetida no fim do prompt do usuário: o
 * modelo recebe o relatório inteiro em português (é a língua dos plugins) e,
 * sem o lembrete no final, tende a responder na língua do que acabou de ler.
 */
const LANGUAGE_INSTRUCTION: Record<Lang, string> = {
  pt: 'Escreva TODA a resposta em português do Brasil.',
  en: 'Write your ENTIRE response in English, even though the audit data below is in Portuguese. Translate every term into natural English.',
  es: 'Escribe TODA tu respuesta en español, aunque los datos de la auditoría a continuación estén en portugués. Traduce cada término a un español natural.',
  zh: '请全程使用简体中文作答，即使下面的审计数据是葡萄牙语。请把所有术语都译成自然的中文。',
};

const SYSTEM_PROMPT = `Você é um consultor sênior de performance web, SEO, GEO (Generative Engine Optimization) e segurança.

Recebe o resultado de uma auditoria técnica automatizada e produz uma avaliação para o time responsável pelo site.

Diretrizes:
- Escreva para dois públicos: o resumo executivo e os impactos devem ser compreensíveis por alguém não técnico; o plano de ação e as notas técnicas são para desenvolvedores.
- Baseie-se apenas nos dados fornecidos. Não invente métricas, números ou problemas que não estejam no relatório.
- Priorize por retorno sobre esforço: correções fáceis de alto impacto vêm primeiro.
- Seja concreto: em vez de "otimize as imagens", escreva "converta as 4 imagens acima de 300 KB para WebP e adicione srcset".
- Dê peso especial a problemas de segurança (chaves expostas, IP de origem exposto, SQL injection) e ao GEO.
${OUTPUT_SPEC}`;

interface AnalysisInput {
  ctx: AuditContext;
  categories: CategoryScore[];
  issues: Issue[];
  overallScore: number;
  lang: Lang;
}

/** Monta um resumo compacto da auditoria para enviar ao modelo. */
function buildPrompt(input: AnalysisInput): string {
  const { ctx, categories, issues, overallScore } = input;
  const m = ctx.desktop.metrics;

  const lines: string[] = [
    `URL auditada: ${ctx.finalUrl}`,
    `Nota geral: ${overallScore}/100`,
    '',
    'NOTAS POR CATEGORIA:',
    ...categories.map((c) => `- ${c.label}: ${c.score}/100 (${c.issueCount} problema(s))`),
    '',
    'PERFORMANCE (desktop):',
    `- LCP: ${m.lcp ?? 'n/d'} ms | CLS: ${m.cls ?? 'n/d'} | INP: ${m.inp ?? 'n/d'} ms | TTFB: ${m.ttfb ?? 'n/d'} ms | TBT: ${m.tbt ?? 'n/d'} ms`,
    `- Requisições: ${ctx.resources.length}`,
    '',
    'CONTEXTO:',
    `- llms.txt: ${ctx.llmsTxt?.ok ? 'presente' : 'ausente'} | robots.txt: ${ctx.robotsTxt?.ok ? 'presente' : 'ausente'}`,
    `- Palavras no conteúdo: ${ctx.dom.wordCount} | dados estruturados: ${ctx.dom.jsonLd.length} bloco(s)`,
    `- HTTPS: ${ctx.finalUrl.startsWith('https://') ? 'sim' : 'não'} | CDN: ${ctx.network.cdn ?? 'não detectado'}`,
    '',
    `PROBLEMAS ENCONTRADOS (${issues.length} no total, por prioridade):`,
  ];

  for (const issue of issues.slice(0, 30)) {
    lines.push(
      `- [${issue.priority.toUpperCase()} · ${issue.severity} · ${issue.category}] ${issue.title}` +
        ` — ${issue.description} (correção ~${issue.estimatedMinutes} min; ganho: ${issue.expectedGain})`,
    );
  }

  if (issues.length > 30) {
    lines.push(`... e mais ${issues.length - 30} problema(s) de menor prioridade.`);
  }

  lines.push('', OUTPUT_SPEC, '', LANGUAGE_INSTRUCTION[input.lang]);
  return lines.join('\n');
}

function unavailable(reason: string): AiAnalysis {
  return {
    available: false,
    executiveSummary: '',
    mainProblems: [],
    impacts: '',
    priorities: [],
    estimatedGains: '',
    actionPlan: [],
    technicalNotes: [],
    error: reason,
  };
}

/** Remove blocos de raciocínio <think>…</think> que modelos Qwen3 emitem. */
function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<\/?think>/gi, '').trim();
}

/**
 * Extrai o primeiro objeto JSON de um texto, mesmo que venha cercado de prosa.
 * Faz varredura com contagem de chaves respeitando strings e escapes.
 */
function extractJson(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Chama o Ollama /api/generate e devolve o texto gerado.
 *
 * Espelha a configuração comprovada no Flexi: `think: false` (desliga o
 * raciocínio do Qwen3, que senão suja a saída), cabeçalho Authorization,
 * keep_alive para manter o modelo carregado, e num_predict alto para a
 * resposta longa em JSON não ser truncada. NÃO usa format:"json" — instruímos
 * no prompt e extraímos o objeto, como o Flexi faz.
 */
async function callOllama(prompt: string, lang: Lang): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.ai.timeout);

  try {
    const res = await fetch(config.ai.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json; charset=utf-8',
        authorization: `Bearer ${config.ai.token}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.ai.model,
        system: `${LANGUAGE_INSTRUCTION[lang]}\n\n${SYSTEM_PROMPT}`,
        prompt,
        stream: false,
        think: false,
        keep_alive: config.ai.keepAlive,
        options: {
          temperature: Number.isFinite(config.ai.temperature) ? config.ai.temperature : 0.3,
          num_ctx: config.ai.numCtx,
          num_predict: config.ai.numPredict,
        },
      }),
    });

    // O Ollama devolve texto; parseamos manualmente para dar erro claro.
    const raw = await res.text();
    let data: { response?: string; error?: string };
    try {
      data = JSON.parse(raw) as { response?: string; error?: string };
    } catch {
      throw new Error(`Resposta não-JSON do Ollama (HTTP ${res.status}): ${raw.slice(0, 200)}`);
    }

    if (data.error) throw new Error(data.error);
    if (!res.ok) throw new Error(`Ollama respondeu HTTP ${res.status}`);
    return data.response ?? '';
  } finally {
    clearTimeout(timer);
  }
}

export async function runAiAnalysis(input: AnalysisInput): Promise<AiAnalysis> {
  if (!config.ai.url) {
    return unavailable(UI[input.lang].aiUnavailable);
  }

  try {
    const raw = await callOllama(buildPrompt(input), input.lang);
    const cleaned = stripThinking(raw);
    const json = extractJson(cleaned) ?? cleaned;

    let parsed: Partial<AnalysisShape>;
    try {
      parsed = JSON.parse(json) as Partial<AnalysisShape>;
    } catch {
      return unavailable(UI[input.lang].aiFailed);
    }

    return {
      available: true,
      executiveSummary: String(parsed.executiveSummary ?? ''),
      mainProblems: Array.isArray(parsed.mainProblems) ? parsed.mainProblems.map(String) : [],
      impacts: String(parsed.impacts ?? ''),
      priorities: Array.isArray(parsed.priorities) ? parsed.priorities.map(String) : [],
      estimatedGains: String(parsed.estimatedGains ?? ''),
      actionPlan: Array.isArray(parsed.actionPlan)
        ? parsed.actionPlan.map((s, i) => ({
            step: Number(s?.step ?? i + 1),
            title: String(s?.title ?? ''),
            detail: String(s?.detail ?? ''),
            effort: String(s?.effort ?? ''),
          }))
        : [],
      technicalNotes: Array.isArray(parsed.technicalNotes) ? parsed.technicalNotes.map(String) : [],
    };
  } catch (error) {
    // O detalhe técnico segue para o log; ao usuário vai a frase no idioma dele.
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[ai] ${message}`);
    return unavailable(UI[input.lang].aiFailed);
  }
}
