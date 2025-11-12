// 管理端-景点模块：分页查询
import { request } from '../../http.js'

/**
 * 分页查询景点列表（管理端）
 * 路径：POST /attractions/admin/page
 * 请求体：
 * {
 *   "pageNum": 1,
 *   "pageSize": 10,
 *   "sortField": "",
 *   "sortDirection": "DESC",
 *   "query": {
 *     "keyword": "",
 *     "createTime": "",
 *     "updateTime": "",
 *     "name": "",
 *     "location": ""
 *   }
 * }
 */
export function fetchAdminAttractionsPage(payload) {
  return request('/attractions/admin/page', {
    method: 'POST',
    body: payload,
  })
}
