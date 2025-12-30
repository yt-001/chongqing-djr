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
            :x="getEdgeCenter(edge).x - 60" 
            :y="getEdgeCenter(edge).y - 15" 
            width="120" 
            height="30"
            style="pointer-events: none;"
          >
            <div class="edge-label-container">
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
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Location, InfoFilled } from '@element-plus/icons-vue'

const router = useRouter()
const canvasRef = ref(null)

// Data
const nodes = ref([])
const edges = ref([])

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

const loadData = () => {
  try {
    // 1. 尝试加载暂存的工作流状态 (包含节点位置和连线)
    const savedWorkflow = sessionStorage.getItem('guideMapWorkflowState')
    if (savedWorkflow) {
      const state = JSON.parse(savedWorkflow)
      nodes.value = state.nodes || []
      edges.value = state.edges || []
      
      // 验证数据同步：检查 markers 数据是否有新增/删除，这里简单处理，如果markers变了，可能需要重新合并
      // 目前假设用户只是想恢复上次编辑的状态
      if (nodes.value.length > 0) {
        ElMessage.success('已恢复暂存的工作流状态')
        return
      }
    }

    // 2. 如果没有暂存状态，则从 markers 原始数据初始化
    const rawData = sessionStorage.getItem('guideMapData')
    if (rawData) {
      const markers = JSON.parse(rawData)
      // Initial layout: Grid or Waterfall
      // Let's do a simple grid layout
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
    } else {
      ElMessage.warning('没有找到标记数据，请重新从地图页面进入')
      setTimeout(() => router.back(), 2000)
    }
  } catch (e) {
    console.error('Failed to load data', e)
    ElMessage.error('数据加载失败')
  }
}

const tempSaveWorkflow = () => {
  try {
    const state = {
      nodes: nodes.value,
      edges: edges.value
    }
    sessionStorage.setItem('guideMapWorkflowState', JSON.stringify(state))
    ElMessage.success('工作流已暂存')
  } catch (e) {
    ElMessage.error('暂存失败')
  }
}

const goBack = () => {
  router.back()
}

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

const saveWorkflow = () => {
  // Save logic here
  console.log('Nodes:', nodes.value)
  console.log('Edges:', edges.value)
  
  // Example: Convert back to markers structure or save workflow object
  // For now, just show success
  ElMessage.success('工作流保存成功！(数据已打印到控制台)')
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