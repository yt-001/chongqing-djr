<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { loadQQMap } from '@/utils/qqMapLoader.js'
import { fetchGuideRouteDetail } from '@/api/modules/guideRoutesWorkflow.js'

const router = useRouter()
const route = useRoute()
const mapContainer = ref(null)
const mapInstance = ref(null)
const loading = ref(true)
const locationInfo = ref(null)  // 信息窗体数据 (景点)
const routeSegmentInfo = ref(null) // 路线段信息 (右下角)
const infoWindowPos = ref({ x: -999, y: -999 }) // 信息窗体屏幕坐标

// 腾讯地图 Key
const QQ_MAP_KEY = 'FSVBZ-V6BK3-CHU3D-RZZQN-VGFIS-PXFW6'

// 全局变量存储 LatLng 构造函数
let TMapLatLng = null

// 贝塞尔曲线生成辅助函数
function getCurvePoints(start, end, bend = 0.2, count = 40) {
  const p1 = { x: start.getLng(), y: start.getLat() }
  const p2 = { x: end.getLng(), y: end.getLat() }
  
  // 计算中点
  const mid = {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  }
  
  // 计算向量
  const v = {
    x: p2.x - p1.x,
    y: p2.y - p1.y
  }
  
  // 距离平方
  const distSq = v.x * v.x + v.y * v.y
  const dist = Math.sqrt(distSq)
  
  if (dist === 0) return [start]

  // 法向量 (简单平面几何，忽略地球曲率，对于短距离路线足够)
  const normal = {
    x: -v.y,
    y: v.x
  }
  
  // 控制点
  const cp = {
    x: mid.x + normal.x * bend,
    y: mid.y + normal.y * bend
  }
  
  const points = []
  for (let i = 0; i <= count; i++) {
    const t = i / count
    const x = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * cp.x + t * t * p2.x
    const y = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * cp.y + t * t * p2.y
    points.push(new TMapLatLng(y, x))
  }
  
  return points
}

