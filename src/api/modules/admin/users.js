// 用户管理API接口（管理端）
import { request } from '../../http.js'

/**
 * 分页查询用户列表（管理端）
 * 路径：POST /users/admin/page
 */
export function fetchAdminUsersPage(payload) {
  return request('/users/admin/page', {
    method: 'POST',
    body: payload,
  })
}

/**
 * 根据ID查询用户详情（管理端）
 * 路径：GET /users/{id}
 */
export function fetchAdminUserById(id) {
  return request(`/users/${id}`, {
    method: 'GET',
  })
}

// 更新用户（PUT /users）
// 注：复用通用更新接口，或者如果有专门的管理端接口也可以在这里定义
export function updateAdminUser(payload) {
  return request('/users', {
    method: 'PUT',
    body: payload,
  })
}

// 删除用户（DELETE /users/{id}）
export function deleteAdminUser(id) {
  return request(`/users/${id}`, {
    method: 'DELETE',
  })
}

// 重置密码（示例，如果后端有此接口）
// POST /users/admin/reset-password
export function resetAdminUserPassword(id, password) {
  return request('/users/admin/reset-password', {
    method: 'POST',
    body: { id, password },
  })
}
