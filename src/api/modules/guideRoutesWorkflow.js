// 向导路线详情（工作流使用）
import { request } from '../http.js'

/**
 * 根据路线ID获取完整详情（包含点位和连线）
 * 方法：GET
 * 路径：/guide-routes/{id}
 * @param {number|string} id 路线ID
 */
export function fetchGuideRouteDetail(id) {
  return request(`/guide-routes/${id}`, { method: 'GET', timeoutMs: 10000 })
}

export function saveGuideRouteWorkflow(id, payload) {
  return request(`/guide-routes/${id}/workflow`, { method: 'PUT', body: payload, timeoutMs: 10000 })
}
