// 景点模块，对应后端 /attractions 控制器
// 说明：按照现有 http 封装风格，统一使用 request，中文注释
import { request } from '../http.js'

/**
 * 分页查询景点列表
 * 路径：POST /attractions/page
 * 入参示例（分页查询类型）：
 * {
 *   "pageNum": 1,
 *   "pageSize": 10,
 *   "sortDirection": "ASC", // 或 "DESC"
 *   "query": { "name": "", "location": "" }
 * }
 * 返回体遵循 ApiResponse，request 会自动按 {code,msg,data} 解析并返回 data
 *
 * @param {{
 *   pageNum: number,
 *   pageSize: number,
 *   sortDirection?: 'ASC'|'DESC',
 *   query?: { name?: string, location?: string }
 * }} payload 分页与查询条件
 * @returns {Promise<{ total: number, list: Array<any>, pageNum: number, pageSize: number, pages: number }>} data 字段
 */
export function fetchAttractionsPage(payload) {
  return request('/attractions/page', {
    method: 'POST',
    body: payload,
  })
}
