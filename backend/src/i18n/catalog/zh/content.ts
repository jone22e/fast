import type { PluginCatalog } from '../../types.js';

export const content: PluginCatalog = {
  name: '内容',
  description: '清晰度、深度、可读性、冗余度、可扫读性以及内容单薄的迹象。',
  checks: {
    'word-count': '内容篇幅',
    readability: '可读性指数',
    'sentence-length': '句子平均长度',
    scannability: '可扫读性（约每 200 词一个标题）',
    structure: '列表与表格的使用',
    'keyword-density': '关键词密度是否合理',
    redundancy: '冗余度低',
    promotional: '内容与推广的平衡',
    depth: '论述深度',
    vocabulary: '词汇丰富度',
  },
  issues: {
    'content-thin': {
      title: '内容单薄（{0} 个词）',
      description:
        '文字过少的页面很难完整回应用户意图，无论搜索引擎还是 AI 模型都会将其排在后面——它们需要足够的素材才能提炼出答案。',
      fix: '围绕受众真正的疑问扩充内容：背景、工作原理、适用人群、对比与示例。目标是 600 词以上的实质内容，而非凑字数。',
      gain: '覆盖更多搜索词，被 AI 引用的机会更大。',
    },
    'content-hard-to-read': {
      title: '文本阅读困难（指数 {0}/100）',
      description: '句子平均 {0} 个词，加上冗长的用词，使阅读疲惫并缩短页面停留时间。',
      fix: '把长句拆成两句，多用主动语态，替换不必要的术语，段落控制在 3 到 4 行。',
      gain: '停留时间更长，跳出率更低。',
    },
    'content-no-structure': {
      title: '长文没有分节',
      description: '{0} 个词却只有 {1} 个标题。密集的文字块既难以扫读，也难以被自动切分。',
      fix: '把内容拆成 150 到 300 词的小节，每节配一个描述性的 H2 或 H3。',
      gain: '阅读更快，AI 引擎提取内容也更准确。',
    },
    'content-keyword-stuffing': {
      title: '“{0}”一词重复过多（{1}%）',
      description: '密度超过 4% 会被搜索引擎视为操纵行为，也让读者觉得文字生硬。',
      fix: '用同义词和自然变体替换重复，并改写那些词语出现得很生硬的句子。',
      gain: '文字更自然，被处罚的风险更低。',
    },
    'content-duplicate': {
      title: '正文中有 {0} 处重复语句',
      description: '段落重复往往说明内容由模板生成或缺乏校订，也会拉低页面的价值感。',
      fix: '通读并删除冗余段落，把重复的信息合并。',
      gain: '每读一个词获得的信息量更高。',
    },
    'content-too-promotional': {
      title: '推销性表达过多',
      description:
        '{1} 个词中出现了 {0} 处推销用语。以推广为主的内容会被搜索引擎降权，也很少被 AI 当作信息来源引用。',
      fix: '让页面更平衡：先说明（是什么、怎么运作、给谁用），再谈销售。保留行动号召，但减少重复。',
      gain: '读者更信任，也更有资格成为信息来源。',
    },
  },
};
