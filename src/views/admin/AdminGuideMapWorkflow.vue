<template>
  <div class="workflow-container">
    <div class="toolbar">
      <div class="left-tools">
        <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
        <span class="title">旅游路线编辑</span>
      </div>
      <div class="right-tools">
        <el-button @click="tempSaveWorkflow">暂存</el-button>
        <el-button type="primary" @click="saveWorkflow">保存工作流</el-button>
        <el-button @click="clearConnections">清空连线</el-button>
      </div>
    </div>
    
    <div class="tips-bar">
      <el-icon><InfoFilled /></el-icon>
      <span>操作指南：按住卡片拖拽移动位置 • 点击卡片右侧的 <span class="dot-icon">●</span> 拖出连线到另一个卡片 • 点击连线可编辑备注</span>
    </div>

    <div 
      class="canvas" 
      ref="canvasRef" 
      @mousemove="onMouseMove" 
      @mouseup="onMouseUp"
      @click="onCanvasClick"
      v-loading="loading"
    >
      <!-- Connections Layer (SVG) -->
      <svg class="connections-layer">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#409EFF" />
          </marker>
        </defs>
        
        <!-- Existing Edges -->
        <g v-for="edge in edges" :key="edge.id" class="edge-group">
          <!-- The invisible wider path for easier clicking -->
          <path 
            :d="getEdgePath(edge)" 
            stroke="transparent" 
            stroke-width="15" 
            fill="none" 
            class="edge-hit-area"
            @click.stop="editEdgeLabel(edge)"
          />
          <!-- The visible path -->
          <path 
            :d="getEdgePath(edge)" 
            stroke="#409EFF" 
            stroke-width="2" 
            fill="none" 
            marker-end="url(#arrowhead)"
            class="edge-path"
          />
          <!-- Label -->
          <foreignObject 
            v-if="edge.label"
            :x="getEdgeCenter(edge).x - 80" 
            :y="getEdgeCenter(edge).y - 16" 
            width="160" 
            height="32"
          >
            <div 
              class="edge-label-container" 
              @click.stop="editEdgeLabel(edge)"
              :title="edge.label"
            >
              <span class="edge-label">{{ edge.label }}</span>
            </div>
          </foreignObject>
          
          <!-- Delete button (visible on hover or select? maybe just click line to edit/delete) -->
        </g>

        <!-- Temp Line (Creating) -->
        <path 
          v-if="connectingState.active"
          :d="getTempPath()"
          stroke="#409EFF"
          stroke-width="2"
          stroke-dasharray="5,5"
          fill="none"
          marker-end="url(#arrowhead)"
        />
      </svg>

      <!-- Nodes Layer -->
      <div 
        v-for="node in nodes" 
        :key="node.id"
        class="node-card"
        :class="{ 'is-source': connectingState.sourceNodeId === node.id }"
        :style="{ left: node.x + 'px', top: node.y + 'px' }"
        @mousedown.stop="startDrag($event, node)"
      >
        <div class="node-header">
          <el-icon><Location /></el-icon>
          <span class="node-title" :title="node.data.name">{{ node.data.name }}</span>
        </div>
        <div class="node-body">
          <div class="coord-row">
            <span class="label">Lat:</span>
            <span class="value">{{ node.data.lat.toFixed(6) }}</span>
          </div>
          <div class="coord-row">
            <span class="label">Lng:</span>
            <span class="value">{{ node.data.lng.toFixed(6) }}</span>
          </div>
        </div>
        
        <!-- Output Handle (Source) -->
        <div 
          class="handle source-handle" 
          @mousedown.stop.prevent="startConnect($event, node)"
          title="拖拽连线"
        ></div>
      </div>
    </div>

    <!-- Label Edit Dialog -->
    <el-dialog v-model="editDialog.visible" title="编辑连线备注" width="300px">
      <el-input v-model="editDialog.tempLabel" placeholder="请输入连线备注（如：步行5分钟）" />
      <template #footer>
        <span class="dialog-footer">
          <el-button type="danger" @click="deleteEdge">删除连线</el-button>
          <el-button @click="editDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="saveEdgeLabel">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch, computed, onBeforeUnmount } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Location, InfoFilled } from '@element-plus/icons-vue'
