// 认证模块，对应后端 /auth 控制器
import { request } from '../http.js'

/**
 * 登录：写入 HttpOnly Cookie
 * @param {{emailOrPhone:string,password:string,role:0|1}} payload
 * @returns {Promise<import('../types/user.js').UserInfo>}
 */
export function login(payload) {
  return request('/auth/login', {
    method: 'POST',
    body: payload,
  })
}

/** 登出：清除 Cookie
 * @returns {Promise<import('../types/common.js').ApiResponse<null>>}
 */
export function logout() {
  return request('/auth/logout', { method: 'POST' })
}

/** 刷新访问令牌（基于 refresh_token Cookie） */
export function refresh() {
  return request('/auth/refresh', { method: 'POST' })
}

/** 检查访问令牌并返回用户信息
 * @returns {Promise<import('../types/user.js').UserInfo>}
 */
export function check() {
  return request('/auth/check', { method: 'GET' })
}