// 初始化地图
async function initMap() {
  try {
    const TMap = await loadQQMap(QQ_MAP_KEY)
    TMapLatLng = TMap.LatLng 
    
    // 中心点：梁平 (默认)
    const center = new TMap.LatLng(30.6768, 107.8025)

    mapInstance.value = new TMap.Map(mapContainer.value, {
      center: center,
      zoom: 13,
      viewMode: '3D',
      pitch: 45,
      rotation: 0,
      baseMap: {
        type: 'vector',
        features: ['base', 'building3d'] // 简约风格
      }
    })

    // 移除默认控件
    mapInstance.value.removeControl(TMap.constants.DEFAULT_CONTROL_ID.ZOOM)

    const { routeId } = route.query
    const geometries = []

    if (routeId) {
      try {
        const routeDetail = await fetchGuideRouteDetail(routeId)
        if (routeDetail && routeDetail.points) {
          const points = routeDetail.points
          
          // 建立点索引，方便查找
          const pointMap = new Map(points.map(p => [p.id, p]))
          
          if (points.length > 0) {
            // 1. 绘制连线 (MultiPolyline)
            const routeGeometries = []
            
            // 定义多彩样式
            const routeStyles = {
              'route-1': new TMap.PolylineStyle({ color: '#3777FF', width: 6, borderWidth: 0, lineCap: 'round', showDir: true }),
              'route-2': new TMap.PolylineStyle({ color: '#00C853', width: 6, borderWidth: 0, lineCap: 'round', showDir: true }),
              'route-3': new TMap.PolylineStyle({ color: '#FF9800', width: 6, borderWidth: 0, lineCap: 'round', showDir: true }),
              'route-4': new TMap.PolylineStyle({ color: '#E91E63', width: 6, borderWidth: 0, lineCap: 'round', showDir: true })
            }
            const styleIds = Object.keys(routeStyles)

            // 判断使用 edges 还是降级使用 stepOrder
            if (routeDetail.edges && routeDetail.edges.length > 0) {
              // === 模式 A: 基于真实连接关系绘制 (支持分支/多路线) ===
              routeDetail.edges.forEach((edge, index) => {
                const source = pointMap.get(edge.sourcePointId)
                const target = pointMap.get(edge.targetPointId)
                
                if (source && target) {
                  const startLatLng = new TMap.LatLng(source.latitude, source.longitude)
                  const endLatLng = new TMap.LatLng(target.latitude, target.longitude)
                  
                  // 弯曲策略：交替弯曲，避免重叠
                  // 对于 A->B 和 A->C (同一起点)，index 不同会产生不同弯曲
                  const bend = (index % 2 === 0 ? 0.15 : -0.15)
                  const curvePath = getCurvePoints(startLatLng, endLatLng, bend)
                  
                  routeGeometries.push({
                    id: `edge-${edge.id}`,
                    styleId: styleIds[index % styleIds.length],
                    paths: curvePath,
                    properties: {
                      title: `行程段 ${index + 1}`,
                      description: edge.label || `从 ${source.name} 前往 ${target.name}`,
                      tip: edge.label ? '按路线指示前行' : '沿途风景不错，注意安全',
                      index: index
                    }
                  })
                }
              })
            } else {
              // === 模式 B: 降级模式 (按序号线性连接) ===
              const sortedPoints = [...points].sort((a, b) => a.stepOrder - b.stepOrder)
              for (let i = 0; i < sortedPoints.length - 1; i++) {
                const p1 = sortedPoints[i]
                const p2 = sortedPoints[i+1]
                
                const startLatLng = new TMap.LatLng(p1.latitude, p1.longitude)
                const endLatLng = new TMap.LatLng(p2.latitude, p2.longitude)
                
                const bend = (i % 2 === 0 ? 0.15 : -0.15) 
                const curvePath = getCurvePoints(startLatLng, endLatLng, bend)

                routeGeometries.push({
                  id: `segment-${i}`,
                  styleId: styleIds[i % styleIds.length],
                  paths: curvePath,
                  properties: {
                    title: `行程段 ${i + 1}`,
                    description: `从 ${p1.name} 前往 ${p2.name}`,
                    tip: '沿途风景不错，注意安全',
                    index: i
                  }
                })
              }
            }

            const routeLayer = new TMap.MultiPolyline({
              id: 'route-line',
              map: mapInstance.value,
              styles: routeStyles,
              geometries: routeGeometries
            })

            // 监听路线点击
            routeLayer.on('click', (evt) => {
               const props = evt.geometry.properties
               if (props) {
                 routeSegmentInfo.value = {
                   title: props.title,
                   description: props.description,
                   tip: props.tip
                 }
               }
            })

            // 2. 绘制节点标记
            const geometries = []
            points.forEach((p) => {
              // 判断是否是起点或终点 (这里简单判断 stepOrder 最小/最大，或者根据入度出度)
              // 简单处理：全部用 normal，或者是根据 sort 后的结果
              const isStart = p.stepOrder === 1
              // const isEnd = ... 
              
              geometries.push({
                id: 'point-' + p.id,
                styleId: isStart ? 'start' : 'normal', // 简化样式逻辑
                position: new TMap.LatLng(p.latitude, p.longitude),
                properties: { 
                  title: p.name, 
                  address: p.address || p.remark || '暂无描述',
                  lat: p.latitude,
                  lng: p.longitude
                }
              })
            })

            // 创建标记图层
            const markerLayer = new TMap.MultiMarker({
              map: mapInstance.value,
              styles: {
                target: new TMap.MarkerStyle({ 
                  width: 30, height: 40, anchor: { x: 15, y: 40 },
                  src: 'https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/markerDefault.png', 
                }),
                end: new TMap.MarkerStyle({ 
                  width: 30, height: 40, anchor: { x: 15, y: 40 },
                  src: 'https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/markerDefault.png', 
                }),
                start: new TMap.MarkerStyle({ 
                  width: 30, height: 40, anchor: { x: 15, y: 40 },
                  src: 'https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/markerDefault.png', 
                }),
                normal: new TMap.MarkerStyle({ 
                  width: 25, height: 35, anchor: { x: 12, y: 35 },
                  src: 'https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/markerDefault.png' 
                })
              },
              geometries: geometries
            })

            // 监听标记点击
            markerLayer.on('click', (evt) => {
              const props = evt.geometry.properties
              const position = evt.geometry.position
              
              locationInfo.value = {
                name: props.title,
                address: props.address,
                lat: position.lat,
                lng: position.lng
              }
              
              updatePos()
              mapInstance.value.easeTo({ center: position }, { duration: 500 })
            })

            // 3. 自动缩放视野
            const bounds = new TMap.LatLngBounds()
            points.forEach(p => {
              bounds.extend(new TMap.LatLng(p.latitude, p.longitude))
            })
            // 调整 padding: 上方留出空间给导航栏和卡片，左右尽量窄以放大视图
            mapInstance.value.fitBounds(bounds, { 
              padding: { top: 100, bottom: 40, left: 20, right: 20 } 
            })
            
            // 强制重置俯仰角为 0 (防止 fitBounds 改变视角)
            // 延迟时间适当延长，确保 fitBounds 动画完成后执行
            setTimeout(() => {
              mapInstance.value.setPitch(0)
              mapInstance.value.setRotation(0)
            }, 800)

            // 4. 默认显示起点信息
            const startPoint = points[0]
            locationInfo.value = {
              name: startPoint.name,
              address: startPoint.address || startPoint.remark || '暂无描述',
              lat: startPoint.latitude,
              lng: startPoint.longitude
            }
            // 稍后更新位置，确保地图渲染完成
            requestAnimationFrame(() => {
              updatePos()
            })
          }
        }
      } catch (e) {
        console.error('Fetch route detail failed', e)
        showToast('路线加载失败')
      }
    } else {
      showToast('未指定路线')
    }



    // 监听地图变化更新弹窗位置
    const handleMapChange = () => {
      if (locationInfo.value) {
        requestAnimationFrame(updatePos)
      }
    }
    mapInstance.value.on('camera-change', handleMapChange)
    mapInstance.value.on('pan', handleMapChange)
    mapInstance.value.on('rotate', handleMapChange)
    mapInstance.value.on('pitch', handleMapChange)

    loading.value = false
  } catch (e) {
    console.error(e)
    loading.value = false
    showDialog({
      title: '地图加载失败',
      message: '请确保在腾讯位置服务控制台勾选了 "Javascript API" 和 "Javascript API GL"。\n当前 Key: ' + QQ_MAP_KEY
    })
  }
}

