// 通用配置与工具函数（仅 JS ）

/**
 * 生成 JSON 请求头
 * @param {string=} token 身份令牌
 */
export function jsonHeaders(token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}
