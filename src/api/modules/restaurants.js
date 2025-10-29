import { request } from '../http.js'

/**
 * @description 分页查询美食
 * @param {object} payload
 * @returns
 */
export function fetchRestaurantsPage(payload) {
  return request('/restaurants/page', { method: 'POST', body: payload })
}

/**
 * @description 根据ID查询美食
 * @param {number} id
 * @returns
 */
export function fetchRestaurantById(id) {
  return request(`/restaurants/${id}`)
}
