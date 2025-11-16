// 住宿管理API接口
import { request } from '../../http.js'

/**
 * 分页查询住宿列表（管理端）
 * 路径：POST /accommodations/admin/page
 */
export function fetchAdminAccommodationsPage(payload) {
  return request('/accommodations/admin/page', {
    method: 'POST',
    body: payload,
  })
}

/**
 * 根据ID查询住宿详情（管理端）
 * 路径：GET /accommodations/{id}
 */
export function fetchAdminAccommodationById(id) {
  return request(`/accommodations/${id}`, {
    method: 'GET',
  })
}

// 新增住宿（POST /accommodations）
export function createAdminAccommodation(payload) {
  return request('/accommodations', {
    method: 'POST',
    body: payload,
  })
}

// 更新住宿（PUT /accommodations）
export function updateAdminAccommodation(payload) {
  return request('/accommodations', {
    method: 'PUT',
    body: payload,
  })
}

// 删除住宿（DELETE /accommodations/{id}）
export function deleteAdminAccommodation(id) {
  return request(`/accommodations/${id}`, {
    method: 'DELETE',
  })
}