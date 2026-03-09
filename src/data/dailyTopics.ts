export interface DailyTopic {
  keyword: string
  label: string
  description: string
  relatedKeywords: string[]
}

export const dailyTopics: DailyTopic[] = [
  { keyword: 'digital art', label: '数字艺术', description: '探索数字媒介下的无限创作可能', relatedKeywords: ['3d render', 'digital illustration', 'generative art'] },
  { keyword: 'concept art', label: '概念设计', description: '从想象到视觉的概念构思之旅', relatedKeywords: ['game art', 'character concept', 'environment design'] },
  { keyword: 'watercolor painting', label: '水彩画', description: '水与色的流动之美', relatedKeywords: ['gouache', 'aquarelle', 'wet media'] },
  { keyword: 'character design', label: '角色设计', description: '赋予角色独特的灵魂与外形', relatedKeywords: ['character art', 'figure drawing', 'costume design'] },
  { keyword: 'landscape painting', label: '风景画', description: '用画笔捕捉自然的壮丽景色', relatedKeywords: ['nature scenery', 'plein air', 'seascape'] },
  { keyword: 'portrait drawing', label: '人像素描', description: '描绘人物的神态与情感', relatedKeywords: ['face sketch', 'figure portrait', 'pencil drawing'] },
  { keyword: 'abstract art', label: '抽象艺术', description: '超越具象的色彩与形式探索', relatedKeywords: ['geometric art', 'expressionism', 'color field'] },
  { keyword: 'photography composition', label: '摄影构图', description: '用镜头语言讲述视觉故事', relatedKeywords: ['photo art', 'cinematic', 'street photography'] },
  { keyword: 'color palette inspiration', label: '配色灵感', description: '发现和谐美观的色彩搭配', relatedKeywords: ['gradient colors', 'color harmony', 'palette design'] },
  { keyword: 'illustration', label: '插画', description: '以插画传达故事与情感', relatedKeywords: ['book illustration', 'editorial art', 'comic art'] },
  { keyword: 'fantasy art', label: '奇幻艺术', description: '构建超现实的奇幻视觉世界', relatedKeywords: ['dragon art', 'mythical', 'magical landscape'] },
  { keyword: 'minimalist design', label: '极简设计', description: '少即是多的设计哲学', relatedKeywords: ['clean design', 'whitespace', 'simple aesthetic'] },
  { keyword: 'street art graffiti', label: '街头涂鸦', description: '城市墙壁上的自由表达', relatedKeywords: ['mural', 'urban art', 'spray paint'] },
  { keyword: 'nature texture', label: '自然纹理', description: '自然界中的肌理与质感之美', relatedKeywords: ['wood grain', 'stone texture', 'organic pattern'] },
  { keyword: 'architecture design', label: '建筑设计', description: '空间与结构的艺术表达', relatedKeywords: ['interior design', 'modern architecture', 'geometric building'] },
  { keyword: 'retro vintage', label: '复古风格', description: '穿越时空的怀旧视觉美学', relatedKeywords: ['vintage poster', 'old school', 'nostalgic'] },
  { keyword: 'cyberpunk aesthetic', label: '赛博朋克', description: '高科技与低生活的未来想象', relatedKeywords: ['sci-fi', 'neon city', 'futuristic'] },
  { keyword: 'botanical illustration', label: '植物插画', description: '精致描绘植物的自然之美', relatedKeywords: ['flower art', 'plant drawing', 'garden illustration'] },
  { keyword: 'art studio', label: '画室', description: '艺术家的创作空间与灵感来源', relatedKeywords: ['workspace', 'creative space', 'artist tools'] },
  { keyword: 'sculpture', label: '雕塑', description: '立体空间中的造型艺术', relatedKeywords: ['clay art', 'stone carving', '3d sculpture'] },
  { keyword: 'fashion design sketch', label: '服装设计', description: '时尚与创意的交汇之处', relatedKeywords: ['fashion illustration', 'textile design', 'couture'] },
  { keyword: 'ink painting', label: '水墨画', description: '东方美学的墨韵意境', relatedKeywords: ['sumi-e', 'brush painting', 'chinese art'] },
  { keyword: 'pixel art', label: '像素画', description: '像素方格中的复古数字艺术', relatedKeywords: ['8-bit art', 'retro game', 'voxel art'] },
  { keyword: 'art deco', label: '装饰艺术', description: '华丽几何的装饰主义风格', relatedKeywords: ['art nouveau', 'decorative pattern', 'ornamental'] },
  { keyword: 'stained glass', label: '彩色玻璃', description: '光与色的透明艺术', relatedKeywords: ['glass art', 'mosaic', 'light art'] },
  { keyword: 'ceramic art', label: '陶艺', description: '泥土与火焰的艺术结晶', relatedKeywords: ['pottery', 'porcelain', 'clay work'] },
  { keyword: 'calligraphy', label: '书法艺术', description: '笔墨之间的线条韵律', relatedKeywords: ['lettering', 'typography art', 'handwriting'] },
  { keyword: 'paper craft', label: '纸艺', description: '纸张折叠剪裁的立体之美', relatedKeywords: ['origami', 'paper sculpture', 'kirigami'] },
  { keyword: 'woodcut print', label: '木刻版画', description: '刀与木的力量感艺术', relatedKeywords: ['linocut', 'printmaking', 'block print'] },
  { keyword: 'neon lights', label: '霓虹灯', description: '夜色中的光影艺术', relatedKeywords: ['light installation', 'glow art', 'led art'] },
  { keyword: 'sunset landscape', label: '日落风景', description: '天际线上的金色时光', relatedKeywords: ['golden hour', 'sunrise', 'sky photography'] },
]

export function getTodayTopic(): DailyTopic {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  return dailyTopics[dayOfYear % dailyTopics.length]
}

export function getRelatedTopics(topic: DailyTopic, count: number): DailyTopic[] {
  // Score each topic by how many relatedKeywords overlap
  const scored = dailyTopics
    .filter(t => t.keyword !== topic.keyword)
    .map(t => {
      const overlap = t.relatedKeywords.filter(kw =>
        topic.relatedKeywords.some(tk =>
          kw.toLowerCase().includes(tk.toLowerCase()) ||
          tk.toLowerCase().includes(kw.toLowerCase())
        )
      ).length
      // Also check if any relatedKeyword matches the other topic's keyword
      const keywordMatch = topic.relatedKeywords.some(kw =>
        t.keyword.toLowerCase().includes(kw.toLowerCase())
      ) ? 1 : 0
      return { topic: t, score: overlap + keywordMatch }
    })
    .sort((a, b) => b.score - a.score)

  // Take top scored, fallback to random if not enough matches
  const related = scored.slice(0, count).map(s => s.topic)
  if (related.length < count) {
    const remaining = dailyTopics.filter(
      t => t.keyword !== topic.keyword && !related.includes(t)
    )
    const shuffled = remaining.sort(() => Math.random() - 0.5)
    related.push(...shuffled.slice(0, count - related.length))
  }
  return related
}
