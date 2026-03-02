/**
 * 归一化设施名称，便于相似匹配
 * @param {string} label
 * @returns {string}
 */
export function normalizeFacilityLabel(label) {
  return String(label || '').toLowerCase().replace(/\s+/g, '')
}

// 图标匹配规则集合（中文/英文关键词）
export const ICON_RULES = [
  { icon: 'cluster-o', keywords: ['wifi', '免费wifi', '无线网络'] },
  { icon: 'fire-o', keywords: ['泳池', 'pool', '游泳'] },
  { icon: 'friends-o', keywords: ['健身房', '健身', 'gym'] },
  { icon: 'smile-o', keywords: ['早餐', 'breakfast'] },
  { icon: 'location-o', keywords: ['江景'] },
  { icon: 'hotel-o', keywords: ['餐厅', 'restaurant'] },
  { icon: 'flower-o', keywords: ['庭院', '花园', 'garden'] },
  { icon: 'smile-o', keywords: ['茶室', '茶', 'tea'] },
  { icon: 'tv-o', keywords: ['投影仪', '投影', 'projector'] },
  { icon: 'smile-o', keywords: ['厨房', 'kitchen'] },
  { icon: 'friends-o', keywords: ['公共区域', '公共', 'public'] },
  { icon: 'smile-o', keywords: ['酒吧', 'bar'] },
  { icon: 'fire-o', keywords: ['温泉', 'hot spring'] },
  { icon: 'orders-o', keywords: ['会议', 'meeting', 'conference'] },
  { icon: 'friends-o', keywords: ['洗衣机', '洗衣', 'laundry'] },
  { icon: 'arrow-up', keywords: ['电梯', 'lift'] },
  { icon: 'location-o', keywords: ['落地窗', '窗', 'window'] }
]

const ICON_SET = new Set(ICON_RULES.map(r => r.icon))

/**
 * 为设施选择图标：优先使用后端icon（在集合内），否则按名称相似匹配
 * @param {{name?:string,label?:string,icon?:string}} facility
 * @returns {string}
 */
export function pickFacilityIcon(facility) {
  const raw = (facility?.icon || '').trim()
  if (raw && ICON_SET.has(raw)) return raw
  const text = normalizeFacilityLabel(facility?.name || facility?.label)
  if (text) {
    for (const rule of ICON_RULES) {
      if (rule.keywords.some(k => text.includes(k))) return rule.icon
    }
  }
  return 'apps-o'
}

/**
 * 将设施列表映射为展示项（包含图标与名称）
 * @param {Array} list
 * @returns {{icon:string,name:string}[]}
 */
export function mapFacilitiesToItems(list) {
  if (!Array.isArray(list) || list.length === 0) return []
  return list.map(f => ({
    icon: pickFacilityIcon(f),
    name: f.name || f.label || '设施'
  }))
}

