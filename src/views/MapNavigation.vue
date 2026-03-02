<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { loadQQMap } from '@/utils/qqMapLoader.js'
import { fetchPopularAttractionsForMap, fetchPopularAttractions } from '@/api'

const router = useRouter()
const route = useRoute()
const mapContainer = ref(null)
const mapInstance = ref(null)
const loading = ref(true)
const currentMarker = ref(null) // 当前选中的标记
const locationInfo = ref(null)  // 信息窗体数据
const infoWindowPos = ref({ x: -999, y: -999 }) // 信息窗体屏幕坐标

// 腾讯地图 Key
const QQ_MAP_KEY = 'FSVBZ-V6BK3-CHU3D-RZZQN-VGFIS-PXFW6'

// 热门景点列表（从接口拉取，坐标需为 GCJ-02）
const landmarks = ref([])

// 全局变量存储 LatLng 构造函数，以便在 updatePos 中使用
let TMapLatLng = null

// 初始化地图
async function initMap() {
  try {
    const TMap = await loadQQMap(QQ_MAP_KEY)
    TMapLatLng = TMap.LatLng // 保存引用
    
    // 注意：腾讯地图 GL 的 LatLng 构造函数是 (lat, lng)，这与高德/百度数组 [lng, lat] 不同
    // 中心点：梁平
    const center = new TMap.LatLng(30.6768, 107.8025)

    mapInstance.value = new TMap.Map(mapContainer.value, {
      center: center,
      zoom: 13,
      viewMode: '3D',
      pitch: 45, // 俯视角度
      rotation: 0,
    })

    // 移除原本的控件（可选，腾讯地图默认控件比较简洁）
    mapInstance.value.removeControl(TMap.constants.DEFAULT_CONTROL_ID.ZOOM)

    // 解析路由参数
    const { lat, lng, name, address } = route.query
    let targetLatLng = null

    // 准备标记点数据
    const geometries = []
    
    // 1. 添加路由传递的目标点
    if (lat && lng) {
      targetLatLng = new TMap.LatLng(Number(lat), Number(lng))
      geometries.push({
        id: 'target',
        styleId: 'target',
        position: targetLatLng,
        properties: { title: name || '目标位置', address: address || '暂无详细地址', isTarget: true }
      })
      
      // 默认选中目标点
      locationInfo.value = {
        name: name || '目标位置',
        position: [Number(lat), Number(lng)],
        address: address || '暂无详细地址'
      }
      mapInstance.value.setCenter(targetLatLng)
      mapInstance.value.setZoom(16)
    }

    // 2. 拉取热门景点并添加到标记集合（优先使用完整列表以便携带 attractionId）
    try {
      const fullList = await fetchPopularAttractions()
      if (Array.isArray(fullList) && fullList.length) {
        landmarks.value = fullList.map((it) => ({
          id: it.id,
          name: it.name,
          position: [Number(it.latitude), Number(it.longitude)],
          address: it.description || '',
          attractionId: it.attractionId
        }))
      } else {
        const mapList = await fetchPopularAttractionsForMap()
        landmarks.value = (Array.isArray(mapList) ? mapList : []).map((it, idx) => ({
          id: idx + 1,
          name: it.name,
          position: [Number(it.latitude), Number(it.longitude)],
          address: it.description || '',
          attractionId: undefined
        }))
      }
    } catch (_) {}

    landmarks.value.forEach(item => {
      // 简单的去重逻辑：如果和目标点非常近则不添加
      if (targetLatLng && Math.abs(item.position[0] - targetLatLng.lat) < 0.0001 && Math.abs(item.position[1] - targetLatLng.lng) < 0.0001) {
        return
      }
      geometries.push({
        id: String(item.id),
        styleId: 'normal',
        position: new TMap.LatLng(item.position[0], item.position[1]),
        properties: { title: item.name, address: item.address, isTarget: false, attractionId: item.attractionId }
      })
    })

    // 如果未指定目标点，且存在热门景点，则将地图中心定位到第一个热门点并显示默认卡片
    if (!targetLatLng && landmarks.value.length > 0) {
      const first = landmarks.value[0]
      const centerLatLng = new TMap.LatLng(first.position[0], first.position[1])
      mapInstance.value.setCenter(centerLatLng)
      mapInstance.value.setZoom(14)
      locationInfo.value = {
        name: first.name,
        address: first.address,
        lat: first.position[0],
        lng: first.position[1],
        attractionId: first.attractionId
      }
      updatePos()
    }

    // 创建标记图层
    const markerLayer = new TMap.MultiMarker({
      map: mapInstance.value,
      styles: {
        // 目标点样式（红色）
        target: new TMap.MarkerStyle({ 
          width: 30, 
          height: 40, 
          anchor: { x: 15, y: 40 },
          src: 'https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/markerDefault.png', 
        }),
        // 普通点样式（蓝色）
        normal: new TMap.MarkerStyle({ 
          width: 25, 
          height: 35, 
          anchor: { x: 12, y: 35 },
          src: 'https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/markerDefault.png' 
        })
      },
      geometries: geometries
    })

    // 监听标记点击事件
    markerLayer.on('click', (evt) => {
      const props = evt.geometry.properties
      const position = evt.geometry.position
      
      // 更新当前选中信息
      locationInfo.value = {
        name: props.title,
        address: props.address,
        lat: position.lat,
        lng: position.lng,
        attractionId: props.attractionId
      }

      // 计算屏幕坐标并显示
      updatePos()
      
      // 移动地图中心
      mapInstance.value.easeTo({ center: position, zoom: 16 }, { duration: 500 })
    })

    // 监听地图各种变化事件，更新信息窗体位置
    // 使用 requestAnimationFrame 优化性能
    const handleMapChange = () => {
      if (locationInfo.value) {
        requestAnimationFrame(updatePos)
      }
    }

    mapInstance.value.on('camera-change', handleMapChange)
    mapInstance.value.on('pan', handleMapChange)
    mapInstance.value.on('rotate', handleMapChange)
    mapInstance.value.on('pitch', handleMapChange)
    mapInstance.value.on('idle', handleMapChange) // 确保动画结束后位置正确

    // 点击地图空白处关闭信息窗体
    mapInstance.value.on('click', () => {
      // 这里需要判断是否点击的是标记，但 MultiMarker 的 click 事件会先触发
      // 简单处理：延迟一点，如果 marker click 触发了，会重新设置 locationInfo
      setTimeout(() => {
        // 实际上更好的做法是：在 marker click 里阻止冒泡或者设置一个标志位
        // 但 TMap 事件模型比较简单，这里不做复杂处理，依靠 markerLayer 的 click 覆盖
      }, 0)
    })

    // 如果没有目标点，尝试定位
    if (!targetLatLng) {
      // 腾讯地图前端定位插件需要单独加载，这里简化使用浏览器原生定位
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          // 注意：浏览器原生定位是 WGS84，腾讯地图需要 GCJ02。
          // 简单演示暂不转换，实际应转换或使用腾讯 IP 定位服务
          // mapInstance.value.setCenter(new TMap.LatLng(lat, lng))
          showToast('定位成功 (WGS84)')
        }, () => {
          showToast('定位失败，已显示默认位置')
        })
      }
    }

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

