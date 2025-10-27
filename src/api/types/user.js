/**
 * @typedef {Object} UserInfo
 * @property {string|number} id 用户ID
 * @property {string} username 用户名
 * @property {string=} email 邮箱
 * @property {string=} phone 手机号
 * @property {string=} avatarUrl 头像URL
 * @property {number} status 状态(0-禁用,1-启用)
 * @property {string=} createTime 创建时间
 * @property {string=} updateTime 更新时间
 * @property {0|1} role 角色（0=管理员，1=用户）
 */

/**
 * @typedef {Object} LoginPayload
 * @property {string} emailOrPhone 账号（邮箱或电话）
 * @property {string} password 密码
 * @property {0|1} role 角色（0=管理员，1=用户）
 */

export {}