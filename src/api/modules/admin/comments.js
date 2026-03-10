import { request } from '../../http.js'

export function fetchAdminAttractionCommentsPage(payload) {
  return request('/comments/admin/attractions/page', { method: 'POST', body: payload })
}

export function fetchAdminRestaurantCommentsPage(payload) {
  return request('/comments/admin/restaurants/page', { method: 'POST', body: payload })
}

export function fetchAdminAccommodationCommentsPage(payload) {
  return request('/comments/admin/accommodations/page', { method: 'POST', body: payload })
}

export function updateAdminComment(payload) {
  return request('/comments', { method: 'PUT', body: payload })
}

export function deleteAdminComment(id) {
  return request(`/comments/${id}`, { method: 'DELETE' })
}