// 更新信息窗体位置（将地图坐标转换为屏幕坐标）
function updatePos() {
  if (!mapInstance.value || !locationInfo.value || !TMapLatLng) return
  
  const lat = Number(locationInfo.value.lat)
  const lng = Number(locationInfo.value.lng)
  const latLng = new TMapLatLng(lat, lng)
  
  const pos = mapInstance.value.projectToContainer(latLng)
  
  // 偏移量：让窗体显示在标记上方
  // 修正：如果 pos.x/y 出现 NaN 或异常值，不更新
  if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
    infoWindowPos.value = {
      x: pos.x,
      y: pos.y - 45 // 向上偏移 45px
    }
  }
}

// 关闭底部卡片
function closeCard() {
  locationInfo.value = null
}

// 唤起外部导航（带参数）
function openNavigationWithParams(name, address, lat, lng) {
  // 腾讯地图 URI Scheme: qqmap://map/marker?marker=coord:lat,lng;title:name;addr:address&referer=myapp
  // 网页端跳转: https://apis.map.qq.com/uri/v1/marker?marker=coord:lat,lng;title:name;addr:address&referer=myapp
  
  const url = `https://apis.map.qq.com/uri/v1/marker?marker=coord:${lat},${lng};title:${encodeURIComponent(name)};addr:${encodeURIComponent(address)}&referer=chongqing_tour`
  
  // 使用新窗口打开，以便用户可以返回
  window.open(url, '_blank')
}

/**
 * 跳转到景点详情
 * @param {number|string|undefined} attractionId
 */
function goViewAttraction(attractionId) {
  if (!attractionId) return
  router.push({ name: 'scenic-detail', params: { id: attractionId } })
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
    <!-- 顶部导航栏（悬浮） -->
    <div class="nav-header">
      <div class="back-btn" @click="router.back()">
        <van-icon name="arrow-left" />
      </div>
      <div class="title">景点地图</div>
    </div>

    <!-- 地图容器 -->
    <div id="map-container" ref="mapContainer"></div>

    <!-- 加载中遮罩 -->
    <div v-if="loading" class="loading-mask">
      <van-loading color="#1989fa" vertical>地图加载中...</van-loading>
    </div>

    <!-- 自定义 Vue 信息窗体 (跟随地图移动) -->
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
          去这里 (导航)
        </van-button>
        <van-button 
          v-if="locationInfo?.attractionId"
          size="small" 
          type="default" 
          round 
          block 
          style="margin-top:8px" 
          icon="search" 
          @click.stop="goViewAttraction(locationInfo.attractionId)"
        >
          查看景点
        </van-button>
      </div>
      <!-- 小三角 -->
      <div class="arrow"></div>
    </div>
  </div>
</template>

<style scoped>
/* Vue 实现的信息窗体 */
.vue-info-window {
  position: absolute;
  transform: translate(-50%, -100%); /* 居中并显示在上方 */
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  width: 240px;
  z-index: 100;
  pointer-events: auto; /* 确保可以点击 */
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
  box-shadow: 2px 2px 4px rgba(0,0,0,0.05); /* 仅显示下方的阴影 */
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

/* 悬浮导航栏 */
.nav-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%); /* 加深背景 */
  z-index: 999; /* 提高层级，确保在地图控件之上 */
  color: #fff;
  pointer-events: none; /* 让点击穿透到地图，除了按钮 */
}

.back-btn {
  width: 40px; /* 加大按钮区域 */
  height: 40px;
  background: rgba(255,255,255,0.95); /* 提高不透明度 */
  border: 1px solid rgba(0,0,0,0.1); /* 增加边框 */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  font-size: 22px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15); /* 加深阴影 */
  pointer-events: auto; /* 恢复点击 */
  cursor: pointer;
  margin-right: 12px; /* 增加右侧间距 */
  transition: transform 0.2s;
}

.back-btn:active {
  transform: scale(0.9);
}

.title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 600; /* 加粗 */
  text-shadow: 0 2px 4px rgba(0,0,0,0.3); /* 增强文字阴影 */
  margin-right: 52px; /* 平衡左侧按钮占位 (40 + 12) */
}

/* 加载遮罩 */
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
</style>
