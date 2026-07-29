import type { PluginCatalog } from '../../types.js';

export const accessibility: PluginCatalog = {
  name: '无障碍',
  description: '对比度、替代文本、表单标签、键盘导航与语义地标。',
  checks: {
    alt: '图片带 alt 属性',
    'alt-quality': 'alt 具有描述性（非笼统）',
    labels: '表单字段有标签',
    contrast: '文字对比度符合 WCAG AA',
    aria: 'ARIA 属性的使用',
    tabindex: '没有正值 tabindex',
    landmarks: '导航地标（header/nav/main/footer）',
    lang: '已声明语言',
    focusable: '存在可聚焦元素',
    'link-text': '链接有描述性文字',
    'link-text-quality': '链接文字具体明确',
  },
  issues: {
    'a11y-missing-alt': {
      title: '{0} 张图片缺少 alt 属性',
      description:
        '没有 alt 时，屏幕阅读器只会念出文件名，信息因此无法获取。alt 也是图片加载失败时显示的文字。',
      fix: '为每张信息性图片添加描述性的 alt。纯装饰图片请使用 alt=""（留空但保留属性），让屏幕阅读器跳过。',
      gain: '符合 WCAG 1.1.1，内容对屏幕阅读器用户可用。',
    },
    'a11y-unlabeled-inputs': {
      title: '{0} 个表单字段没有标签',
      description:
        '没有关联的 <label>（或 aria-label），屏幕阅读器用户根本不知道该填什么。这是最具阻断性的无障碍问题之一。',
      fix: '为每个字段关联 <label for="字段id">。若不希望显示可见标签，请在字段上使用 aria-label。',
      gain: '表单可用屏幕阅读器完成，符合 WCAG 3.3.2。',
    },
    'a11y-contrast': {
      title: '{0} 个元素对比度不足',
      description:
        '最差的一处对比度为 {0}:1，低于 WCAG AA 对正文要求的 4.5:1。这会影响强光屏幕、户外阳光下以及低视力人群的阅读。',
      fix: '加深文字颜色或调亮背景，直到达到 4.5:1（大号字或 18.66px 以上的粗体为 3:1）。请用对比度检测工具复核。',
      gain: '所有用户都能舒适阅读，符合 WCAG 1.4.3。',
    },
    'a11y-positive-tabindex': {
      title: '{0} 个元素使用了正值 tabindex',
      description:
        'tabindex 大于零会强制形成人为的 Tab 顺序，它几乎总是与视觉顺序不一致，令键盘用户困惑。',
      fix: '用 tabindex="0" 让元素按自然顺序可聚焦，用 "-1" 将其移出 Tab 序列。顺序请在 DOM 中调整，而不是靠 tabindex。',
      gain: '键盘导航顺序可预期。',
    },
    'a11y-no-main-landmark': {
      title: '缺少 <main> 地标',
      description:
        '屏幕阅读器用户依靠主地标跳过导航直达内容。没有它，他们每进入一个页面都要把整个菜单 Tab 一遍。',
      fix: '用 <main> 包裹主内容，并在页面顶部添加指向它的“跳到主内容”链接。',
      gain: '辅助技术用户的浏览速度大幅提升。',
    },
    'a11y-no-lang': {
      title: '未声明页面语言',
      description: '缺少 lang 时，屏幕阅读器会使用系统默认语音，可能以错误的语音规则朗读内容。',
      fix: '在 <html> 标签上添加 lang="zh-CN"（或正确的语言代码）。',
      gain: '屏幕阅读器发音正确（WCAG 3.1.1）。',
    },
    'a11y-empty-links': {
      title: '{0} 个链接没有可访问的文字',
      description:
        '只包含图标或无 alt 图片的链接，会被屏幕阅读器简单念作“链接”，用户完全不知道会跳到哪里。',
      fix: '为链接添加 aria-label，或为其中的图片补充描述性 alt，或加入带 sr-only 类的视觉隐藏文字。',
      gain: '所有链接脱离视觉语境后依然可以理解。',
    },
  },
};
