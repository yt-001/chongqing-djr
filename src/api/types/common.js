/**
 * API 通用类型定义（企业常见写法，中文注释）
 * - 统一响应结构 ApiResponse<T>
 * - 分页查询基类 BasePageQuery（供各业务查询入参继承）
 * - 分页结果基类 PageResult<T>
 * - 为兼容现有模块，保留 PageParams / PageResponse 的导出别名
 */

/**
 * 基础查询（可扩展公共筛选字段，使用范围式命名）
 * @typedef {Object} BaseQuery
 * @property {string} [createdStart] 创建时间起始（yyyy-MM-dd）
 * @property {string} [createdEnd]   创建时间结束（yyyy-MM-dd）
 * @property {string} [updatedStart] 更新时间起始（yyyy-MM-dd）
 * @property {string} [updatedEnd]   更新时间结束（yyyy-MM-dd）
 */

/**
 * 排序方向（与后端 Sort.Direction 一致）
 * @typedef {('ASC'|'DESC')} SortDirection
 */

/**
 * 分页查询基础类（与后端 PageParam 对齐：pageNum/pageSize/sort/query）
 * @template [T=any]
 * @typedef {Object} BasePageQuery
 * @property {number} pageNum 第几页（从1开始，前端友好）
 * @property {number} pageSize 每页条数
 * @property {string} [sortField] 排序字段（可选）
 * @property {SortDirection} [sortDirection] 排序方向（默认 DESC）
 * @property {(BaseQuery & T)} [query] 业务查询条件
 */

/**
 * 统一响应结构（与后端约定：code/msg/data）
 * @template [T=any]
 * @typedef {Object} ApiResponse
 * @property {number} code 业务状态码
 * @property {string} msg 提示信息
 * @property {T} data 业务数据
 */

/**
 * 分页结果基类（列表返回体统一使用它）
 * @template [T=any]
 * @typedef {Object} PageResult
 * @property {Array<T>} list 列表数据
 * @property {number} total 总条数
 * @property {number} page 当前页码
 * @property {number} pageSize 每页条数
 */

/**
 * 常用工具类型
 * @template T
 * @typedef {(T|null)} Nullable 可空类型
 */

/**
 * 标识类型
 * @typedef {(number|string)} ID
 */

/**
 * 兼容导出别名（保持对旧代码/示例的兼容，不破坏现有 import）
 * - PageParams 等价于 BasePageQuery
 * - PageResponse<T> 等价于 PageResult<T>
 * 说明：JSDoc 中无法直接做类型别名导出，这里通过注释说明；在编辑器类型提示中等价。
 */

export {} // 仅为保持 ES 模块语义