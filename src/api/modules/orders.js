// 订单模块：用户端与管理员端接口
import { request } from '../http.js'

/**
 * 分页查询订单（用户端）
 * 路径：POST /orders/page
 * @param {{pageNum:number,pageSize:number,sortField?:string,sortDirection?:'ASC'|'DESC',query?:Object}} payload
 * @returns {Promise<{ list:any[], total:number, page:number, pageSize:number }>} 分页数据
 */
export function fetchOrdersPage(payload) {
  return request('/orders/page', { method: 'POST', body: payload })
}

/**
 * 管理员端分页查询订单详情
 * 路径：POST /orders/admin/page
 * @param {{pageNum:number,pageSize:number,sortField?:string,sortDirection?:'ASC'|'DESC',query?:Object}} payload
 */
export function fetchAdminOrdersPage(payload) {
  return request('/orders/admin/page', { method: 'POST', body: payload })
}

/**
 * 根据ID查询订单
 * 路径：GET /orders/{id}
 * @param {number|string} id 订单ID
 */
export function fetchOrderById(id) {
  return request(`/orders/${id}`, { method: 'GET' })
}

/**
 * 新增订单
 * 路径：POST /orders
 * @param {Object} payload 订单创建参数
 */
export function createOrder(payload) {
  return request('/orders', { method: 'POST', body: payload })
}

/**
 * 修改订单
 * 路径：PUT /orders
 * @param {Object} payload 订单更新参数
 */
export function updateOrder(payload) {
  return request('/orders', { method: 'PUT', body: payload })
}

/**
 * 删除订单
 * 路径：DELETE /orders/{id}
 * @param {number|string} id 订单ID
 */
export function deleteOrder(id) {
  return request(`/orders/${id}`, { method: 'DELETE' })
}

/**
 * 分页查询已支付但已过期的订单（用户端）
 * 路径：POST /orders/expired-paid
 * @param {{pageNum:number,pageSize:number,sortField?:string,sortDirection?:'ASC'|'DESC',query?:Object}} payload
 * @returns {Promise<{ list:any[], total:number, page:number, pageSize:number }>} 分页数据
 */
export function fetchExpiredPaidOrdersPage(payload) {
  return request('/orders/expired-paid', { method: 'POST', body: payload })
}

/**
 * 分页查询待使用且未过期的订单（用户端）
 * 路径：POST /orders/pending-valid
 * @param {{pageNum:number,pageSize:number,sortField?:string,sortDirection?:'ASC'|'DESC',query?:Object}} payload
 * @returns {Promise<{ list:any[], total:number, page:number, pageSize:number }>} 分页数据
 */
export function fetchPendingValidOrdersPage(payload) {
  return request('/orders/pending-valid', { method: 'POST', body: payload })
}