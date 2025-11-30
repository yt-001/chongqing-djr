<template>
  <div class="admin-guide-map">
    <!-- 腾讯地图层 (最底层) -->
  <div 
      id="map-container" 
      class="map-container"
      @contextmenu.prevent
    ></div>

    <!-- 自定义 DOM 标记层（固定像素大小，随地图移动） -->
    <div 
      v-if="!mapImageUrl && geoMarkers.length > 0" 
      class="dom-markers-layer"
    >
      <div
        v-for="m in geoMarkers"
        :key="m.id"
        class="dom-marker"
        :style="{ left: (domMarkerPos[m.id]?.x ?? -9999) + 'px', top: (domMarkerPos[m.id]?.y ?? -9999) + 'px' }"
        @contextmenu.prevent
        @click="focusOnMarker(m)"
      >
        <img :src="DEFAULT_MARKER_ICON" alt="marker" class="dom-marker-icon" />
      </div>
    </div>

    <!-- 右键菜单 -->
    <div 
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
    >
      <div class="menu-item" @click="onContextSetMarker">
        <el-icon><Location /></el-icon> 标记点=地点
      </div>
      <div class="menu-item" @click="onContextAssociate">
        <el-icon><Link /></el-icon> 关联其他地点
      </div>
    </div>

    <!-- 右下角标记点列表 -->
    <div v-if="!mapImageUrl && geoMarkers.length > 0" class="bottom-right-panel">
      <div class="panel-header-small">
        <span>已标记地点</span>
        <span class="count">{{ geoMarkers.length }}</span>
      </div>
      <div class="geo-marker-list">
        <div 
          v-for="(marker, index) in geoMarkers" 
          :key="marker.id"
          class="geo-marker-item"
          @click="focusOnMarker(marker)"
        >
          <span class="index">{{ index + 1 }}</span>
          <span class="name" :title="marker.name">{{ marker.name }}</span>
          <el-icon class="delete-btn" @click.stop="removeGeoMarker(index, marker.id)"><Delete /></el-icon>
        </div>
      </div>
    </div>

    <!-- 手绘图/画布区域 (覆盖在地图之上，仅当有图片时显示) -->
    <div 
      v-if="mapImageUrl"
      class="map-editor-overlay" 
      ref="mapEditorRef"
      @mousedown="startDrag"
      @wheel.prevent="handleWheel"
    >
       <div class="canvas-wrapper" :style="canvasStyle">
         <!-- 地图图片与标注 -->
         <div class="image-container" @click.stop="handleMapClick">
            <img :src="mapImageUrl" class="map-image" alt="Guide Map" draggable="false" />
            
            <!-- 渲染标注点 -->
            <div 
              v-for="(marker, index) in markers" 
              :key="index"
              class="map-marker"
              :style="{ left: marker.x + '%', top: marker.y + '%' }"
              @click.stop="currentMarkerIndex = index"
            >
              <el-tooltip :content="marker.name || '未命名'" placement="top">
                <div class="marker-dot" :class="{ active: currentMarkerIndex === index }">
                  {{ index + 1 }}
                </div>
              </el-tooltip>
            </div>
         </div>
      </div>
    </div>

    <!-- 悬浮控制面板 -->
    <div class="floating-panel">
      <div class="panel-header">
        <h3>旅游向导图制作</h3>
        <el-button type="primary" size="small" @click="onSave">保存配置</el-button>
      </div>

      <el-form label-position="top" size="default">
        <el-form-item label="选择景点">
          <el-select
            v-model="selectedAttractionId"
            filterable
            remote
            placeholder="请输入景点名称搜索"
            :remote-method="searchAttractions"
            :loading="searchLoading"
            @change="handleAttractionChange"
            style="width: 100%"
          >
            <el-option
              v-for="item in attractionOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <!-- 地图点击信息展示 (当没有上传手绘图时显示) -->
      <div v-if="!mapImageUrl && mapClickInfo.lat" class="map-info-card">
        <div class="info-title">地图选点信息</div>
        <div class="info-row">
          <span class="label">坐标:</span>
          <span class="value">{{ mapClickInfo.lat.toFixed(6) }}, {{ mapClickInfo.lng.toFixed(6) }}</span>
        </div>
        <div class="info-row" v-if="mapClickInfo.name">
          <span class="label">名称:</span>
          <span class="value">{{ mapClickInfo.name }}</span>
        </div>
      </div>

      <div v-if="selectedAttractionId" class="panel-content">
        <!-- 上传/更换底图区域 -->
        <div class="upload-area">
           <el-upload
             class="upload-btn-wrapper"
             action="#"
             :auto-upload="false"
             :show-file-list="false"
             :on-change="handleFileChange"
           >
             <el-button type="primary" plain style="width: 100%">
                <el-icon style="margin-right: 6px"><UploadFilled /></el-icon>
                {{ mapImageUrl ? '更换手绘图' : '上传手绘图' }}
             </el-button>
           </el-upload>
           
           <el-button v-if="mapImageUrl" style="margin-top: 10px; width: 100%" @click="mapImageUrl = ''">
             取消手绘图 (查看地图)
           </el-button>
        </div>

        <div v-if="mapImageUrl">
           <el-divider content-position="left">手绘图操作</el-divider>
           <div class="map-actions">
             <el-button size="small" @click="resetView">重置视图</el-button>
           </div>
        </div>

        <el-divider content-position="left">标注点列表</el-divider>
        
        <div class="list-header">
          <span class="tips">
            {{ mapImageUrl ? '在左侧图上点击添加标注' : '请先上传手绘图以开始标注' }}
          </span>
        </div>

        <div class="marker-list">
          <el-empty v-if="markers.length === 0" description="暂无标注" :image-size="40" />
          <div 
            v-for="(marker, index) in markers" 
            :key="index" 
            class="marker-item"
            :class="{ active: currentMarkerIndex === index }"
            @click="currentMarkerIndex = index"
          >
            <div class="marker-info">
              <span class="index-badge">{{ index + 1 }}</span>
              <el-input v-model="marker.name" size="small" placeholder="标注名称" @focus="currentMarkerIndex = index" />
            </div>
            <el-button type="danger" icon="Delete" link @click.stop="removeMarker(index)" />
          </div>
        </div>
      </div>
      
      <!-- 未选择景点时的提示 -->
      <div v-else class="panel-tips">
        <el-alert title="请先搜索并选择一个景点" type="info" :closable="false" show-icon />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Delete, Location, Link } from '@element-plus/icons-vue'
