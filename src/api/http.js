// 轻量 HTTP 封装（fetch）
import { jsonHeaders } from './common.js'
import { API_CONFIG } from '../config/constants.js'

// 使用配置文件中的基础地址
const BASE_URL = API_CONFIG.BASE_URL

/**
 * 统一请求方法
 * @param {string} url 相对路径，如 '/auth/login'
 * @param {{method?: string, headers?: Object, body?: any, token?: string}} options 请求配置
 */
export async function request(url, options = {}) {
  const { method = 'GET', headers = {}, body, token, timeoutMs } = options
  const finalHeaders = { ...jsonHeaders(token), ...headers }
  const controller = typeof timeoutMs === 'number' && timeoutMs > 0 ? new AbortController() : null
  const init = { method, headers: finalHeaders, credentials: 'include', signal: controller?.signal }
  if (body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body)
  }
  let timer
  try {
    if (controller) {
      timer = setTimeout(() => controller.abort(), timeoutMs)
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
  } catch (err) {
    if (controller && controller.signal?.aborted) {
      const e = new Error('请求超时')
      e.cause = err
      throw e
    }
    throw err
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/**
 * 文件上传请求方法（不设置 Content-Type，让浏览器自动处理 multipart）
 * @param {string} url 相对路径
 * @param {{method?: string, headers?: Object, body?: FormData, token?: string}} options 请求配置
 */
export async function uploadRequest(url, options = {}) {
  const { method = 'POST', headers = {}, body, token } = options
  
  // 对于 FormData，不要手动设置 Content-Type，让浏览器自动设置
  const baseHeaders = token ? { Authorization: `Bearer ${token}` } : {}
  const finalHeaders = { ...baseHeaders, ...headers }
  
  const init = { 
    method, 
    headers: finalHeaders, 
    credentials: 'include',
    // 注意：不设置 Content-Type，让浏览器自动设置 multipart/form-data 边界
  }
  
  if (body !== undefined) {
    init.body = body // FormData 直接使用，不要转换
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
