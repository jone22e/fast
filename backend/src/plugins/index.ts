import { registerPlugin } from '../core/registry.js';
import accessibility from './accessibility/index.js';
import content from './content/index.js';
import geo from './geo/index.js';
import infrastructure from './infrastructure/index.js';
import mobile from './mobile/index.js';
import performance from './performance/index.js';
import security from './security/index.js';
import seo from './seo/index.js';
import ux from './ux/index.js';

/**
 * Ponto único de registro. Para adicionar um módulo de auditoria basta
 * criar a pasta em `plugins/`, exportar um AuditPlugin e incluí-lo aqui —
 * nada no núcleo precisa mudar.
 */
export function registerAllPlugins(): void {
  registerPlugin(performance);
  registerPlugin(seo);
  registerPlugin(geo);
  registerPlugin(content);
  registerPlugin(accessibility);
  registerPlugin(security);
  registerPlugin(infrastructure);
  registerPlugin(mobile);
  registerPlugin(ux);
}
