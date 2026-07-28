import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config.js';
import type { AiAnalysis, AuditContext, CategoryScore, Issue } from '../../core/types.js';

/**
 * Módulo 10 — Inteligência Artificial.
 *
 * Não é um plugin de auditoria: roda depois de todos os outros e interpreta
 * os resultados técnicos, produzindo uma avaliação em linguagem natural.
 */

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!config.ai.apiKey) return null;
  if (!client) client = new Anthropic({ apiKey: config.ai.apiKey });
  return client;
}

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    executiveSummary: {
      type: 'string',
      description: 'Resumo executivo de 3 a 5 frases, em português, acessível a quem não é técnico.',
    },
    mainProblems: {
      type: 'array',
      items: { type: 'string' },
      description: 'De 3 a 6 problemas mais relevantes, cada um em uma frase.',
    },
    impacts: {
      type: 'string',
      description: 'Parágrafo explicando o impacto concreto dos problemas em tráfego, conversão e visibilidade em IA.',
    },
    priorities: {
      type: 'array',
      items: { type: 'string' },
      description: 'Correções em ordem de prioridade, da mais urgente para a menos.',
    },
    estimatedGains: {
      type: 'string',
      description: 'Estimativa realista dos ganhos após aplicar as correções prioritárias.',
    },
    actionPlan: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          step: { type: 'integer' },
          title: { type: 'string' },
          detail: { type: 'string', description: 'Explicação técnica de como executar.' },
          effort: { type: 'string', description: 'Esforço estimado, ex.: "30 minutos", "1 dia".' },
        },
        required: ['step', 'title', 'detail', 'effort'],
        additionalProperties: false,
      },
      description: 'Plano de ação sequencial com 4 a 8 etapas.',
    },
    technicalNotes: {
      type: 'array',
      items: { type: 'string' },
      description: 'Observações técnicas complementares para a equipe de desenvolvimento.',
    },
  },
  required: [
    'executiveSummary',
    'mainProblems',
    'impacts',
    'priorities',
    'estimatedGains',
    'actionPlan',
    'technicalNotes',
  ],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `Você é um consultor sênior de performance web, SEO e GEO (Generative Engine Optimization).

Recebe o resultado de uma auditoria técnica automatizada e produz uma avaliação em português do Brasil.

Diretrizes:
- Escreva para dois públicos ao mesmo tempo: o resumo executivo e os impactos devem ser compreensíveis por alguém não técnico; o plano de ação e as notas técnicas são para desenvolvedores.
- Baseie-se apenas nos dados fornecidos. Não invente métricas, números ou problemas que não estejam no relatório.
- Priorize por retorno sobre esforço: correções fáceis de alto impacto vêm primeiro.
- Seja concreto. Em vez de "otimize as imagens", escreva "converta as 4 imagens acima de 300 KB para WebP e adicione srcset".
- Quando estimar ganhos, deixe claro que é uma estimativa e ancore nos números medidos.
- Dê peso especial ao GEO: a visibilidade em ChatGPT, Claude, Gemini e Perplexity é um diferencial que a maioria dos sites ainda ignora.`;

interface AnalysisInput {
  ctx: AuditContext;
  categories: CategoryScore[];
  issues: Issue[];
  overallScore: number;
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
    'MÉTRICAS DE PERFORMANCE (desktop):',
    `- LCP: ${m.lcp ?? 'n/d'} ms`,
    `- CLS: ${m.cls ?? 'n/d'}`,
    `- INP: ${m.inp ?? 'n/d'} ms`,
    `- FCP: ${m.fcp ?? 'n/d'} ms`,
    `- TTFB: ${m.ttfb ?? 'n/d'} ms`,
    `- Total Blocking Time: ${m.tbt ?? 'n/d'} ms`,
    `- Requisições: ${ctx.resources.length}`,
    '',
    'MÉTRICAS MOBILE:',
    `- LCP: ${ctx.mobile.metrics.lcp ?? 'n/d'} ms`,
    `- CLS: ${ctx.mobile.metrics.cls ?? 'n/d'}`,
    `- Rolagem horizontal: ${ctx.mobile.horizontalOverflow ? 'sim' : 'não'}`,
    '',
    'CONTEXTO GEO:',
    `- llms.txt: ${ctx.llmsTxt?.ok ? 'presente' : 'ausente'}`,
    `- llms-full.txt: ${ctx.llmsFullTxt?.ok ? 'presente' : 'ausente'}`,
    `- robots.txt: ${ctx.robotsTxt?.ok ? 'presente' : 'ausente'}`,
    `- Palavras no conteúdo: ${ctx.dom.wordCount}`,
    `- Dados estruturados (JSON-LD): ${ctx.dom.jsonLd.length} bloco(s)`,
    '',
    `PROBLEMAS ENCONTRADOS (${issues.length} no total, listados por prioridade):`,
  ];

  for (const issue of issues.slice(0, 30)) {
    lines.push(
      `- [${issue.priority.toUpperCase()} · ${issue.severity} · ${issue.category}] ${issue.title}` +
        ` — ${issue.description} (correção estimada em ${issue.estimatedMinutes} min; ganho: ${issue.expectedGain})`,
    );
  }

  if (issues.length > 30) {
    lines.push(`... e mais ${issues.length - 30} problema(s) de menor prioridade.`);
  }

  lines.push('', 'Produza a análise seguindo o schema solicitado.');
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

export async function runAiAnalysis(input: AnalysisInput): Promise<AiAnalysis> {
  const anthropic = getClient();

  if (!anthropic) {
    return unavailable(
      'Módulo de IA desativado: defina ANTHROPIC_API_KEY no .env para habilitar a análise em linguagem natural.',
    );
  }

  try {
    // Streaming evita timeout de HTTP em respostas longas; finalMessage()
    // devolve a mensagem completa sem precisar tratar cada evento.
    const stream = anthropic.messages.stream({
      model: config.ai.model,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      output_config: {
        effort: config.ai.effort,
        format: { type: 'json_schema', schema: ANALYSIS_SCHEMA },
      },
      messages: [{ role: 'user', content: buildPrompt(input) }],
    } as Parameters<typeof anthropic.messages.stream>[0]);

    const message = await stream.finalMessage();

    if (message.stop_reason === 'refusal') {
      return unavailable('O modelo recusou a análise para este conteúdo.');
    }

    const textBlock = message.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return unavailable('Resposta da IA sem conteúdo textual.');
    }

    const parsed = JSON.parse(textBlock.text) as Omit<AiAnalysis, 'available'>;

    return {
      available: true,
      executiveSummary: parsed.executiveSummary ?? '',
      mainProblems: parsed.mainProblems ?? [],
      impacts: parsed.impacts ?? '',
      priorities: parsed.priorities ?? [],
      estimatedGains: parsed.estimatedGains ?? '',
      actionPlan: parsed.actionPlan ?? [],
      technicalNotes: parsed.technicalNotes ?? [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return unavailable(`Falha ao gerar a análise por IA: ${message}`);
  }
}
