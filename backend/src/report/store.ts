import { randomUUID } from 'node:crypto';
import type { AuditReport } from '../core/types.js';

/**
 * Guarda temporária dos relatórios recém-gerados, só para a exportação em PDF.
 *
 * Por que existe: exportar exigia devolver o relatório inteiro ao servidor em um
 * POST. O corpo carrega os próprios textos de correção — `<script>`, `<meta>`,
 * `eval()`, "SQL injection" — e um WAF na frente do site (AWS WAF, Cloudflare)
 * lê isso como ataque e responde 403. Quanto mais problemas a auditoria
 * encontra, mais garantido o bloqueio.
 *
 * Com a guarda, o navegador pede o PDF por id: nada de corpo suspeito subindo.
 *
 * O que isto NÃO é: persistência. Fica só em memória, expira em minutos e não
 * sobrevive a um restart — a promessa de não armazenar resultados continua de
 * pé. O teto de entradas existe porque a máquina alvo tem 1 GB: cada relatório
 * ocupa dezenas de kilobytes e um vazamento aqui sairia caro.
 */

const TTL_MS = 15 * 60 * 1000;
const MAX_ENTRIES = 30;

interface Entry {
  report: AuditReport;
  expiresAt: number;
}

const entries = new Map<string, Entry>();

function purge(now: number): void {
  for (const [id, entry] of entries) {
    if (entry.expiresAt <= now) entries.delete(id);
  }

  // Ainda cheio depois de expirar os vencidos: descarta os mais antigos.
  // O Map preserva a ordem de inserção, então os primeiros são os mais velhos.
  while (entries.size > MAX_ENTRIES) {
    const oldest = entries.keys().next().value;
    if (oldest === undefined) break;
    entries.delete(oldest);
  }
}

/** Guarda o relatório e devolve o id para a exportação. */
export function putReport(report: AuditReport): string {
  const now = Date.now();
  purge(now);

  const id = randomUUID();
  entries.set(id, { report, expiresAt: now + TTL_MS });
  return id;
}

/** Recupera um relatório ainda válido, ou null se já expirou. */
export function getReport(id: string): AuditReport | null {
  const entry = entries.get(id);
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    entries.delete(id);
    return null;
  }
  return entry.report;
}

/** Quantos relatórios estão na guarda — usado pelo /api/health. */
export function storedReports(): number {
  return entries.size;
}
