import { request } from '../../http.js'

export function fetchRestaurantCategoriesPage(payload) {
  return request('/restaurant-categories/page', {
    method: 'POST',
    body: payload,
  })
}

export function fetchRestaurantCategoryById(id) {
  return request(`/restaurant-categories/${id}`, {
    method: 'GET',
  })
}

export function createRestaurantCategory(payload) {
  return request('/restaurant-categories', {
    method: 'POST',
    body: payload,
  })
}

export function updateRestaurantCategory(payload) {
  return request('/restaurant-categories', {
    method: 'PUT',
    body: payload,
  })
}

export function deleteRestaurantCategory(id) {
  return request(`/restaurant-categories/${id}`, {
    method: 'DELETE',
  })
}

