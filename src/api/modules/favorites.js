import { request } from '../http.js'

/**
 * 检查指定用户是否已收藏指定景点
 * @param {{ userId?: number, attractionId: number }} payload
 */
export function checkFavoriteAttraction(payload) {
  return request('/favorites/attractions/check', { method: 'POST', body: payload })
}

/**
 * 添加景点到用户的收藏列表
 * @param {{ userId?: number, attractionId: number }} payload
 */
export function addFavoriteAttraction(payload) {
  return request('/favorites/attractions/add', { method: 'POST', body: payload })
}

/**
 * 从用户的收藏列表中移除指定景点
 * @param {{ userId?: number, attractionId: number }} payload
 */
export function removeFavoriteAttraction(payload) {
  return request('/favorites/attractions/remove', { method: 'POST', body: payload })
}

/**
 * 分页查询用户收藏的景点列表
 * @param {{ pageNum: number, pageSize: number, userId?: number }} payload
 */
export function fetchFavoriteAttractionsPage(payload) {
  return request('/favorites/attractions/page', { method: 'POST', body: payload })
}

// --- 美食收藏 ---

/**
 * 检查指定用户是否已收藏指定美食
 * @param {{ userId?: number, restaurantId: number }} payload
 */
export function checkFavoriteRestaurant(payload) {
  return request('/favorites/restaurants/check', { method: 'POST', body: payload })
}

/**
 * 添加美食到用户的收藏列表
 * @param {{ userId?: number, restaurantId: number }} payload
 */
export function addFavoriteRestaurant(payload) {
  return request('/favorites/restaurants/add', { method: 'POST', body: payload })
}

/**
 * 从用户的收藏列表中移除指定美食
 * @param {{ userId?: number, restaurantId: number }} payload
 */
export function removeFavoriteRestaurant(payload) {
  return request('/favorites/restaurants/remove', { method: 'POST', body: payload })
}

/**
 * 分页查询用户收藏的美食列表
 * @param {{ pageNum: number, pageSize: number, userId?: number }} payload
 */
export function fetchFavoriteRestaurantsPage(payload) {
  return request('/favorites/restaurants/page', { method: 'POST', body: payload })
}

// --- 住宿收藏 ---

/**
 * 检查指定用户是否已收藏指定住宿
 * @param {{ userId?: number, accommodationId: number }} payload
 */
export function checkFavoriteAccommodation(payload) {
  return request('/favorites/accommodations/check', { method: 'POST', body: payload })
}

/**
 * 添加住宿到用户的收藏列表
 * @param {{ userId?: number, accommodationId: number }} payload
 */
export function addFavoriteAccommodation(payload) {
  return request('/favorites/accommodations/add', { method: 'POST', body: payload })
}

/**
 * 从用户的收藏列表中移除指定住宿
 * @param {{ userId?: number, accommodationId: number }} payload
 */
export function removeFavoriteAccommodation(payload) {
  return request('/favorites/accommodations/remove', { method: 'POST', body: payload })
}

/**
 * 分页查询用户收藏的住宿列表
 * @param {{ pageNum: number, pageSize: number, userId?: number }} payload
 */
export function fetchFavoriteAccommodationsPage(payload) {
  return request('/favorites/accommodations/page', { method: 'POST', body: payload })
}