import { fetchPopularAttractionCandidatesPage } from '@/api'
import { loadQQMap } from '@/utils/qqMapLoader.js'

// 腾讯地图 Key
const QQ_MAP_KEY = 'FSVBZ-V6BK3-CHU3D-RZZQN-VGFIS-PXFW6'
// 默认标记图标 (红色定位针)
const DEFAULT_MARKER_ICON = 'https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/markerDefault.png'
const mapInstance = ref(null)
let TMapObj = null // 保存 TMap 类引用
let clickHandler = null // 保存点击事件监听器
let geoMarkerLayer = null // TMap MultiMarker Layer
let domOverlayHandler = null // 自定义DOM标记层事件处理器
// 自定义 DOM 标记位置字典（id -> {x,y} 像素坐标）
const domMarkerPos = ref({})

// 状态
const searchLoading = ref(false)
const attractionOptions = ref([])
const selectedAttractionId = ref(null)
const mapImageUrl = ref('')
const markers = ref([]) // 手绘图标记
const geoMarkers = ref([]) // 地图真实坐标标记
const currentMarkerIndex = ref(-1)
const mapClickInfo = ref({ lat: 0, lng: 0, name: '' })

// 右键菜单状态
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  lat: 0,
  lng: 0
})

// 视图变换状态 (仅用于手绘图)
const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const lastMouseX = ref(0)
const lastMouseY = ref(0)
const mapEditorRef = ref(null)

const canvasStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`,
  transformOrigin: 'center center'
}))

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (mapInstance.value && clickHandler) {
    mapInstance.value.off('click', clickHandler)
  }
  // 解绑自定义DOM标记层事件
  if (mapInstance.value && domOverlayHandler) {
    const events = ['camera-change','pan','rotate','zoom','move','moveend','dragging','resize']
    events.forEach(ev => {
      try { mapInstance.value.off(ev, domOverlayHandler) } catch {}
    })
  }
})

async function initMap() {
  try {
    const TMap = await loadQQMap(QQ_MAP_KEY)
    TMapObj = TMap
    
    // 初始化地图，中心设为重庆
    const center = new TMap.LatLng(29.56301, 106.551557)
    mapInstance.value = new TMap.Map(document.getElementById('map-container'), {
      center: center,
      zoom: 12,
      viewMode: '2D', // 管理端用2D可能更清晰，或者3D
      pitch: 0,
      rotation: 0,
      baseMap: {
        type: 'vector',
        features: ['base', 'building2d', 'point'] // 隐藏3D建筑，保持干净
      }
    })
    
    // 移除缩放控件，保持界面整洁（可选）
    mapInstance.value.removeControl(TMap.constants.DEFAULT_CONTROL_ID.ZOOM)
    
    // 绑定点击事件
    clickHandler = onTMapClick
    mapInstance.value.on('click', clickHandler)

    // 绑定鼠标按下事件 (用于右键菜单)
    // 注意：TMap GL 某些版本不支持 contextmenu 事件，使用 mousedown + button=2 判断
    mapInstance.value.on('mousedown', onMapMouseDown)

    // 阻止默认右键菜单
    const container = document.getElementById('map-container')
    if (container) {
      container.addEventListener('contextmenu', (e) => {
        e.preventDefault()
      })
    }
    if (container) {
      container.addEventListener('contextmenu', (e) => {
        e.preventDefault()
      })
    }
    
    // 初始化 MultiMarker 图层
    geoMarkerLayer = new TMapObj.MultiMarker({
      map: mapInstance.value,
      styles: {
        // 普通样式 (参考用户端)
        normal: new TMapObj.MarkerStyle({
          width: 25,
          height: 35,
          anchor: { x: 12, y: 35 },
          src: DEFAULT_MARKER_ICON
        })
      },
      geometries: []
    })

    // 监听全局点击以关闭右键菜单
    window.addEventListener('click', closeContextMenu)

    // 初始化自定义 DOM 标记层监听
    initDomMarkerOverlay()

  } catch (e) {
    console.error('地图加载失败', e)
    ElMessage.error('地图服务加载失败，请检查网络')
  }
}

/**
 * 更新地图标记图层的几何数据，确保所有 geoMarkers 可视
 */
function updateMarkerLayer() {
  if (!geoMarkerLayer || !TMapObj) return
  
  const geometries = geoMarkers.value.map(marker => ({
    id: marker.id,
    styleId: 'normal',
    position: new TMapObj.LatLng(marker.lat, marker.lng),
    properties: {
      title: marker.name
    }
  }))
  
  geoMarkerLayer.setGeometries(geometries)

  // 同步更新自定义 DOM 标记位置
  updateDomMarkerPositions()
}

/**
 * 初始化自定义 DOM 标记层，绑定地图相机变化事件以更新位置
 */
function initDomMarkerOverlay() {
  if (!mapInstance.value || !TMapObj) return
  domOverlayHandler = () => requestAnimationFrame(updateDomMarkerPositions)
  const events = ['camera-change','pan','rotate','zoom','move','moveend','dragging','resize']
  events.forEach(ev => mapInstance.value.on(ev, domOverlayHandler))
  // 浏览器窗口或容器尺寸变化
  window.addEventListener('resize', domOverlayHandler)
  updateDomMarkerPositions()
}

/**
 * 将 geoMarkers 的经纬度转换为屏幕像素坐标，更新 domMarkerPos
 */
function updateDomMarkerPositions() {
  if (!mapInstance.value || !TMapObj) return
  const next = {}
  for (const m of geoMarkers.value) {
    const latLng = new TMapObj.LatLng(Number(m.lat), Number(m.lng))
    const pos = mapInstance.value.projectToContainer(latLng)
    if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
      // 使图标底部中心对准点位
      next[m.id] = { x: pos.x - 12, y: pos.y - 35 }
    }
  }
  domMarkerPos.value = next
}


function onTMapClick(evt) {
  // 仅在没有手绘图覆盖时处理地图点击
  if (mapImageUrl.value) return
  
  // 关闭右键菜单
  closeContextMenu()

  const lat = evt.latLng.getLat()
  const lng = evt.latLng.getLng()
  let name = ''
  
  // 尝试获取 POI 信息
  if (evt.poi) {
    name = evt.poi.name
  }
  
  mapClickInfo.value = { lat, lng, name }
  
  // 放大并居中 (使用 easeTo 实现平滑过渡)
  // 如果当前缩放级别小于 16，则放大到 16；否则保持当前级别
  const targetZoom = Math.max(mapInstance.value.getZoom(), 16)
  
  mapInstance.value.easeTo({
    center: evt.latLng,
    zoom: targetZoom,
    duration: 1000 // 1秒动画时长
  }, {
    // 动画结束后的回调（可选）
  })
}

// 处理地图鼠标按下（检测右键）
function onMapMouseDown(evt) {
  // 兼容性处理：检查 button 属性
  // 0:左键, 1:中键, 2:右键
  const btn = evt.button !== undefined ? evt.button : (evt.originalEvent ? evt.originalEvent.button : -1)
  
  if (btn === 2) {
    handleMapRightClick(evt)
  }
}

// 处理地图右键点击
function handleMapRightClick(evt) {
  if (mapImageUrl.value) return
  
  // evt 是 TMap 的事件对象，包含 latLng
  const latLng = evt.latLng || evt.geometry?.position
  
  if (!latLng) {
    console.warn('无法获取点击坐标', evt)
    return
  }

  // 获取屏幕坐标
  let clientX = 0
  let clientY = 0
  
  if (evt.originalEvent) {
    clientX = evt.originalEvent.clientX
    clientY = evt.originalEvent.clientY
  } else if (evt.point) {
    // 如果没有 originalEvent，尝试使用 container 坐标 + offset
    // 但通常 mousedown 都有 originalEvent
    const rect = document.getElementById('map-container').getBoundingClientRect()
    clientX = rect.left + evt.point.x
    clientY = rect.top + evt.point.y
  } else {
     // 最后的兜底，显示在屏幕中心
     clientX = window.innerWidth / 2
     clientY = window.innerHeight / 2
  }

  contextMenu.value = {
    visible: true,
    x: clientX,
    y: clientY,
    lat: latLng.getLat(),
    lng: latLng.getLng()
  }
  // 尝试记录POI名称（若右键事件包含poi）
  try {
    const poiName = evt?.poi?.name || ''
    if (poiName) {
      mapClickInfo.value.name = poiName
    }
  } catch {}
}

function closeContextMenu() {
  contextMenu.value.visible = false
}

/**
 * 右键菜单：添加地图标记
 * 要求：成功获取 POI 名称；且不允许重复添加
 */
function onContextSetMarker() {
  if (!TMapObj || !geoMarkerLayer) {
    ElMessage.warning('地图组件仍在加载中，请稍候')
    return
  }
  
  const { lat, lng } = contextMenu.value
  
  // 重复检查：检查是否有距离极近的标记点 (阈值约10米)
  const isDuplicate = geoMarkers.value.some(marker => 
    Math.abs(marker.lat - lat) < 0.0001 && Math.abs(marker.lng - lng) < 0.0001
  )

  if (isDuplicate) {
    ElMessage.warning('该地点已添加标记，请勿重复添加')
    closeContextMenu()
    return
  }

  const id = `marker-${Date.now()}`
  // 必须具备POI名称，否则不允许添加
  const markerName = mapClickInfo.value.name
  if (!markerName) {
    ElMessage.warning('未获取地点名称，无法添加标记')
    closeContextMenu()
    return
  }
  
  // 添加到 geoMarkers 状态
  geoMarkers.value.push({
    id,
    lat,
    lng,
    name: markerName
  })
  
  // 更新地图显示 (使用 setGeometries 重绘，确保稳定)
  updateMarkerLayer()
  
  ElMessage.success(`成功标记：${markerName}`)
  closeContextMenu()
}

function removeGeoMarker(index, id) {
  geoMarkers.value.splice(index, 1)
  updateMarkerLayer()
}

function focusOnMarker(marker) {
  if (!mapInstance.value || !TMapObj) return
  mapInstance.value.easeTo({
    center: new TMapObj.LatLng(marker.lat, marker.lng),
    zoom: 17,
    duration: 500
  })
}

function onContextAssociate() {
  ElMessage.info('关联功能开发中：请选择要关联的其他地点')
  closeContextMenu()
}

// 搜索景点
async function searchAttractions(query) {
  if (!query) {
    attractionOptions.value = []
    return
  }
  searchLoading.value = true
  try {
    const res = await fetchPopularAttractionCandidatesPage({
      pageNum: 1,
      pageSize: 20,
      query: { name: query }
    })
    attractionOptions.value = (res.list || []).map(item => ({
      id: item.id,
      name: item.name,
      // 如果后端返回了 lat/lng，这里可以存下来。
      // 假设目前接口没有返回，我们后续可能需要通过 TMap 服务搜索坐标
      lat: item.lat || null,
      lng: item.lng || null
    }))
  } catch (e) {
    console.error(e)
  } finally {
    searchLoading.value = false
  }
}

function handleAttractionChange(val) {
  // 1. 重置手绘图状态
  markers.value = []
  mapImageUrl.value = '' 
  currentMarkerIndex.value = -1
  resetView()
  mapClickInfo.value = { lat: 0, lng: 0, name: '' } // 重置点击信息
  
  // 2. 地图跳转
  // 找到选中的 item
  const item = attractionOptions.value.find(opt => opt.id === val)
  if (item) {
    if (item.lat && item.lng && TMapObj) {
       mapInstance.value.panTo(new TMapObj.LatLng(item.lat, item.lng))
       mapInstance.value.setZoom(16)
    } else if (TMapObj) {
       // 如果没有坐标，尝试用名称搜索 (Client-side search is tricky without plugin, 
       // but let's assume we rely on backend or just don't move if no coords)
       // 或者简单的：ElMessage.info('该景点暂无坐标信息')
       // 这里我们可以模拟一下：如果名字里有"动物园"，飞到重庆动物园
       if (item.name.includes('动物园')) {
         mapInstance.value.panTo(new TMapObj.LatLng(29.5078, 106.5101)) // 重庆动物园坐标
         mapInstance.value.setZoom(16)
       } else {
         ElMessage.info(`已切换到：${item.name} (暂无精确坐标跳转)`)
       }
    }
  }
}

function handleFileChange(uploadFile) {
  const reader = new FileReader()
  reader.readAsDataURL(uploadFile.raw)
  reader.onload = () => {
    mapImageUrl.value = reader.result
    resetView()
  }
}

// 视图控制
function resetView() {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
}

function handleWheel(e) {
  if (!mapImageUrl.value) return
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  const newScale = scale.value * delta
  if (newScale > 0.1 && newScale < 5) {
    scale.value = newScale
  }
}

function startDrag(e) {
  if (!mapImageUrl.value) return
  if (['INPUT', 'BUTTON', 'I', 'SPAN'].includes(e.target.tagName)) return
  
  isDragging.value = true
  lastMouseX.value = e.clientX
  lastMouseY.value = e.clientY
  
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}

function onDrag(e) {
  if (!isDragging.value) return
  const dx = e.clientX - lastMouseX.value
  const dy = e.clientY - lastMouseY.value
  translateX.value += dx
  translateY.value += dy
  lastMouseX.value = e.clientX
  lastMouseY.value = e.clientY
}

function stopDrag() {
  isDragging.value = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
}

// 地图点击 (手绘图)
function handleMapClick(e) {
  if (!mapImageUrl.value) return
  
  let target = e.target
  if (!target.classList.contains('map-image')) return
  
  const x = (e.offsetX / target.offsetWidth) * 100
  const y = (e.offsetY / target.offsetHeight) * 100
  
  markers.value.push({
    x: x.toFixed(2),
    y: y.toFixed(2),
    name: `标注点 ${markers.value.length + 1}`
  })
  currentMarkerIndex.value = markers.value.length - 1
}

function removeMarker(index) {
  markers.value.splice(index, 1)
  if (currentMarkerIndex.value === index) {
    currentMarkerIndex.value = -1
  }
}

function onSave() {
  if (!selectedAttractionId.value) return ElMessage.warning('请选择景点')
  if (!mapImageUrl.value) return ElMessage.warning('请上传手绘图')
  
  console.log('Saving:', {
    attractionId: selectedAttractionId.value,
    image: 'Base64 data...', 
    markers: markers.value
  })
  ElMessage.success('保存成功（模拟）')
}
</script>

<style scoped>
.admin-guide-map {
  position: relative;
  /* 抵消父级el-main的padding: 16px */
  margin: -16px;
  width: calc(100% + 32px);
  height: calc(100% + 32px);
  overflow: hidden;
  background: #e5e5e5; /* 地图加载前的底色 */
}

.dom-markers-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 20;
  pointer-events: none;
}

.dom-marker {
  position: absolute;
  pointer-events: auto;
}

.dom-marker-icon {
  width: 25px;
  height: 35px;
  display: block;
}

.map-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

/* 手绘图遮罩层 */
.map-editor-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  background: rgba(240, 242, 245, 0.8); /* 半透明背景，或纯色背景 */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;
}

.map-editor-overlay:active {
  cursor: grabbing;
}

.canvas-wrapper {
  transition: transform 0.1s ease-out;
  will-change: transform;
}

.image-container {
  position: relative;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  background: white; /* 图片背景 */
}

.map-image {
  display: block;
  max-height: 80vh; 
  pointer-events: auto;
}

/* 悬浮面板 */
.floating-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 340px;
  max-height: calc(100% - 40px);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  display: flex;
  flex-direction: column;
  z-index: 100;
  padding: 20px;
  box-sizing: border-box;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
}

.upload-area {
  margin-bottom: 20px;
}

.map-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  margin-top: 10px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.tips {
  font-size: 12px;
  color: #909399;
}

.marker-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.marker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: white;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.marker-item:hover {
  border-color: #c0c4cc;
}

.marker-item.active {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.marker-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.index-badge {
  width: 20px;
  height: 20px;
  background: #909399;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}

.marker-item.active .index-badge {
  background: #409eff;
}

/* 地图上的标注样式 */
.map-marker {
  position: absolute;
  width: 0; 
  height: 0;
  cursor: pointer;
  z-index: 10;
}

.marker-dot {
  width: 28px;
  height: 28px;
  background: #f56c6c;
  border: 2px solid white;
  border-radius: 50% 50% 0 50%;
  transform: translate(-50%, -100%) rotate(45deg);
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: bold;
  transition: transform 0.2s;
}

.marker-dot.active {
  background: #409eff;
  transform: translate(-50%, -100%) rotate(45deg) scale(1.2);
  z-index: 11;
}

.marker-dot::after {
  content: '';
  transform: rotate(-45deg);
}

.panel-tips {
  padding: 20px 0;
}

.map-info-card {
  background: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 16px;
}

.info-title {
  font-size: 13px;
  font-weight: bold;
  color: #e6a23c;
  margin-bottom: 6px;
}

.info-row {
  font-size: 12px;
  color: #606266;
  line-height: 1.6;
  display: flex;
}

.info-row .label {
  color: #909399;
  margin-right: 6px;
  white-space: nowrap;
}

.info-row .value {
  word-break: break-all;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  z-index: 9999; /* 提高层级，确保在所有元素之上 */
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  padding: 4px 0;
  min-width: 120px;
  border: 1px solid #ebeef5;
}

.menu-item {
  padding: 8px 16px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}

.menu-item:hover {
  background: #ecf5ff;
  color: #409eff;
}

/* 右下角标记列表 */
.bottom-right-panel {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 240px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  display: flex;
  flex-direction: column;
  z-index: 100;
  padding: 12px;
  /* 移除 max-height: 40vh限制，改由内部 list 控制高度 */
}

.panel-header-small {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.panel-header-small .count {
  background: #409eff;
  color: white;
  border-radius: 10px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: normal;
}

.geo-marker-list {
  overflow-y: auto;
  /* 假设每项高度约 44px (padding 8*2 + line-height + border等)，5项约为 220px */
  max-height: 220px; 
  scrollbar-width: thin;
}

.geo-marker-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.geo-marker-item:hover {
  background: #f5f7fa;
}

.geo-marker-item .index {
  width: 20px;
  height: 20px;
  background: #909399;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-right: 8px;
  flex-shrink: 0;
}

.geo-marker-item .name {
  flex: 1;
  font-size: 13px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.geo-marker-item .delete-btn {
  color: #f56c6c;
  opacity: 0;
  transition: opacity 0.2s;
}

.geo-marker-item:hover .delete-btn {
  opacity: 1;
}
</style>
