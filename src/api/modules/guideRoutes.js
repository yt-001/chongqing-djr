// 向导路线/向导图库相关接口
import { request } from '../http.js'

/**
 * 获取向导图库首页卡片列表
 * 方法：GET
 * 路径：/guide-routes/cards
 * 返回：GuideRouteCardVO 列表
 * @returns {Promise<Array<{
 *   id: number,
 *   name: string,
 *   description?: string,
 *   coverImage?: string,
 *   pointCount?: number,
 *   status: number,
 *   editStatus: number,
 *   createTime?: string,
 *   updateTime?: string
 * }>>}
 */
export function fetchGuideRouteCards() {
  return request('/guide-routes/cards', { method: 'GET', timeoutMs: 10000 })
}