function updatePos() {
  if (!mapInstance.value || !locationInfo.value || !TMapLatLng) return
  
  const lat = Number(locationInfo.value.lat)
  const lng = Number(locationInfo.value.lng)
  const latLng = new TMapLatLng(lat, lng)
  
  const pos = mapInstance.value.projectToContainer(latLng)
  
  if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
    infoWindowPos.value = {
      x: pos.x,
      y: pos.y - 45
    }
  }
}

function closeCard() {
  locationInfo.value = null
}

function closeRouteCard() {
  routeSegmentInfo.value = null
}

function openNavigationWithParams(name, address, lat, lng) {
  const url = `https://apis.map.qq.com/uri/v1/marker?marker=coord:${lat},${lng};title:${encodeURIComponent(name)};addr:${encodeURIComponent(address)}&referer=chongqing_tour`
  window.open(url, '_blank')
}

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (mapInstance.value) {
    mapInstance.value.destroy()
  }
})
</script>

<template>
  <div class="map-page">
    <div class="nav-header">
      <div class="back-btn" @click="router.back()">
        <van-icon name="arrow-left" />
      </div>
      <div class="title">路线概览</div>
    </div>

    <div id="map-container" ref="mapContainer"></div>

    <div v-if="loading" class="loading-mask">
      <van-loading color="#1989fa" vertical>路线规划中...</van-loading>
    </div>

    <div 
      v-if="locationInfo" 
      class="vue-info-window"
      :style="{ left: infoWindowPos.x + 'px', top: infoWindowPos.y + 'px' }"
    >
      <div class="info-header">
        <h3>{{ locationInfo.name }}</h3>
        <van-icon name="cross" class="close-icon" @click.stop="closeCard" />
      </div>
      <div class="info-body">
        <p><van-icon name="location-o" /> {{ locationInfo.address }}</p>
      </div>
      <div class="info-footer">
        <van-button 
          size="small" 
          type="primary" 
          round 
          block 
          icon="guide-o" 
          @click.stop="openNavigationWithParams(locationInfo.name, locationInfo.address, locationInfo.lat, locationInfo.lng)"
        >
          去这里
        </van-button>
      </div>
      <div class="arrow"></div>
    </div>

    <!-- 路线说明卡片 (右下角) -->
    <div 
      v-if="routeSegmentInfo" 
      class="route-info-card"
    >
      <div class="info-header">
        <h3>{{ routeSegmentInfo.title }}</h3>
        <van-icon name="cross" class="close-icon" @click.stop="closeRouteCard" />
      </div>
      <div class="info-body">
        <p class="route-desc">{{ routeSegmentInfo.description }}</p>
        <p class="route-tip"><van-icon name="info-o" /> {{ routeSegmentInfo.tip }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vue-info-window {
  position: absolute;
  transform: translate(-50%, -100%);
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  width: 220px;
  z-index: 100;
  pointer-events: auto;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.info-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
  line-height: 1.4;
  flex: 1;
}

.close-icon {
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 2px;
}

.info-body {
  margin-bottom: 12px;
}

.info-body p {
  margin: 0;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.arrow {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 12px;
  height: 12px;
  background: #fff;
  box-shadow: 2px 2px 4px rgba(0,0,0,0.05);
  z-index: -1;
}

.map-page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #f5f5f5;
}

#map-container {
  width: 100%;
  height: 100%;
  z-index: 1;
}

.nav-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%);
  z-index: 999;
  color: #fff;
  pointer-events: none;
}

.back-btn {
  width: 40px;
  height: 40px;
  background: rgba(255,255,255,0.95);
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  font-size: 22px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  pointer-events: auto;
  cursor: pointer;
  margin-right: 12px;
  transition: transform 0.2s;
}

.back-btn:active {
  transform: scale(0.9);
}

.title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  margin-right: 52px;
}

.loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #fff;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
}

.route-info-card {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  width: 260px;
  z-index: 100;
  pointer-events: auto;
  animation: slideInUp 0.3s ease-out;
}

.route-desc {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-bottom: 8px;
}

.route-tip {
  font-size: 12px;
  color: #1989fa;
  background: #f0f9ff;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

@keyframes slideInUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
