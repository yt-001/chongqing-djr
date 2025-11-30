// 管理端-热门景点模块（对接后端已提供的接口）
import { request } from '../../http.js'

/**
 * 根据ID查询热门景点
 * 路径：GET /popular-attractions/{id}
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export function fetchAdminPopularAttractionById(id) {
  return request(`/popular-attractions/${id}`, { method: 'GET' })
}

/**
 * 新增热门景点（仅需 attractionId）
 * 路径：POST /popular-attractions
 * @param {{attractionId:number}} payload
 * @returns {Promise<Object>}
 */
export function createAdminPopularAttraction(payload) {
  return request('/popular-attractions', { method: 'POST', body: payload })
}

/**
 * 删除热门景点
 * 路径：DELETE /popular-attractions/{id}
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export function deleteAdminPopularAttractionById(id) {
  return request(`/popular-attractions/${id}`, { method: 'DELETE' })
}

/**
 * 分页查询可选景点（用于添加热门）
 * 路径：POST /popular-attractions/attractions/page
 * @param {{pageNum:number,pageSize:number,query?:{id?:number,name?:string}}} payload
 * @returns {Promise<{total:number,list:Array<{id:number,name:string}>,pageNum:number,pageSize:number}>}
 */
export function fetchPopularAttractionCandidatesPage(payload) {
  return request('/popular-attractions/attractions/page', { method: 'POST', body: payload })
}