import { fetchGuideRouteDetail, saveGuideRouteWorkflow } from '@/api'

const router = useRouter()
const route = useRoute()
const canvasRef = ref(null)

const nodes = ref([])
const edges = ref([])

const loading = ref(false)
const originalState = ref('')

const serializeState = () => JSON.stringify({
  nodes: nodes.value,
  edges: edges.value
})

const markSaved = () => {
  originalState.value = serializeState()
}

const hasUnsavedChanges = computed(() => {
  if (!originalState.value) return false
  return serializeState() !== originalState.value
})

// 监听数据变化，自动保存到缓存
watch([nodes, edges], () => {
  const state = {
    nodes: nodes.value,
    edges: edges.value
  }
  sessionStorage.setItem('guideMapWorkflowState', JSON.stringify(state))
}, { deep: true })

// State
const draggingState = reactive({
  isDragging: false,
  nodeId: null,
  startX: 0,
  startY: 0,
  initialNodeX: 0,
  initialNodeY: 0
})

const connectingState = reactive({
  active: false,
  sourceNodeId: null,
  mouseX: 0,
  mouseY: 0,
  startX: 0,
  startY: 0
})

const editDialog = reactive({
  visible: false,
  edgeId: null,
  tempLabel: ''
})

onMounted(() => {
  loadData()
})

const loadData = async () => {
  const routeId = route.query.routeId
  if (routeId) {
    await loadDataFromBackend(routeId)
    markSaved()
    return
  }
  try {
    // 1. 获取最新的标记数据（作为存在性依据）
    const rawData = sessionStorage.getItem('guideMapData')
    const markers = rawData ? JSON.parse(rawData) : []

    // 2. 获取缓存的工作流状态（作为布局和连线依据）
    const savedWorkflow = sessionStorage.getItem('guideMapWorkflowState')
    let cachedState = null
    if (savedWorkflow) {
      cachedState = JSON.parse(savedWorkflow)
    }

    if (markers.length === 0 && !cachedState) {
      ElMessage.warning('没有找到标记数据，请重新从地图页面进入')
      setTimeout(() => router.back(), 2000)
      return
    }

    // 3. 智能合并策略
    // 目标：保留缓存中的位置和连线，同时同步地图页面的最新标记（新增/删除）
    
    // 如果没有缓存，直接全量初始化
    if (!cachedState || !cachedState.nodes || cachedState.nodes.length === 0) {
      initNodesFromMarkers(markers)
      markSaved()
      return
    }

    const mergedNodes = []
    const validNodeIds = new Set()
    
    // 布局参数
    const cols = 4
    const xGap = 280
    const yGap = 180
    const startX = 50
    const startY = 50

    markers.forEach((marker, index) => {
      // 尝试在缓存中找到对应节点 (假设 marker.id 是稳定的，如果 AdminGuideMap 生成的 id 不稳定，可能需要用 lat/lng 匹配)
      // AdminGuideMap 中 id = `marker-${Date.now()}`，如果是重新加载页面，id 会变吗？
      // 如果 AdminGuideMap 从 sessionStorage 加载，id 应该是不变的。
      const cachedNode = cachedState.nodes.find(n => n.data.id === marker.id)

      if (cachedNode) {
        // 找到缓存：保留位置，更新数据（防止名称等变动）
        mergedNodes.push({
          ...cachedNode,
          data: { ...marker } // 更新最新数据
        })
      } else {
        // 新增标记：追加到末尾或网格空位
        // 简单起见，计算一个基于当前总数的位置
        const newIndex = cachedState.nodes.length + index // 粗略计算，防止重叠太严重
        mergedNodes.push({
          id: marker.id, // 确保 ID 一致
          x: startX + (newIndex % cols) * xGap,
          y: startY + Math.floor(newIndex / cols) * yGap,
          data: { ...marker }
        })
      }
      validNodeIds.add(marker.id)
    })

    // 4. 过滤连线：只保留两端都存在的连线
    const mergedEdges = (cachedState.edges || []).filter(edge => 
      validNodeIds.has(edge.source) && validNodeIds.has(edge.target)
    )

    nodes.value = mergedNodes
    edges.value = mergedEdges
    
    if (mergedNodes.length > 0) {
      // ElMessage.success('已自动恢复布局和连线')
    }
    markSaved()

  } catch (e) {
    console.error('Failed to load data', e)
    ElMessage.error('数据加载失败')
  }
}

