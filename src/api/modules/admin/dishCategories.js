import { request } from '../../http.js'

export function fetchDishCategoriesPage(payload) {
  return request('/dish-categories/page', {
    method: 'POST',
    body: payload,
  })
}

export function fetchDishCategoryById(id) {
  return request(`/dish-categories/${id}`, {
    method: 'GET',
  })
}

export function createDishCategory(payload) {
  return request('/dish-categories', {
    method: 'POST',
    body: payload,
  })
}

export function updateDishCategory(payload) {
  return request('/dish-categories', {
    method: 'PUT',
    body: payload,
  })
}

export function deleteDishCategory(id) {
  return request(`/dish-categories/${id}`, {
    method: 'DELETE',
  })
}

