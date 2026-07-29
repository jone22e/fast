import type { PluginCatalog } from '../../types.js';

export const ux: PluginCatalog = {
  name: '用户体验',
  description: '视觉一致性、导航、层级、行动号召、表单以及可交互所需时间。',
  checks: {
    typography: '排版一致性',
    'color-palette': '色板克制',
    nav: '存在主导航',
    'internal-nav': '站内链接充足',
    hierarchy: '视觉层级清晰',
    cta: '行动号召易于识别',
    'cta-quality': '行动号召文字具体',
    'forms-submit': '表单有提交按钮',
    'forms-length': '表单长度合理',
    interactivity: '页面开始响应的时间',
    inp: '交互响应（INP）',
    clickable: '存在可交互元素',
    footer: '页脚结构完整',
  },
  issues: {
    'ux-too-many-fonts': {
      title: '使用了 {0} 种不同字体族',
      description:
        '字体过多会割裂视觉识别，也会增加页面体积——每个字体族都要下载各自的文件。',
      fix: '精简到 2 种字体族（标题一种、正文一种），靠同一族的不同字重制造层次变化。',
      gain: '视觉识别更统一，字体字节数更少。',
    },
    'ux-no-nav': {
      title: '缺少 <nav> 导航元素',
      description: '未发现带语义标记的主导航，用户不易定位，机器也难以理解网站结构。',
      fix: '用 <nav> 包裹主菜单；若存在多个导航区块，请补充 aria-label 区分。',
      gain: '导航结构对用户和辅助技术都清晰。',
    },
    'ux-no-cta': {
      title: '未发现任何行动号召',
      description: '页面没有明显的操作按钮或链接——用户来了、读完了，却不知道下一步该做什么。',
      fix: '在首屏加入醒目的主行动号召，动词要明确（“立即开始”“预约演示”），并使用突出的对比色。',
      gain: '转化率直接提升。',
    },
    'ux-form-no-submit': {
      title: '{0} 个表单没有可见的提交按钮',
      description: '只靠回车键提交的表单，会让一部分用户不知道如何完成填写。',
      fix: '为每个表单添加明确的 <button type="submit">。',
      gain: '填写中途放弃的情况更少。',
    },
    'ux-long-forms': {
      title: '{0} 个表单超过 7 个字段',
      description: '最长的一个有 {0} 个字段。每多一个字段，完成率都会有可测量的下降。',
      fix: '只保留真正必要的字段，其余分步收集，把补充信息留到首次转化之后再要。',
      gain: '表单完成率通常提升 10% 到 25%。',
    },
    'ux-slow-interaction': {
      title: '加载期间页面有 {0} 无法响应',
      description: '这段时间内的点击会被排队或直接丢失，用户会觉得界面卡死了。',
      fix: '延后非必要脚本，用 scheduler.yield() 或 setTimeout 把长任务切块，并按需水合组件。',
      gain: '页面一出现就能响应操作。',
    },
  },
};