const loadDataFromBackend = async (routeId) => {
  try {
    loading.value = true
    const detail = await fetchGuideRouteDetail(routeId)
    if (!detail || !Array.isArray(detail.points) || detail.points.length === 0) {
      ElMessage.warning('未找到该路线的节点数据')
      return
    }
    const points = detail.points
    const cols = Math.min(points.length || 1, 4)
    const xGap = 280
    const yGap = 180
    const startX = 50
    const startY = 50
    nodes.value = points.map((p, index) => {
      const hasLayoutX = typeof p.canvasX === 'number' && !Number.isNaN(p.canvasX)
      const hasLayoutY = typeof p.canvasY === 'number' && !Number.isNaN(p.canvasY)
      const fallbackX = startX + (index % cols) * xGap
      const fallbackY = startY + Math.floor(index / cols) * yGap
      return {
        id: p.id,
        x: hasLayoutX ? p.canvasX : fallbackX,
        y: hasLayoutY ? p.canvasY : fallbackY,
        data: {
          id: p.id,
          name: p.name,
          lat: Number(p.latitude),
          lng: Number(p.longitude)
        }
      }
    })
    const nodeIdSet = new Set(nodes.value.map(n => n.id))
    edges.value = (detail.edges || [])
      .filter(e => nodeIdSet.has(e.sourcePointId) && nodeIdSet.has(e.targetPointId))
      .map(e => ({
        id: e.id,
        source: e.sourcePointId,
        target: e.targetPointId,
        label: e.label || ''
      }))
  } catch (e) {
    console.error(e)
    ElMessage.error(e.message || '加载路线详情失败')
  } finally {
    loading.value = false
  }
}

const initNodesFromMarkers = (markers) => {
  const cols = 4
  const xGap = 280
  const yGap = 180
  const startX = 50
  const startY = 50

  nodes.value = markers.map((m, index) => ({
    id: m.id || `node-${index}-${Date.now()}`,
    x: startX + (index % cols) * xGap,
    y: startY + Math.floor(index / cols) * yGap,
    data: { ...m }
  }))
}

// 简单的辅助函数，实际场景可能不需要弹出询问，直接加载
// 这里我们为了逻辑严谨：如果是显式点击“加载草稿”，则直接加载
// 如果是普通进入，且发现有草稿，也可以直接加载，或者询问
const confirmLoadDraft = (saved) => {
  // 简化逻辑：只要有草稿，默认就加载草稿，因为那是最新状态
  // 如果想区分“从地图重新进入”和“恢复草稿”，可能需要更多标志位
  return true
}

const tempSaveWorkflow = () => {
  try {
    const state = {
      nodes: nodes.value,
      edges: edges.value
    }
    sessionStorage.setItem('guideMapWorkflowState', JSON.stringify(state))
    ElMessage.success('工作流已暂存')
    markSaved()
  } catch (e) {
    ElMessage.error('暂存失败')
  }
}

const goBack = () => {
  router.back()
}

const beforeUnloadHandler = (e) => {
  if (!hasUnsavedChanges.value) return
  e.preventDefault()
  e.returnValue = ''
}

onMounted(() => {
  window.addEventListener('beforeunload', beforeUnloadHandler)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnloadHandler)
})

onBeforeRouteLeave((to, from, next) => {
  if (!hasUnsavedChanges.value) {
    next()
    return
  }
  ElMessageBox.confirm('当前有未保存的修改，确认要离开当前页面吗？', '提示', {
    type: 'warning'
  }).then(() => {
    next()
  }).catch(() => {
    next(false)
  })
})

// --- Dragging Logic ---
const startDrag = (e, node) => {
  // Only left click
  if (e.button !== 0) return
  
  draggingState.isDragging = true
  draggingState.nodeId = node.id
  draggingState.startX = e.clientX
  draggingState.startY = e.clientY
  draggingState.initialNodeX = node.x
  draggingState.initialNodeY = node.y
}

