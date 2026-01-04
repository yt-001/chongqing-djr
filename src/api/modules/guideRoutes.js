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

/**
 * 获取已禁用向导路线卡片列表
 * 方法：GET
 * 路径：/guide-routes/disabled-cards
 */
export function fetchGuideRouteDisabledCards() {
  return request('/guide-routes/disabled-cards', { method: 'GET', timeoutMs: 10000 })
}

/**
 * 获取向导图库草稿卡片列表（editStatus=0）
 * 方法：GET
 * 路径：/guide-routes/drafts
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
export function fetchGuideRouteDraftCards() {
  return request('/guide-routes/drafts', { method: 'GET', timeoutMs: 10000 })
}

/**
 * 新增向导路线
 * 方法：POST
 * 路径：/guide-routes
 * @param {{
 *   name: string,
 *   description?: string,
 *   coverImage?: string,
 *   totalDistance?: number,
 *   totalDuration?: number
 * }} payload
 * @returns {Promise<number>} 新建路线ID
 */
export function createGuideRoute(payload) {
  return request('/guide-routes', { method: 'POST', body: payload, timeoutMs: 10000 })
}

/**
 * 修改向导路线基础信息
 * 方法：PUT
 * 路径：/guide-routes/{id}
 * @param {number|string} id 路线ID
 * @param {{
 *   name: string,
 *   description?: string,
 *   coverImage?: string,
 *   totalDistance?: number,
 *   totalDuration?: number,
 *   editStatus?: number
 * }} payload
 */
export function updateGuideRoute(id, payload) {
  return request(`/guide-routes/${id}`, { method: 'PUT', body: payload, timeoutMs: 10000 })
}

/**
 * 删除向导路线
 * 方法：DELETE
 * 路径：/guide-routes/{id}
 * @param {number|string} id 路线ID
 */
export function deleteGuideRoute(id) {
  return request(`/guide-routes/${id}`, { method: 'DELETE', timeoutMs: 10000 })
}

/**
 * 禁用向导路线（status=0）
 * 方法：PUT
 * 路径：/guide-routes/{id}/disable
 * @param {number|string} id 路线ID
 */
export function disableGuideRoute(id) {
  return request(`/guide-routes/${id}/disable`, { method: 'PUT', timeoutMs: 10000 })
}

/**
 * 恢复启用向导路线（status=1）
 * 方法：PUT
 * 路径：/guide-routes/{id}/enable
 * @param {number|string} id 路线ID
 */
export function enableGuideRoute(id) {
  return request(`/guide-routes/${id}/enable`, { method: 'PUT', timeoutMs: 10000 })
}

/**
 * 新增向导路线草稿（editStatus=0）
 * 方法：POST
 * 路径：/guide-routes
 * @param {{ name?: string, description?: string, coverImage?: string, totalDistance?: number, totalDuration?: number }} payload
 * @returns {Promise<number>} 新建路线ID
 */
export function createGuideRouteDraft(payload = {}) {
  const body = {
    name: payload.name ?? '',
    description: payload.description || '',
    coverImage: payload.coverImage || '',
    totalDistance: payload.totalDistance ?? null,
    totalDuration: payload.totalDuration ?? null,
    editStatus: 0
  }
  return request('/guide-routes', { method: 'POST', body, timeoutMs: 10000 })
}
