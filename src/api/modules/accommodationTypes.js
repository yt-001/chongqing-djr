// 住宿类型管理API
import { request } from '../http.js'

/**
 * 分页查询住宿类型
 * 路径：POST /accommodation-types/page
 * @param {{pageNum:number,pageSize:number,query?:{name?:string}}} payload
 */
export function fetchAccommodationTypesPage(payload) {
  return request('/accommodation-types/page', { method: 'POST', body: payload })
}

/**
 * 根据ID查询住宿类型
 * 路径：GET /accommodation-types/{id}
 * @param {number|string} id 住宿类型ID
 */
export function fetchAccommodationTypeById(id) {
  return request(`/accommodation-types/${id}`, { method: 'GET' })
}

/**
 * 新增住宿类型
 * 路径：POST /accommodation-types
 * @param {{name:string,description?:string}} payload
 */
export function createAccommodationType(payload) {
  return request('/accommodation-types', { method: 'POST', body: payload })
}

/**
 * 修改住宿类型
 * 路径：PUT /accommodation-types
 * @param {{id:number|string,name?:string,description?:string}} payload
 */
export function updateAccommodationType(payload) {
  return request('/accommodation-types', { method: 'PUT', body: payload })
}

/**
 * 删除住宿类型
 * 路径：DELETE /accommodation-types/{id}
 * @param {number|string} id 住宿类型ID
 */
export function deleteAccommodationType(id) {
  return request(`/accommodation-types/${id}`, { method: 'DELETE' })
}

