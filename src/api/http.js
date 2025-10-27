// 轻量 HTTP 封装（fetch）
import { BASE_URL, jsonHeaders } from './common.js'

/**
 * 统一请求方法
 * @param {string} url 相对路径，如 '/auth/login'
 * @param {{method?: string, headers?: Object, body?: any, token?: string}} options 请求配置
 */
export async function request(url, options = {}) {
  const { method = 'GET', headers = {}, body, token } = options
  const finalHeaders = { ...jsonHeaders(token), ...headers }
  const init = { method, headers: finalHeaders, credentials: 'include' }
  if (body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body)
  }
  const resp = await fetch(BASE_URL + url, init)
  const text = await resp.text()
  const raw = safeJsonParse(text)
  if (!resp.ok) {
    const message = (raw && (raw.message || raw.msg)) || resp.statusText
    const error = new Error(message)
    error.status = resp.status
    error.data = raw
    throw error
  }
  // 统一 ApiResponse 处理：只要包含 { code, msg } 就按业务码校验
  if (raw && typeof raw === 'object' && 'code' in raw && 'msg' in raw) {
    if (raw.code !== 200) {
      const error = new Error(raw.msg || '接口返回错误')
      error.code = raw.code
      error.data = raw
      throw error
    }
    // 成功时优先返回 data，无 data 则返回整体对象（兼容不同后端写法）
    return 'data' in raw ? raw.data : raw
  }
  // 否则直接返回原始解析结果
  return raw
}

function safeJsonParse(text) {
  try { return JSON.parse(text) } catch { return text }
}
