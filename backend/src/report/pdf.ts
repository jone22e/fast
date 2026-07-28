import { getBrowser } from '../core/browser.js';
import type { AuditReport, CategoryScore, Issue, Severity } from '../core/types.js';

/**
 * Gera um PDF profissional do relatório usando o Chromium do Playwright.
 * Tema claro, pronto para impressão e compartilhamento, com gráficos em SVG.
 */

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function scoreColor(score: number): string {
  if (score >= 90) return '#16a34a';
  if (score >= 50) return '#d97706';
  return '#dc2626';
}

function scoreLabel(score: number): string {
  if (score >= 90) return 'Excelente';
  if (score >= 75) return 'Bom';
  if (score >= 50) return 'Precisa melhorar';
  return 'Crítico';
}

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Médio',
  low: 'Baixo',
  info: 'Info',
};

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#d97706',
  low: '#64748b',
  info: '#64748b',
};

const PRIORITY_LABEL: Record<string, string> = {
  alta: 'Prioridade alta',
  media: 'Prioridade média',
  baixa: 'Prioridade baixa',
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  if (hours < 8) return `${hours.toFixed(1).replace('.0', '')} h`;
  return `${(hours / 8).toFixed(1).replace('.0', '')} dia(s)`;
}

/** Gráfico de rosca com a nota no centro. */
function donut(score: number, size = 132): string {
  const stroke = 13;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, score)) / 100);
  const color = scoreColor(score);
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#e8ecf2" stroke-width="${stroke}" />
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
      stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${offset}"
      transform="rotate(-90 ${size / 2} ${size / 2})" />
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
      font-size="${size * 0.3}" font-weight="700" fill="${color}">${Math.round(score)}</text>
  </svg>`;
}

/** Barra horizontal de uma categoria. */
function categoryBar(c: CategoryScore): string {
  const color = scoreColor(c.score);
  return `
  <div class="cat-row">
    <span class="cat-name">${esc(c.label)}</span>
    <div class="cat-track"><div class="cat-fill" style="width:${c.score}%;background:${color}"></div></div>
    <span class="cat-val" style="color:${color}">${c.score}</span>
    <span class="cat-issues">${c.issueCount === 0 ? '—' : `${c.issueCount} prob.`}</span>
  </div>`;
}

function issueBlock(issue: Issue, categoryLabel: string): string {
  const evidences =
    issue.evidence && issue.evidence.length
      ? `<div class="ev"><span class="ev-h">Evidências</span>${issue.evidence
          .slice(0, 6)
          .map((e) => `<code>${esc(e)}</code>`)
          .join('')}</div>`
      : '';
  return `
  <div class="issue">
    <div class="issue-top">
      <span class="sev-dot" style="background:${SEVERITY_COLOR[issue.severity]}"></span>
      <strong>${esc(issue.title)}</strong>
    </div>
    <div class="tags">
      <span class="tag">${esc(categoryLabel)}</span>
      <span class="tag" style="color:${SEVERITY_COLOR[issue.severity]}">${SEVERITY_LABEL[issue.severity]}</span>
      <span class="tag">${esc(PRIORITY_LABEL[issue.priority] ?? issue.priority)}</span>
      <span class="tag">${formatDuration(issue.estimatedMinutes)}</span>
    </div>
    <p class="issue-desc">${esc(issue.description)}</p>
    <div class="fix">
      <div><span class="fix-h">Como corrigir</span><p>${esc(issue.howToFix)}</p></div>
      <div><span class="fix-h">Ganho esperado</span><p>${esc(issue.expectedGain)}</p></div>
    </div>
    ${evidences}
  </div>`;
}

function aiSection(report: AuditReport): string {
  const ai = report.ai;
  if (!ai.available) {
    return `
    <section class="block ai">
      <h2><span class="ai-badge">IA</span> Visão da Inteligência Artificial</h2>
      <p class="muted">${esc(ai.error || 'Análise por IA indisponível nesta auditoria.')}</p>
    </section>`;
  }

  const list = (items: string[], ordered = false): string => {
    const tag = ordered ? 'ol' : 'ul';
    return `<${tag}>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</${tag}>`;
  };

  const plan = ai.actionPlan
    .map(
      (s) => `
    <div class="step">
      <span class="step-n">${esc(s.step)}</span>
      <div><div class="step-top"><strong>${esc(s.title)}</strong><span class="step-effort">${esc(s.effort)}</span></div>
      <p>${esc(s.detail)}</p></div>
    </div>`,
    )
    .join('');

  return `
  <section class="block ai">
    <h2><span class="ai-badge">IA</span> Visão da Inteligência Artificial</h2>
    <div class="ai-summary">${esc(ai.executiveSummary)}</div>
    <div class="ai-grid">
      ${ai.mainProblems.length ? `<div class="ai-col"><h3>Principais problemas</h3>${list(ai.mainProblems)}</div>` : ''}
      ${ai.priorities.length ? `<div class="ai-col"><h3>Ordem de prioridade</h3>${list(ai.priorities, true)}</div>` : ''}
    </div>
    ${ai.impacts ? `<div class="ai-full"><h3>Impacto no negócio</h3><p>${esc(ai.impacts)}</p></div>` : ''}
    ${ai.estimatedGains ? `<div class="ai-gain"><h3>Ganhos estimados</h3><p>${esc(ai.estimatedGains)}</p></div>` : ''}
    ${plan ? `<div class="ai-full"><h3>Plano de ação</h3><div class="plan">${plan}</div></div>` : ''}
    ${ai.technicalNotes.length ? `<div class="ai-full"><h3>Notas técnicas</h3>${list(ai.technicalNotes)}</div>` : ''}
  </section>`;
}

const LOGO = `<svg width="30" height="30" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="pa" x1="96" y1="264" x2="416" y2="264" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#3b82f6"/><stop offset=".42" stop-color="#8b5cf6"/>
      <stop offset=".72" stop-color="#f97316"/><stop offset="1" stop-color="#f59e0b"/></linearGradient>
    <linearGradient id="pb" x1="256" y1="178" x2="256" y2="466" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffe24d"/><stop offset=".5" stop-color="#ffb02e"/><stop offset="1" stop-color="#ff8a00"/></linearGradient>
  </defs>
  <rect x="8" y="8" width="496" height="496" rx="112" fill="#0c1018"/>
  <path d="M 90.6 352.2 A 176 176 0 1 1 421.4 352.2" fill="none" stroke="url(#pa)" stroke-width="26" stroke-linecap="round"/>
  <path d="M 286 182 L 196 320 L 250 320 L 214 462 L 326 296 L 270 296 Z" fill="url(#pb)" stroke="#c96a00" stroke-width="3" stroke-linejoin="round"/>
  <polygon points="370.9,195.5 261.8,298.9 236.1,308.7 250.2,285.1" fill="#fff"/>
  <circle cx="256" cy="292" r="17" fill="#0e131c" stroke="#e2e8f0" stroke-width="4"/>
