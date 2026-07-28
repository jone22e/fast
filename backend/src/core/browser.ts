import { chromium, type Browser } from 'playwright';
import { config } from '../config.js';

/**
 * Instância única do Chromium headless, reaproveitada entre auditorias.
 * Cada auditoria abre seu próprio contexto isolado (sem estado compartilhado).
 */
let browserPromise: Promise<Browser> | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    });
  }

  const browser = await browserPromise;
  if (!browser.isConnected()) {
    browserPromise = null;
    return getBrowser();
  }
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (!browserPromise) return;
  const browser = await browserPromise.catch(() => null);
  browserPromise = null;
  await browser?.close().catch(() => undefined);
}

export const USER_AGENT =
  `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ` +
  `Chrome/131.0.0.0 Safari/537.36 FastAudit/1.0 (+https://${config.domain})`;

export const MOBILE_USER_AGENT =
  `Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) ` +
  `Chrome/131.0.0.0 Mobile Safari/537.36 FastAudit/1.0 (+https://${config.domain})`;
