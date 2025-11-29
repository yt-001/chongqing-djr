// 住宿设施管理API
import { request } from '../http.js'

/**
 * 分页查询住宿设施
 * 路径：POST /accommodation-facilities/page
 * @param {{pageNum:number,pageSize:number,query?:{name?:string}}} payload
 */
export function fetchAccommodationFacilitiesPage(payload) {
  return request('/accommodation-facilities/page', { method: 'POST', body: payload })
}

/**
 * 根据ID查询住宿设施
 * 路径：GET /accommodation-facilities/{id}
 * @param {number|string} id 住宿设施ID
 */
export function fetchAccommodationFacilityById(id) {
  return request(`/accommodation-facilities/${id}`, { method: 'GET' })
}

/**
 * 新增住宿设施
 * 路径：POST /accommodation-facilities
 * @param {{name:string,description?:string,icon?:string}} payload
 */
export function createAccommodationFacility(payload) {
  return request('/accommodation-facilities', { method: 'POST', body: payload })
}

/**
 * 修改住宿设施
 * 路径：PUT /accommodation-facilities
 * @param {{id:number|string,name?:string,description?:string,icon?:string}} payload
 */
export function updateAccommodationFacility(payload) {
  return request('/accommodation-facilities', { method: 'PUT', body: payload })
}

/**
 * 删除住宿设施
 * 路径：DELETE /accommodation-facilities/{id}
 * @param {number|string} id 住宿设施ID
 */
export function deleteAccommodationFacility(id) {
  return request(`/accommodation-facilities/${id}`, { method: 'DELETE' })
}

