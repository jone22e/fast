import { fromPlugins } from '../../types.js';
import type { LangCatalog } from '../../types.js';
import { accessibility } from './accessibility.js';
import { content } from './content.js';
import { geo } from './geo.js';
import { infrastructure } from './infrastructure.js';
import { mobile } from './mobile.js';
import { performance } from './performance.js';
import { protection } from './protection.js';
import { security } from './security.js';
import { seo } from './seo.js';
import { ux } from './ux.js';

/** Catálogo completo do relatório. As chaves seguem os ids dos módulos. */
export const en: LangCatalog = fromPlugins({
  accessibility,
  content,
  geo,
  infrastructure,
  mobile,
  performance,
  protection,
  security,
  seo,
  ux,
});
