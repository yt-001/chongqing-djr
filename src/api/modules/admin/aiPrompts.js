import { request } from '../../http.js'

export function fetchAdminAiPromptsPage(payload) {
  return request('/ai/admin/prompts/page', {
    method: 'POST',
    body: payload,
  })
}

export function fetchAdminAiPromptById(id) {
  return request(`/ai/admin/prompts/${id}`, { method: 'GET' })
}

export function createAdminAiPrompt(payload) {
  return request('/ai/admin/prompts', { method: 'POST', body: payload })
}

export function updateAdminAiPrompt(payload) {
  return request('/ai/admin/prompts', { method: 'PUT', body: payload })
}

export function deleteAdminAiPrompt(id) {
  return request(`/ai/admin/prompts/${id}`, { method: 'DELETE' })
}
