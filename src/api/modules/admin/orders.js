// 管理端-订单模块：分页查询订单详情
import { request } from '../../http.js'

/**
 * 管理员端分页查询订单详情
 * 路径：POST /orders/admin/page
 * @param {{pageNum:number,pageSize:number,sortField?:string,sortDirection?:'ASC'|'DESC',query?:Object}} payload
 */
export function fetchAdminOrdersPage(payload) {
  return request('/orders/admin/page', { method: 'POST', body: payload })
}

/**
 * 修改订单状态（管理员）
 * @param {Object} payload
 */
export function updateOrder(payload) {
  return request('/orders', { method: 'PUT', body: payload })
}

/**
 * 删除订单（管理员）
 * @param {number} id
 */
export function deleteOrder(id) {
  return request(`/orders/${id}`, { method: 'DELETE' })
}