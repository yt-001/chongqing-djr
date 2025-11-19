// 用户模块：用户信息更新
import { request } from '../http.js'

/**
 * 更新用户信息（PUT /users）
 * @param {{id:(number|string),username?:string,email?:string,phone?:string,avatarUrl?:string}} payload
 * @returns {Promise<import('../types/common.js').ApiResponse<void>>}
 */
export function updateUser(payload) {
  return request('/users', {
    method: 'PUT',
    body: payload,
  })
}