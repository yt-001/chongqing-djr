// 热门景点模块接口
import { request } from '../http.js'

/**
 * 获取热门景点完整列表
 * 方法：GET
 * 路径：/popular-attractions
 * @returns {Promise<Array<{id:number,attractionId:number,name:string,description:string,latitude:number,longitude:number,createTime?:string,updateTime?:string}>>}
 */
export function fetchPopularAttractions() {
  return request('/popular-attractions', { method: 'GET', timeoutMs: 10000 })
}

/**
 * 获取地图使用的热门景点数据
 * 方法：GET
 * 路径：/popular-attractions/map
 * 返回：AttractionMapVO 列表（名称、描述、经纬度）
 * @returns {Promise<Array<{name:string,description:string,latitude:number,longitude:number}>>}
 */
export function fetchPopularAttractionsForMap() {
  return request('/popular-attractions/map', { method: 'GET', timeoutMs: 10000 })
}

