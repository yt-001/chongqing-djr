import { request } from '../../http.js'

export function fetchAdminAiGreetingsPage(payload) {
  return request('/ai/admin/greetings/page', {
    method: 'POST',
    body: payload,
  })
}

export function fetchAdminAiGreetingById(id) {
  return request(`/ai/admin/greetings/${id}`, { method: 'GET' })
}

export function createAdminAiGreeting(payload) {
  return request('/ai/admin/greetings', { method: 'POST', body: payload })
}

export function updateAdminAiGreeting(payload) {
  return request('/ai/admin/greetings', { method: 'PUT', body: payload })
}

export function deleteAdminAiGreeting(id) {
  return request(`/ai/admin/greetings/${id}`, { method: 'DELETE' })
}
