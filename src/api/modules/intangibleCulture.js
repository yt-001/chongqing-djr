// 非物质文化遗产相关接口
import { request } from '../http.js'

/**
 * 分页查询非物质文化遗产
 * @param {Object} params - 查询参数
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {Object} params.query - 查询条件
 * @returns {Promise}
 */
export const fetchIntangibleCulturesPage = (params) => {
  return request('/intangible-cultures/page', {
    method: 'POST',
    body: params
  })
}

/**
 * 根据 ID 查询非物质文化遗产详情
 * @param {number} id - 非物质文化遗产 ID
 * @returns {Promise}
 */
export const fetchIntangibleCultureById = (id) => {
  return request(`/intangible-cultures/${id}`, {
    method: 'GET'
  })
}

/**
 * 列表查询非物质文化遗产
 * @param {Object} query - 查询条件
 * @returns {Promise}
 */
export const fetchIntangibleCulturesList = (query) => {
  return request('/intangible-cultures/list', {
    method: 'POST',
    body: query
  })
}

/**
 * 新增非物质文化遗产
 * @param {Object} data - 非物质文化遗产数据
 * @returns {Promise}
 */
export const addIntangibleCulture = (data) => {
  return request('/intangible-cultures', {
    method: 'POST',
    body: data
  })
}

/**
 * 修改非物质文化遗产
 * @param {Object} data - 非物质文化遗产数据
 * @returns {Promise}
 */
export const updateIntangibleCulture = (data) => {
  return request('/intangible-cultures', {
    method: 'PUT',
    body: data
  })
}

/**
 * 删除非物质文化遗产
 * @param {number} id - 非物质文化遗产 ID
 * @returns {Promise}
 */
export const deleteIntangibleCulture = (id) => {
  return request(`/intangible-cultures/${id}`, {
    method: 'DELETE'
  })
}
