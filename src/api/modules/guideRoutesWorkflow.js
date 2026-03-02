// 向导路线详情（工作流使用）
import { request } from '../http.js'
import { API_CONFIG } from '../../config/constants.js'

/**
 * 根据路线ID获取完整详情（包含点位和连线）
 * 方法：GET
 * 路径：/guide-routes/{id}
 * @param {number|string} id 路线ID
 */
export function fetchGuideRouteDetail(id) {
  // 直连后端，避免路由/代理干扰
  return request(`${API_CONFIG.BACKEND_ORIGIN}/guide-routes/${id}`, { method: 'GET', timeoutMs: 10000 })
}

export function saveGuideRouteWorkflow(id, payload) {
  return request(`${API_CONFIG.BACKEND_ORIGIN}/guide-routes/${id}/workflow`, { method: 'PUT', body: payload, timeoutMs: 10000 })
}
