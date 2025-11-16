// 管理端-美食（餐厅）模块：分页查询 + 详情 + 增改删
import { request } from '../../http.js'

/**
 * 分页查询餐厅列表（管理端）
 * 路径：POST /restaurants/admin/page
 */
export function fetchAdminRestaurantsPage(payload) {
  return request('/restaurants/admin/page', {
    method: 'POST',
    body: payload,
  })
}

/**
 * 根据ID查询餐厅详情（管理端）
 * 路径：GET /restaurants/{id}
 */
export function fetchAdminRestaurantById(id) {
  return request(`/restaurants/${id}`, {
    method: 'GET',
  })
}

// 新增餐厅（POST /restaurants）
export function createAdminRestaurant(payload) {
  return request('/restaurants', {
    method: 'POST',
    body: payload,
  })
}

// 修改餐厅（PUT /restaurants）
export function updateAdminRestaurant(payload) {
  return request('/restaurants', {
    method: 'PUT',
    body: payload,
  })
}

// 删除餐厅（DELETE /restaurants/{id}）
export function deleteAdminRestaurant(id) {
  return request(`/restaurants/${id}`, {
    method: 'DELETE',
  })
}