// --- Connecting Logic ---
const startConnect = (e, node) => {
  // Prevent drag
  e.stopPropagation()
  
  connectingState.active = true
  connectingState.sourceNodeId = node.id
  
  // Calculate center of handle
  const handleRect = e.target.getBoundingClientRect()
  const canvasRect = canvasRef.value.getBoundingClientRect()
  
  // Start from the handle center relative to canvas
  connectingState.startX = node.x + 220 // card width 220
  connectingState.startY = node.y + 60  // approx mid height
  
  connectingState.mouseX = e.clientX - canvasRect.left
  connectingState.mouseY = e.clientY - canvasRect.top
}

// --- Global Mouse Move ---
const onMouseMove = (e) => {
  const canvasRect = canvasRef.value.getBoundingClientRect()
  const mouseX = e.clientX - canvasRect.left
  const mouseY = e.clientY - canvasRect.top

  // Handle Dragging
  if (draggingState.isDragging) {
    const dx = e.clientX - draggingState.startX
    const dy = e.clientY - draggingState.startY
    
    const node = nodes.value.find(n => n.id === draggingState.nodeId)
    if (node) {
      node.x = draggingState.initialNodeX + dx
      node.y = draggingState.initialNodeY + dy
    }
  }

  // Handle Connecting
  if (connectingState.active) {
    connectingState.mouseX = mouseX
    connectingState.mouseY = mouseY
  }
}

// --- Global Mouse Up ---
const onMouseUp = (e) => {
  if (draggingState.isDragging) {
    draggingState.isDragging = false
    draggingState.nodeId = null
  }

  if (connectingState.active) {
    // Check if dropped on a node
    // We can check if the mouse is over a node element
    // Or iterate nodes to check intersection (simpler here since we have coords)
    const canvasRect = canvasRef.value.getBoundingClientRect()
    const mouseX = e.clientX - canvasRect.left
    const mouseY = e.clientY - canvasRect.top
    
    // Simple collision detection with nodes
    // Node size: width 220, height ~120
    const targetNode = nodes.value.find(n => {
      return mouseX >= n.x && mouseX <= n.x + 220 &&
             mouseY >= n.y && mouseY <= n.y + 120 &&
             n.id !== connectingState.sourceNodeId // Cannot connect to self
    })

    if (targetNode) {
      createEdge(connectingState.sourceNodeId, targetNode.id)
    }

    connectingState.active = false
    connectingState.sourceNodeId = null
  }
}

const onCanvasClick = () => {
  // Clear selection if any (future feature)
}

// --- Edge Management ---
const createEdge = (sourceId, targetId) => {
  // Check duplicate
  const exists = edges.value.some(e => e.source === sourceId && e.target === targetId)
  if (exists) {
    ElMessage.warning('已存在连线')
    return
  }

  edges.value.push({
    id: `edge-${Date.now()}`,
    source: sourceId,
    target: targetId,
    label: ''
  })
}

const getEdgePath = (edge) => {
  const sourceNode = nodes.value.find(n => n.id === edge.source)
  const targetNode = nodes.value.find(n => n.id === edge.target)
  if (!sourceNode || !targetNode) return ''

  // Simple Bezier or Straight line
  // Let's do a cubic bezier for smooth workflow look
  
  // Source Point: Right side of source card
  const sx = sourceNode.x + 220
  const sy = sourceNode.y + 60
  
  // Target Point: Left side of target card
  const tx = targetNode.x
  const ty = targetNode.y + 60

  const dx = Math.abs(tx - sx)
  // Control points
  const c1x = sx + dx * 0.5
  const c1y = sy
  const c2x = tx - dx * 0.5
  const c2y = ty

  return `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tx} ${ty}`
}

const getTempPath = () => {
  const sourceNode = nodes.value.find(n => n.id === connectingState.sourceNodeId)
  if (!sourceNode) return ''
  
  const sx = sourceNode.x + 220
  const sy = sourceNode.y + 60
  const tx = connectingState.mouseX
  const ty = connectingState.mouseY

  const dx = Math.abs(tx - sx)
  const c1x = sx + dx * 0.5
  const c1y = sy
  const c2x = tx - dx * 0.5
  const c2y = ty
  
  return `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tx} ${ty}`
}

