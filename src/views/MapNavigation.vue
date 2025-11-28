<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { loadQQMap } from '@/utils/qqMapLoader.js'

const router = useRouter()
const route = useRoute()
const mapContainer = ref(null)
const mapInstance = ref(null)
const loading = ref(true)
const currentMarker = ref(null) // 当前选中的标记
const locationInfo = ref(null)  // 底部卡片信息

// 腾讯地图 Key
const QQ_MAP_KEY = 'FSVBZ-V6BK3-CHU3D-RZZQN-VGFIS-PXFW6'

// 示例景点数据（重庆热门景点，坐标需为 GCJ-02）
const landmarks = ref([
  { id: 1, name: '洪崖洞', position: [29.561737, 106.579179], address: '重庆市渝中区嘉陵江滨江路88号' },
  { id: 2, name: '解放碑', position: [29.557078, 106.577128], address: '重庆市渝中区解放碑步行街' },
  { id: 3, name: '李子坝轻轨站', position: [29.553912, 106.548486], address: '重庆市渝中区李子坝正街' },
  { id: 4, name: '磁器口古镇', position: [29.579819, 106.448276], address: '重庆市沙坪坝区磁器口' },
])

// 初始化地图
async function initMap() {
  try {
    const TMap = await loadQQMap(QQ_MAP_KEY)
    
    // 注意：腾讯地图 GL 的 LatLng 构造函数是 (lat, lng)，这与高德/百度数组 [lng, lat] 不同
    // 中心点：重庆
    const center = new TMap.LatLng(29.564706, 106.550713)

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

    // 2. 添加预置景点
    landmarks.value.forEach(item => {
      // 简单的去重逻辑：如果和目标点非常近则不添加
      if (targetLatLng && Math.abs(item.position[0] - targetLatLng.lat) < 0.0001 && Math.abs(item.position[1] - targetLatLng.lng) < 0.0001) {
        return
      }
      geometries.push({
        id: String(item.id),
        styleId: 'normal',
        position: new TMap.LatLng(item.position[0], item.position[1]),
        properties: { title: item.name, address: item.address, isTarget: false }
      })
    })

    // 创建标记图层
    const markerLayer = new TMap.MultiMarker({
      map: mapInstance.value,
      styles: {
        // 目标点样式（红色）
        target: new TMap.MarkerStyle({ 
          width: 30, 
          height: 40, 
          anchor: { x: 15, y: 40 },
          src: 'https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/markerDefault.png', // 默认蓝色
          // 腾讯地图 GL 默认图标较少，这里用 filter 变色或使用自定义图片
          // 实际项目中建议替换为你的红色图标 URL
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
      const lat = evt.geometry.position.lat
      const lng = evt.geometry.position.lng
      
      locationInfo.value = {
        name: props.title,
        address: props.address,
        position: [lat, lng]
      }
      
      mapInstance.value.easeTo({ center: evt.geometry.position, zoom: 16 }, { duration: 500 })
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

// 唤起外部导航
function openNavigation() {
  if (!locationInfo.value) return
  
  const { name, position } = locationInfo.value
  // 腾讯地图 URI Scheme: qqmap://map/marker?marker=coord:lat,lng;title:name;addr:address&referer=myapp
  // 网页端跳转: https://apis.map.qq.com/uri/v1/marker?marker=coord:lat,lng;title:name;addr:address&referer=myapp
  
  const lat = position[0]
  const lng = position[1]
  
  const url = `https://apis.map.qq.com/uri/v1/marker?marker=coord:${lat},${lng};title:${encodeURIComponent(name)};addr:${encodeURIComponent(locationInfo.value.address)}&referer=chongqing_tour`
  
  // 使用新窗口打开，以便用户可以返回
  window.open(url, '_blank')
}

// 关闭底部卡片
function closeCard() {
  locationInfo.value = null
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

    <!-- 底部信息卡片（选中景点时显示） -->
    <transition name="slide-up">
      <div v-if="locationInfo" class="info-card">
        <div class="card-header">
          <h3>{{ locationInfo.name }}</h3>
          <van-icon name="cross" class="close-icon" @click="closeCard" />
        </div>
        <p class="address">
          <van-icon name="location-o" /> {{ locationInfo.address }}
        </p>
        <div class="actions">
          <van-button type="primary" round block icon="guide-o" @click="openNavigation">
            去这里（导航）
          </van-button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
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

/* 底部信息卡片 */
.info-card {
  position: absolute;
  bottom: 24px;
  left: 16px;
  right: 16px;
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  z-index: 10;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-icon {
  font-size: 20px;
  color: #999;
  padding: 4px;
}

.address {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.actions {
  display: flex;
  gap: 12px;
}

/* 动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
