import type { Pattern } from '../types.js';

/**
 * Frases que variam conforme o caso dentro de um mesmo problema.
 *
 * Alguns problemas mudam de texto conforme o que foi medido — "Meta viewport
 * ausente" ou "mal configurada", "Sem WAF" ou "WAF não confirmado". Como as
 * duas variantes dividem o mesmo id, o catálogo por id não dá conta: elas são
 * traduzidas pelo próprio texto, como último passo antes de desistir e manter
 * o original.
 */
export const SENTENCE_PATTERNS: Pattern[] = [
  // ---- seo-title-length -----------------------------------------------------
  {
    pt: 'Títulos muito curtos desperdiçam espaço nos resultados e transmitem pouco contexto.',
    en: 'Very short titles waste space in the results and convey little context.',
    es: 'Los títulos muy cortos desperdician espacio en los resultados y transmiten poco contexto.',
    zh: '标题过短会浪费搜索结果中的展示空间，也传递不了多少信息。',
  },
  {
    pt: 'Títulos longos são truncados nos resultados de busca, escondendo informação relevante.',
    en: 'Long titles get truncated in search results, hiding relevant information.',
    es: 'Los títulos largos se truncan en los resultados de búsqueda y ocultan información relevante.',
    zh: '过长的标题会在搜索结果中被截断，隐藏关键信息。',
  },

  // ---- seo-og-incomplete ----------------------------------------------------
  {
    pt: 'Adicione no <head>: {0}. A og:image deve ter ao menos 1200×630 px.',
    en: 'Add to the <head>: {0}. The og:image must be at least 1200×630 px.',
    es: 'Agregue en el <head>: {0}. La og:image debe tener al menos 1200×630 px.',
    zh: '在 <head> 中添加：{0}。og:image 至少需要 1200×630 像素。',
  },

  // ---- geo-llms-weak --------------------------------------------------------
  {
    pt: 'O arquivo existe mas não tem título H1 e tem apenas {0} link(s). Modelos extraem pouco valor dele.',
    en: 'The file exists but has no H1 heading and only {0} link(s). Models get little value out of it.',
    es: 'El archivo existe pero no tiene título H1 y solo tiene {0} enlace(s). Los modelos extraen poco valor de él.',
    zh: '文件存在，但缺少 H1 标题且仅有 {0} 个链接，模型从中获取的信息十分有限。',
  },
  {
    pt: 'O arquivo existe mas não tem título H1. Modelos extraem pouco valor dele.',
    en: 'The file exists but has no H1 heading. Models get little value out of it.',
    es: 'El archivo existe pero no tiene título H1. Los modelos extraen poco valor de él.',
    zh: '文件存在，但缺少 H1 标题，模型从中获取的信息十分有限。',
  },
  {
    pt: 'O arquivo existe mas tem apenas {0} link(s). Modelos extraem pouco valor dele.',
    en: 'The file exists but has only {0} link(s). Models get little value out of it.',
    es: 'El archivo existe pero solo tiene {0} enlace(s). Los modelos extraen poco valor de él.',
    zh: '文件存在，但仅有 {0} 个链接，模型从中获取的信息十分有限。',
  },

  // ---- mobile-no-viewport ---------------------------------------------------
  { pt: 'Meta viewport mal configurada', en: 'Misconfigured viewport meta tag', es: 'Meta viewport mal configurada', zh: 'viewport 元标签配置有误' },
  { pt: 'Meta viewport ausente', en: 'Viewport meta tag missing', es: 'Meta viewport ausente', zh: '缺少 viewport 元标签' },

  // ---- prot-no-waf ----------------------------------------------------------
  { pt: 'WAF não confirmado', en: 'WAF not confirmed', es: 'WAF no confirmado', zh: '未确认存在 WAF' },
  { pt: 'Sem WAF na frente do site', en: 'No WAF in front of the site', es: 'Sin WAF delante del sitio', zh: '站点前方没有 WAF' },
  {
    pt: 'Há um CDN/proxy na frente, mas nenhuma assinatura de WAF foi identificada nas respostas. A detecção é passiva e não vê todos os WAFs; confirme se as regras de firewall de aplicação estão de fato ativas no seu provedor de borda.',
    en: 'There is a CDN/proxy in front, but no WAF signature was found in the responses. Detection is passive and does not see every WAF; confirm that the application firewall rules are actually enabled at your edge provider.',
    es: 'Hay un CDN/proxy delante, pero no se identificó ninguna firma de WAF en las respuestas. La detección es pasiva y no ve todos los WAF; confirme que las reglas del firewall de aplicaciones estén realmente activas en su proveedor de borde.',
    zh: '站点前方存在 CDN/代理，但响应中未发现任何 WAF 特征。检测为被动方式，无法识别所有 WAF；请在边缘服务商处确认应用防火墙规则确实已启用。',
  },
  {
    pt: 'Não há CDN/proxy nem assinatura de WAF nas respostas — o site aparenta receber requisições diretamente na origem ({0}). Sem WAF, cada tentativa de SQL injection, XSS ou varredura automatizada chega direto à aplicação.',
    en: 'No CDN/proxy and no WAF signature in the responses — the site appears to take requests straight at the origin ({0}). Without a WAF, every SQL injection attempt, XSS payload or automated scan reaches the application directly.',
    es: 'No hay CDN/proxy ni firma de WAF en las respuestas: el sitio parece recibir solicitudes directamente en el origen ({0}). Sin WAF, cada intento de inyección SQL, XSS o escaneo automatizado llega directo a la aplicación.',
    zh: '响应中既无 CDN/代理也无 WAF 特征——站点似乎直接在源站接收请求（{0}）。没有 WAF，每一次 SQL 注入尝试、XSS 攻击或自动化扫描都会直达应用。',
  },
  { pt: 'IP não classificado', en: 'unclassified IP', es: 'IP no clasificada', zh: '未归类的 IP' },
  {
    pt: 'No painel do seu CDN (Cloudflare, AWS, etc.), ative o conjunto de regras gerenciadas de WAF (OWASP Core Rule Set) em modo bloqueante e confirme que ele cobre este hostname.',
    en: 'In your CDN dashboard (Cloudflare, AWS, etc.), enable the managed WAF rule set (OWASP Core Rule Set) in blocking mode and confirm it covers this hostname.',
    es: 'En el panel de su CDN (Cloudflare, AWS, etc.), active el conjunto de reglas gestionadas de WAF (OWASP Core Rule Set) en modo bloqueo y confirme que cubre este hostname.',
    zh: '在 CDN 控制台（Cloudflare、AWS 等）中，以拦截模式启用托管 WAF 规则集（OWASP 核心规则集），并确认其覆盖该主机名。',
  },
  {
    pt: 'Passo a passo: (1) coloque o site atrás de um proxy com WAF — Cloudflare (plano gratuito já inclui regras básicas) ou AWS WAF + CloudFront; (2) ative o OWASP Core Rule Set em modo bloqueante; (3) teste o site normalmente por alguns dias em modo de contagem antes de bloquear, para não barrar tráfego legítimo.',
    en: 'Step by step: (1) put the site behind a proxy with a WAF — Cloudflare (the free plan already includes basic rules) or AWS WAF + CloudFront; (2) enable the OWASP Core Rule Set in blocking mode; (3) run the site in count mode for a few days before blocking, so legitimate traffic is not turned away.',
    es: 'Paso a paso: (1) coloque el sitio detrás de un proxy con WAF: Cloudflare (el plan gratuito ya incluye reglas básicas) o AWS WAF + CloudFront; (2) active el OWASP Core Rule Set en modo bloqueo; (3) use el sitio normalmente durante unos días en modo conteo antes de bloquear, para no frenar tráfico legítimo.',
    zh: '分步操作：(1) 将站点置于带 WAF 的代理之后——Cloudflare（免费套餐已包含基础规则）或 AWS WAF + CloudFront；(2) 以拦截模式启用 OWASP 核心规则集；(3) 正式拦截前先以计数模式运行数日，避免误伤正常流量。',
  },
];
