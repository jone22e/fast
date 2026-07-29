import type { PluginCatalog } from '../../types.js';

export const mobile: PluginCatalog = {
  name: '移动端',
  description: 'viewport、响应式、字号与点击目标尺寸、移动端 CLS 以及响应式图片。',
  checks: {
    viewport: '已配置 viewport 元标签',
    zoom: '允许缩放',
    'no-overflow': '无横向滚动',
    'font-size': '字号可读（≥ 12px）',
    'tap-targets': '点击目标不小于 44×44px',
    'mobile-lcp': '移动端 LCP',
    'mobile-cls': '移动端 CLS',
    'responsive-images': '图片带 srcset',
  },
  issues: {
    'mobile-no-viewport': {
      description:
        '缺少 width=device-width 时，移动浏览器会按桌面宽度（980px）渲染页面并整体缩小，文字因此无法辨认。',
      fix: '在 <head> 中添加：<meta name="viewport" content="width=device-width, initial-scale=1">',
      gain: '在移动设备上正确渲染——这是一切移动端优化的前提。',
    },
    'mobile-zoom-blocked': {
      title: 'viewport 中禁用了缩放',
      description: '禁止缩放会封死一项对低视力人群至关重要的无障碍功能。',
      fix: '从 viewport 元标签中移除 user-scalable=no 与 maximum-scale=1。',
      gain: '符合 WCAG 1.4.4（调整文字大小）。',
    },
    'mobile-horizontal-scroll': {
      title: '页面在移动端出现横向滚动',
      description: '有 {0} 个元素超出了 {1}px 的屏幕宽度，用户必须左右滑动才能读完内容。',
      fix: '找出列出的元素并设置 max-width: 100%、box-sizing: border-box 与 width: auto。表格和代码块应放进各自带 overflow-x: auto 的容器中。',
      gain: '在任何屏幕宽度下都能舒适阅读。',
    },
    'mobile-small-fonts': {
      title: '{0} 个元素字号小于 12px',
      description: '文字过小会迫使用户放大才能阅读，而这几乎总是以离开页面告终。',
      fix: '正文至少使用 16px，辅助文字至少 14px。优先使用相对单位（rem）而非固定像素。',
      gain: '无需缩放即可阅读，移动端跳出率更低。',
    },
    'mobile-small-tap-targets': {
      title: '{0} 个点击目标小于 44×44px',
      description: '过小的链接和按钮会导致误触。44×44 像素的建议来自成年人指尖的平均大小。',
      fix: '增加交互元素的内边距，使可点击区域达到 44×44px，并让相邻目标之间至少留出 8px 间距。',
      gain: '误触更少，手机上的操作更顺畅。',
    },
    'mobile-cls-regression': {
      title: '移动端布局远不如桌面稳定（CLS {0}，桌面为 {1}）',
      description: '移动端的布局偏移明显更严重，说明某些元素只在窄屏下才重新排布。',
      fix: '在移动断点上为横幅、轮播和广告预留高度，并为所有图片声明尺寸。',
      gain: '移动端 CLS 进入良好区间，误点击更少。',
    },
    'mobile-no-srcset': {
      title: '图片没有响应式版本',
      description: '{1} 张图片中有 {0} 张只提供单一尺寸。在手机上，这意味着把桌面版图片下载到 390px 的屏幕上。',
      fix: '生成多种宽度的版本并使用 srcset 配合 sizes，或用 <picture> 按断点提供 <source media>。',
      gain: '移动设备上的图片体积通常可减少 50% 到 70%。',
    },
  },
};
