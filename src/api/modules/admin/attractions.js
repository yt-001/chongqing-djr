// 管理端-景点模块：分页查询 + 按ID查询
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

/**
 * 根据ID查询景点详情（管理端）
 * 路径：GET /attractions/{id}
 * 说明：根据列表中的某条记录，将其 id 作为路径参数传递
 */
export function fetchAdminAttractionById(id) {
  return request(`/attractions/${id}`, {
    method: 'GET',
  })
}

// 新增景点（POST /attractions）
export function createAdminAttraction(payload) {
  return request('/attractions', {
    method: 'POST',
    body: payload,
  })
}

// 修改景点（PUT /attractions）
export function updateAdminAttraction(payload) {
  return request('/attractions', {
    method: 'PUT',
    body: payload,
  })
}

// 删除景点（DELETE /attractions/{id}）
export function deleteAdminAttraction(id) {
  return request(`/attractions/${id}`, {
    method: 'DELETE',
  })
}