</svg>`;

export function renderHtml(report: AuditReport): string {
  const geo = report.plugins.find((p) => p.id === 'geo');
  const aiScore = typeof geo?.evidence?.aiScore === 'number' ? (geo.evidence.aiScore as number) : null;
  const categoryLabels = new Map(report.categories.map((c) => [c.category, c.label]));
  const date = new Date(report.generatedAt).toLocaleString('pt-BR');
  const categoriesSorted = [...report.categories].sort((a, b) => a.score - b.score);

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    color: #1a2231; font-size: 12px; line-height: 1.55; background: #fff;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  h1, h2, h3 { margin: 0; font-weight: 700; letter-spacing: -0.01em; }
  p { margin: 0 0 6px; }
  .muted { color: #64748b; }

  /* Capa */
  .cover { padding: 4px 0 18px; border-bottom: 2px solid #eef1f6; margin-bottom: 20px; }
  .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 22px; }
  .brand .name { font-size: 20px; font-weight: 750; letter-spacing: -0.03em; }
  .brand .kicker { margin-left: auto; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
  .hero { display: flex; align-items: center; gap: 26px; }
  .hero .verdict { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
  .hero-meta { flex: 1; }
  .hero-meta .url { font-size: 18px; font-weight: 700; word-break: break-all; }
  .hero-meta .date { color: #64748b; font-size: 11px; margin-bottom: 12px; }
  .stats { display: flex; flex-wrap: wrap; gap: 22px; }
  .stat b { display: block; font-size: 20px; font-weight: 700; line-height: 1.1; }
  .stat span { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }

  /* Blocos */
  .block { margin-bottom: 22px; break-inside: avoid; }
  .block > h2 { font-size: 15px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #eef1f6; }

  /* Categorias */
  .cat-row { display: flex; align-items: center; gap: 10px; padding: 5px 0; }
  .cat-name { width: 130px; font-size: 11.5px; font-weight: 600; }
  .cat-track { flex: 1; height: 8px; background: #eef1f6; border-radius: 4px; overflow: hidden; }
  .cat-fill { height: 100%; border-radius: 4px; }
  .cat-val { width: 26px; text-align: right; font-weight: 700; font-size: 13px; }
  .cat-issues { width: 52px; text-align: right; font-size: 10px; color: #94a3b8; }

  /* IA */
  .ai > h2 { border-color: #dfe7fb; }
  .ai-badge { display: inline-block; background: #eef3ff; color: #2f6fe0; border: 1px solid #cfe0ff;
    border-radius: 5px; padding: 0 6px; font-size: 10px; font-weight: 700; vertical-align: middle; margin-right: 4px; }
  .ai-summary { background: linear-gradient(135deg, #f2f6ff, #f7f4ff); border: 1px solid #dfe7fb;
    border-radius: 10px; padding: 14px 16px; font-size: 13px; line-height: 1.65; margin-bottom: 14px; }
  .ai-grid { display: flex; gap: 16px; margin-bottom: 12px; }
  .ai-col { flex: 1; }
  .ai-col h3, .ai-full h3, .ai-gain h3 { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; margin-bottom: 6px; }
  .ai-col ul, .ai-col ol, .ai-full ul { margin: 0; padding-left: 16px; }
  .ai-col li, .ai-full li { margin-bottom: 4px; }
  .ai-full { margin-bottom: 12px; }
  .ai-gain { background: #f0faf4; border: 1px solid #cdeadc; border-radius: 8px; padding: 11px 14px; margin-bottom: 12px; }
  .ai-gain p { color: #166534; }
  .plan { display: grid; gap: 8px; }
  .step { display: flex; gap: 11px; background: #f8fafc; border: 1px solid #eef1f6; border-radius: 8px; padding: 10px 12px; break-inside: avoid; }
  .step-n { width: 22px; height: 22px; flex-shrink: 0; display: grid; place-items: center; border-radius: 50%;
    background: #eef3ff; color: #2f6fe0; font-weight: 700; font-size: 11px; }
  .step-top { display: flex; align-items: baseline; gap: 8px; }
  .step-effort { font-size: 9.5px; color: #64748b; border: 1px solid #e2e8f0; border-radius: 4px; padding: 0 5px; }
  .step p { margin: 3px 0 0; color: #475569; }

  /* Problemas */
  .issue { border: 1px solid #eef1f6; border-radius: 9px; padding: 12px 14px; margin-bottom: 9px; break-inside: avoid; }
  .issue-top { display: flex; align-items: center; gap: 8px; }
  .issue-top strong { font-size: 12.5px; }
  .sev-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .tags { display: flex; flex-wrap: wrap; gap: 5px; margin: 6px 0 8px; }
  .tag { font-size: 9.5px; color: #475569; background: #f4f6fa; border: 1px solid #e6eaf1; border-radius: 4px; padding: 1px 6px; }
  .issue-desc { color: #475569; margin: 0 0 8px; }
  .fix { display: flex; gap: 16px; }
  .fix > div { flex: 1; }
  .fix-h { display: block; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 2px; }
  .fix p { margin: 0; font-size: 11px; color: #334155; }
  .ev { margin-top: 8px; }
  .ev-h { display: block; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 3px; }
  .ev code { display: block; font-family: ui-monospace, Menlo, monospace; font-size: 9.5px; color: #475569;
    background: #f8fafc; border: 1px solid #eef1f6; border-radius: 4px; padding: 3px 6px; margin-bottom: 3px; word-break: break-all; }

  .cat-page { break-before: page; }
</style></head><body>

  <section class="cover">
    <div class="brand">${LOGO}<span class="name">FAST</span><span class="kicker">Relatório de auditoria web</span></div>
    <div class="hero">
      <div style="text-align:center">
        ${donut(report.overallScore)}
        <div class="verdict" style="color:${scoreColor(report.overallScore)}">${scoreLabel(report.overallScore)}</div>
      </div>
      <div class="hero-meta">
        <div class="url">${esc(report.finalUrl)}</div>
        <div class="date">Analisado em ${esc(date)}</div>
        <div class="stats">
          <div class="stat"><b>${report.summary.totalIssues}</b><span>Problemas</span></div>
          <div class="stat"><b style="color:#dc2626">${report.summary.critical}</b><span>Críticos</span></div>
          <div class="stat"><b style="color:#ea580c">${report.summary.high}</b><span>Altos</span></div>
          ${aiScore !== null ? `<div class="stat"><b style="color:${scoreColor(aiScore)}">${aiScore}</b><span>IA Score</span></div>` : ''}
          <div class="stat"><b>${formatDuration(report.summary.estimatedMinutes)}</b><span>de correção</span></div>
        </div>
      </div>
    </div>
  </section>

  <section class="block">
    <h2>Notas por categoria</h2>
    ${categoriesSorted.map(categoryBar).join('')}
  </section>

  ${aiSection(report)}

  <section class="block cat-page">
    <h2>Problemas encontrados (${report.issues.length})</h2>
    ${report.issues.map((i) => issueBlock(i, categoryLabels.get(i.category) ?? i.category)).join('')}
  </section>

</body></html>`;
}

/** Renderiza o relatório em PDF e devolve o buffer. */
export async function generateReportPdf(report: AuditReport): Promise<Buffer> {
  const browser = await getBrowser();
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.setContent(renderHtml(report), { waitUntil: 'networkidle' });
    const host = (() => {
      try {
        return new URL(report.finalUrl).hostname;
      } catch {
        return 'fast';
      }
    })();
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '16mm', bottom: '18mm', left: '15mm', right: '15mm' },
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `<div style="width:100%;font-size:8px;color:#94a3b8;padding:0 15mm;display:flex;justify-content:space-between;">
        <span>FAST · Auditoria de ${esc(host)}</span>
        <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
      </div>`,
    });
    return Buffer.from(pdf);
  } finally {
    await context.close().catch(() => undefined);
  }
}
