import type { FastifyInstance } from 'fastify';
import { generateReportPdf } from '../report/pdf.js';
import type { AuditReport } from '../core/types.js';

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

export async function reportRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/api/report/pdf',
    // O relatório com todas as evidências pode passar de 1 MB.
    { bodyLimit: 12 * 1024 * 1024 },
    async (request, reply) => {
      if (!looksLikeReport(request.body)) {
        return reply.code(400).send({ error: 'Corpo inválido: envie um relatório de auditoria da FAST.' });
      }

      try {
        const pdf = await generateReportPdf(request.body);
        const host = (() => {
          try {
            return new URL(request.body.finalUrl).hostname;
          } catch {
            return 'fast';
          }
        })();

        reply
          .header('Content-Type', 'application/pdf')
          .header('Content-Disposition', `attachment; filename="fast-audit-${host}.pdf"`)
          .send(pdf);
      } catch (error) {
        request.log.error({ err: error }, 'pdf generation failed');
        return reply.code(500).send({ error: 'Falha ao gerar o PDF.' });
      }
    },
  );
}
