import { request } from '../http.js'

/**
 * 分页查询景点评论
 * @param {{ pageNum: number, pageSize: number, query: { attractionId: number } }} payload
 */
export function fetchAttractionCommentsPage(payload) {
  return request('/comments/attractions/page', { method: 'POST', body: payload })
}

/**
 * 添加景点评论
 * @param {{ userId: number, attractionId: number, content: string, rating: number }} payload
 */
export function addAttractionComment(payload) {
  return request('/comments/attractions/add', { method: 'POST', body: payload })
}

/**
 * 删除景点评论 (仅限本人)
 * @param {number} id 评论ID
 * @param {number} userId 当前用户ID
 */
export function deleteAttractionComment(id, userId) {
  return request(`/comments/attractions/${id}?userId=${userId}`, { method: 'DELETE' })
}
