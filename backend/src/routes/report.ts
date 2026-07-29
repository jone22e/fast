import type { FastifyInstance, FastifyReply } from 'fastify';
import { generateReportPdf } from '../report/pdf.js';
import { getReport } from '../report/store.js';
import type { AuditReport } from '../core/types.js';
import { normalizeLang } from '../i18n/index.js';
import type { Lang } from '../i18n/index.js';

/** Validação leve: o relatório é gerado pela própria FAST e volta para virar PDF. */
function looksLikeReport(body: unknown): body is AuditReport {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  return (
    typeof r.overallScore === 'number' &&
    Array.isArray(r.categories) &&
    Array.isArray(r.issues) &&
    typeof r.summary === 'object' &&
    typeof r.ai === 'object'
  );
}

function fileName(report: AuditReport): string {
  try {
    return `fast-audit-${new URL(report.finalUrl).hostname}.pdf`;
  } catch {
    return 'fast-audit.pdf';
  }
}

async function sendPdf(report: AuditReport, lang: Lang, reply: FastifyReply): Promise<void> {
  const pdf = await generateReportPdf(report, lang);
  reply
    .header('Content-Type', 'application/pdf')
    .header('Content-Disposition', `attachment; filename="${fileName(report)}"`)
    // O PDF vem de uma auditoria efêmera: nada de cache em borda.
    .header('Cache-Control', 'no-store')
    .send(pdf);
}

export async function reportRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Exportação por id — o caminho normal.
   *
   * O relatório já está na memória do servidor desde o fim da auditoria, então
   * o navegador não precisa devolvê-lo. Isso evita o POST de dezenas de KB
   * contendo os próprios textos de correção (`<script>`, `eval()`, "SQL
   * injection"), que um WAF na frente do site bloqueia com 403 antes mesmo de
   * a requisição chegar à aplicação.
   */
  app.get('/api/report/pdf/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as { lang?: string };
    const lang = normalizeLang(query.lang ?? request.headers['accept-language']);

    const report = getReport(id);
    if (!report) {
      return reply.code(404).send({
        error: 'Relatório expirado. Execute a auditoria novamente para exportar o PDF.',
        expired: true,
      });
    }

    try {
      return await sendPdf(report, lang, reply);
    } catch (error) {
      request.log.error({ err: error }, 'pdf generation failed');
      return reply.code(500).send({ error: 'Falha ao gerar o PDF.' });
    }
  });

  /**
   * Exportação enviando o relatório — reserva.
   *
   * Continua valendo para quem consome a API direto (sem passar pelo id) e para
   * relatórios que já saíram da guarda. Atrás de um WAF pode voltar 403: é
   * exatamente o motivo de a rota por id existir.
   */
  app.post(
    '/api/report/pdf',
    // O relatório com todas as evidências pode passar de 1 MB.
    { bodyLimit: 12 * 1024 * 1024 },
    async (request, reply) => {
      if (!looksLikeReport(request.body)) {
        return reply.code(400).send({ error: 'Corpo inválido: envie um relatório de auditoria da FAST.' });
      }

      // O corpo do relatório já vem traduzido do cliente; o idioma aqui define
      // os rótulos da página impressa (seções, legendas, rodapé).
      const query = request.query as { lang?: string };
      const lang = normalizeLang(query.lang ?? request.headers['accept-language']);

      try {
        return await sendPdf(request.body, lang, reply);
      } catch (error) {
        request.log.error({ err: error }, 'pdf generation failed');
        return reply.code(500).send({ error: 'Falha ao gerar o PDF.' });
      }
    },
  );
}
