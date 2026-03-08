import { request } from '../http.js'

export function chatAi(payload) {
  return request('/ai/chat', { method: 'POST', body: payload })
}