const getEdgeCenter = (edge) => {
  // Approximate center for label
  const sourceNode = nodes.value.find(n => n.id === edge.source)
  const targetNode = nodes.value.find(n => n.id === edge.target)
  if (!sourceNode || !targetNode) return { x: 0, y: 0 }
  
  return {
    x: (sourceNode.x + 220 + targetNode.x) / 2,
    y: (sourceNode.y + 60 + targetNode.y + 60) / 2
  }
}

const editEdgeLabel = (edge) => {
  editDialog.edgeId = edge.id
  editDialog.tempLabel = edge.label
  editDialog.visible = true
}

const saveEdgeLabel = () => {
  const edge = edges.value.find(e => e.id === editDialog.edgeId)
  if (edge) {
    edge.label = editDialog.tempLabel
  }
  editDialog.visible = false
}

const deleteEdge = () => {
  edges.value = edges.value.filter(e => e.id !== editDialog.edgeId)
  editDialog.visible = false
}

const clearConnections = () => {
  ElMessageBox.confirm('确定要清空所有连线吗？', '提示', {
    type: 'warning'
  }).then(() => {
    edges.value = []
  })
}

const saveWorkflow = async () => {
  const routeId = route.query.routeId
  if (!routeId) {
    ElMessage.warning('当前路线未关联后端ID，暂不支持保存到数据库')
    return
  }
  const payload = {
    points: nodes.value.map(node => ({
      id: node.data.id,
      canvasX: Math.round(node.x),
      canvasY: Math.round(node.y)
    })),
    edges: edges.value.map(edge => ({
      sourcePointId: edge.source,
      targetPointId: edge.target,
      label: edge.label || ''
    }))
  }
  try {
    await saveGuideRouteWorkflow(routeId, payload)
    ElMessage.success('工作流保存成功')
    markSaved()
  } catch (e) {
    ElMessage.error(e.message || '保存工作流失败')
  }
}

</script>

<style scoped>
.workflow-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  /* Reset element-plus main padding if needed, assuming global reset */
  margin: -20px; 
}

.toolbar {
  height: 60px;
  background: white;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.title {
  font-size: 18px;
  font-weight: bold;
  margin-left: 15px;
  color: #303133;
}

.tips-bar {
  background: #e6f7ff;
  color: #409EFF;
  padding: 8px 20px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #bae7ff;
}

.dot-icon {
  color: #409EFF;
  font-size: 16px;
  vertical-align: middle;
}

.canvas {
  flex: 1;
  position: relative;
  overflow: auto; /* Allow scrolling if canvas is huge */
  background-image: radial-gradient(#dfe4ea 1px, transparent 1px);
  background-size: 20px 20px;
  user-select: none;
}

.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%; /* Or dynamically resize based on content */
  height: 100%;
  min-width: 2000px; /* Ensure enough space */
  min-height: 2000px;
  pointer-events: none; /* Let clicks pass through to background/nodes, but enable for paths */
  z-index: 1;
}

.edge-path {
  pointer-events: visibleStroke;
  cursor: pointer;
  transition: stroke-width 0.2s;
}

.edge-hit-area {
  pointer-events: visibleStroke;
  cursor: pointer;
}

.edge-path:hover {
  stroke-width: 3;
}

.edge-label-container {
  background: white;
  border: 1px solid #409EFF;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  color: #409EFF;
  text-align: center;
  cursor: pointer;
  pointer-events: auto; /* Enable clicking on label */
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.node-card {
  position: absolute;
  width: 220px;
  height: 120px;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  z-index: 2;
  cursor: move;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s, border-color 0.2s;
}

.node-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  border-color: #c0c4cc;
}

.node-card.is-source {
  border-color: #409EFF;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.node-header {
  padding: 10px 15px;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  font-weight: bold;
  font-size: 14px;
  color: #303133;
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.node-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-body {
  padding: 10px 15px;
  font-size: 12px;
  color: #606266;
  flex: 1;
}

.coord-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.handle {
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  background: #fff;
  border: 2px solid #409EFF;
  border-radius: 50%;
  cursor: crosshair;
  transition: all 0.2s;
  z-index: 3;
}

.handle:hover {
  background: #409EFF;
  transform: translateY(-50%) scale(1.2);
}

</style>
