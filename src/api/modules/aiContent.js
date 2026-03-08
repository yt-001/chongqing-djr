import { request } from '../http.js'

export function fetchAiGreetingRandom() {
  return request('/ai/greetings/random', { method: 'GET' })
}

export function fetchAiPromptsRandom(limit = 4) {
  return request(`/ai/prompts/random?limit=${limit}`, { method: 'GET' })
}
