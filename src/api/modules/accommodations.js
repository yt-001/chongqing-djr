// 住宿模块（用户端列表展示）
import { request } from '../http.js'

/**
 * 分页查询住宿列表（用户端）
 * 路径：POST /accommodations/page
 * @param {{
 *   pageNum: number,
 *   pageSize: number,
 *   sortDirection?: 'ASC'|'DESC',
 *   query?: { name?: string, location?: string, type?: number }
 * }} payload 分页与查询条件
 */
export function fetchAccommodationsPage(payload) {
  return request('/accommodations/page', {
    method: 'POST',
    body: payload,
  })
}

/**
 * 根据ID查询住宿详情（用户端）
 * 路径：GET /accommodations/{id}
 */
export function fetchAccommodationById(id) {
  return request(`/accommodations/${id}`, {
    method: 'GET',
  })
}
