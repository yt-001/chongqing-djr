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

export function fetchRestaurantDishesByRestaurantId(restaurantId) {
  return request(`/restaurants/${restaurantId}/dishes`, { method: 'GET' })
}

export function fetchRestaurantCategoriesPage(payload) {
  return request('/restaurant-categories/page', { method: 'POST', body: payload })
}

export function fetchRecommendedDishCards(params = {}) {
  const search = new URLSearchParams()
  if (params.limit != null) {
    search.set('limit', String(params.limit))
  }
  if (params.pageNum != null) {
    search.set('pageNum', String(params.pageNum))
  }
  if (params.pageSize != null) {
    search.set('pageSize', String(params.pageSize))
  }
  const suffix = search.toString() ? `?${search.toString()}` : ''
  return request(`/restaurants/recommended-dishes/cards${suffix}`, { method: 'GET' })
}
