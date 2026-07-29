import os from 'node:os';
import { chromium, type Browser } from 'playwright';
import { config } from '../config.js';

/**
 * Instância única do Chromium headless, reaproveitada entre auditorias.
 * Cada auditoria abre seu próprio contexto isolado (sem estado compartilhado).
 *
 * Em máquina pequena (o alvo é uma t3.micro com 1 GB), o Chromium é o único
 * processo capaz de derrubar o servidor inteiro: ele cresce a cada página
 * carregada e não devolve a memória. Por isso o navegador aqui não é eterno —
 * ele é fechado quando fica ocioso e reciclado a cada N auditorias, e sobe com
 * um conjunto de flags que reduz o número de processos e o tamanho dos caches.
 */

/** Menos de ~1,6 GB de RAM total: trata a máquina como pequena. */
export const LOW_MEMORY =
  config.lowMemory ?? os.totalmem() < 1.6 * 1024 * 1024 * 1024;

const BASE_ARGS = [
  '--no-sandbox',
  // Sem isto o Chromium usa /dev/shm (64 MB por padrão) e quebra ao estourar.
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  // Serviços que só consomem memória em um navegador de auditoria.
  '--disable-background-networking',
  '--disable-client-side-phishing-detection',
  '--disable-component-update',
  '--disable-default-apps',
  '--disable-extensions',
  '--disable-sync',
  '--disable-breakpad',
  '--disable-domain-reliability',
  '--no-first-run',
  '--no-default-browser-check',
  '--mute-audio',
  '--metrics-recording-only',
  '--password-store=basic',
  '--use-mock-keychain',
];

/**
 * Flags extras para máquina pequena.
 *
 * O ganho real vem de duas: desligar o isolamento por site (cada origem deixa
 * de ganhar um processo próprio — uma página com cinco domínios de terceiros
 * passa de seis processos para um) e limitar o heap do renderer, que de outro
 * modo cresce até o limite do sistema em páginas pesadas de JavaScript.
 */
const LOW_MEMORY_ARGS = [
  '--disable-features=site-per-process,IsolateOrigins,TranslateUI,BackForwardCache,MediaRouter,OptimizationHints,InterestFeedContentSuggestions',
  '--renderer-process-limit=2',
  '--js-flags=--max-old-space-size=192',
  '--disk-cache-size=5242880',
  '--media-cache-size=1048576',
  '--enable-low-end-device-mode',
];

let browserPromise: Promise<Browser> | null = null;
/** Auditorias (ou PDFs) usando o navegador neste instante. */
let active = 0;
/** Quantas vezes o navegador foi tomado desde que subiu. */
let usesSinceLaunch = 0;
let idleTimer: NodeJS.Timeout | null = null;

function cancelIdleClose(): void {
  if (!idleTimer) return;
  clearTimeout(idleTimer);
  idleTimer = null;
}

function scheduleIdleClose(): void {
  cancelIdleClose();
  if (config.browserIdleMs <= 0) return;
  idleTimer = setTimeout(() => {
    idleTimer = null;
    if (active === 0) void closeBrowser();
  }, config.browserIdleMs);
  // Um navegador ocioso não deve segurar o processo de pé.
  idleTimer.unref?.();
}

export async function getBrowser(): Promise<Browser> {
  cancelIdleClose();

  if (!browserPromise) {
    usesSinceLaunch = 0;
    browserPromise = chromium.launch({
      headless: true,
      args: LOW_MEMORY ? [...BASE_ARGS, ...LOW_MEMORY_ARGS] : BASE_ARGS,
    });
  }

  const browser = await browserPromise;
  if (!browser.isConnected()) {
    browserPromise = null;
    return getBrowser();
  }
  return browser;
}

/** Marca o início de um uso do navegador (uma auditoria, um PDF). */
export function beginBrowserUse(): void {
  active += 1;
  usesSinceLaunch += 1;
  cancelIdleClose();
}

/**
 * Marca o fim de um uso.
 *
 * Com o navegador livre, decide entre reciclar agora (atingiu o limite de usos)
 * ou agendar o fechamento por ociosidade. Fechar devolve ao sistema toda a
 * memória que o Chromium não devolve sozinho.
 */
export function endBrowserUse(): void {
  active = Math.max(0, active - 1);
  if (active > 0) return;

  if (config.browserMaxUses > 0 && usesSinceLaunch >= config.browserMaxUses) {
    void closeBrowser();
    return;
  }
  scheduleIdleClose();
}

export async function closeBrowser(): Promise<void> {
  cancelIdleClose();
  if (!browserPromise) return;

  const browser = await browserPromise.catch(() => null);
  browserPromise = null;
  usesSinceLaunch = 0;
  await browser?.close().catch(() => undefined);
}

export const USER_AGENT =
  `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ` +
  `Chrome/131.0.0.0 Safari/537.36 FastAudit/1.0 (+https://${config.domain})`;

export const MOBILE_USER_AGENT =
  `Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) ` +
  `Chrome/131.0.0.0 Mobile Safari/537.36 FastAudit/1.0 (+https://${config.domain})`;
