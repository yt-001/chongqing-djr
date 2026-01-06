<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  fetchPopularAttractions,
  createAdminPopularAttraction,
  deleteAdminPopularAttractionById,
} from '@/api'
import { fetchPopularAttractionCandidatesPage } from '@/api'

const list = ref([])
const loading = ref(false)
// 顶部搜索框（输入ID或名称）

// 设计面板（后端分页列表）
const designVisible = ref(false)
const searchQuery = ref('')
const designLoading = ref(false)
const designPageNum = ref(1)
const designPageSize = ref(10)
const designTotal = ref(0)
const designList = ref([])

const minRefreshMs = 600
const pageGuardMs = 600
let listRefreshTimer = null
let designRefreshTimer = null
let designPageGuardTimer = null
let lastDesignPageTriggerTime = 0

function requestDesignPageLoad() {
  const now = Date.now()
  const elapsed = now - lastDesignPageTriggerTime
  if (!designLoading.value && elapsed >= pageGuardMs) {
    lastDesignPageTriggerTime = now
    loadDesignPage()
    return
  }
  if (designPageGuardTimer) clearTimeout(designPageGuardTimer)
  designPageGuardTimer = setTimeout(() => {
    lastDesignPageTriggerTime = Date.now()
    loadDesignPage()
  }, Math.max(pageGuardMs - elapsed, 0))
}

/**
 * 根据搜索词过滤本地景点数据（支持ID精确、名称模糊）
 */
async function loadDesignPage() {
  if (designRefreshTimer) {
    clearTimeout(designRefreshTimer)
    designRefreshTimer = null
  }
  designLoading.value = true
  const startedAt = Date.now()
  try {
    const q = (searchQuery.value || '').trim()
    const idNum = Number(q)
    const payload = {
      pageNum: designPageNum.value,
      pageSize: designPageSize.value,
      query: {
        id: !Number.isNaN(idNum) && q !== '' ? idNum : undefined,
        name: Number.isNaN(idNum) ? q : undefined,
      }
    }
    const res = await fetchPopularAttractionCandidatesPage(payload)
    const data = res && res.list ? res : (res?.data || res)
    designList.value = data.list || []
    designTotal.value = data.total || 0
  } catch (e) {
    designList.value = []
    designTotal.value = 0
  } finally {
    const elapsed = Date.now() - startedAt
    const remaining = minRefreshMs - elapsed
    designRefreshTimer = setTimeout(() => {
      designLoading.value = false
      designRefreshTimer = null
    }, remaining > 0 ? remaining : 0)
  }
}

function onDesignSearch() {
  designPageNum.value = 1
  loadDesignPage()
  designVisible.value = true // 搜索时打开下拉框
}

function onDesignPageChange(p) {
  designPageNum.value = p
  requestDesignPageLoad()
}

/**
 * 选择景点后回填到搜索框
 * @param {{id:number,name:string}} row
 */
function pickAttraction(row) {
  searchQuery.value = String(row.id)
  designVisible.value = false // 关闭下拉框
  ElMessage.success(`已选择：${row.name}（ID: ${row.id}），已回填到搜索框`)
}

/**
 * 加载热门景点完整列表
 */
async function loadList() {
  if (listRefreshTimer) {
    clearTimeout(listRefreshTimer)
    listRefreshTimer = null
  }
  loading.value = true
  const startedAt = Date.now()
  try {
    const res = await fetchPopularAttractions()
    list.value = Array.isArray(res) ? res : []
  } catch (e) {
    ElMessage.error(e.message || '加载热门景点失败')
  } finally {
    const elapsed = Date.now() - startedAt
    const remaining = minRefreshMs - elapsed
    listRefreshTimer = setTimeout(() => {
      loading.value = false
      listRefreshTimer = null
    }, remaining > 0 ? remaining : 0)
  }
}

/**
 * 根据搜索框内容添加热门景点
 */
async function onAddFromSearch() {
  const q = (searchQuery.value || '').trim()
  const idNum = Number(q)
  if (!q || Number.isNaN(idNum)) { ElMessage.warning('请在搜索框输入有效的景点ID'); return }
  try {
    await createAdminPopularAttraction({ attractionId: idNum })
    ElMessage.success('添加成功')
    loadList()
  } catch (e) {
    ElMessage.error(e.message || '添加失败')
  }
}

// 顶部仅保留搜索与查看列表，不再提供直接ID添加入口

/**
 * 删除热门景点（行删除）
 * @param {Object} row
 */
async function onRowDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除热门：${row.name} (ID: ${row.id})？`, '提示', { type: 'warning' })
    await deleteAdminPopularAttractionById(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.message || '删除失败')
  }
}

onMounted(() => loadList())
</script>

<template>
  <div class="admin-popular-page">
    <el-card class="block" shadow="never">
      <template #header>
        <div class="op-row">
          <el-popover
            v-model:visible="designVisible"
            placement="bottom-start"
            :width="300"
            trigger="click"
            @show="onDesignSearch"
          >
            <template #reference>
              <el-input v-model="searchQuery" placeholder="输入ID或名称搜索" style="width: 320px" @keydown.enter="onDesignSearch" />
            </template>
            
            <div class="popover-list">
              <div class="panel-title" style="display:flex;justify-content:space-between;align-items:center">
                <span>景点列表</span>
                <span style="font-size:12px;color:#999">共 {{ designTotal }} 条</span>
              </div>
              <el-table :data="designList" border style="width:100%" v-loading="designLoading" max-height="300" size="small">
                <el-table-column prop="id" label="ID" width="50" align="center" />
                <el-table-column prop="name" label="景点名称" show-overflow-tooltip />
                <el-table-column label="操作" width="50" align="center">
                  <template #default="scope">
                    <el-button size="small" type="primary" link @click="pickAttraction(scope.row)">选择</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <div class="pager" style="justify-content: center; margin-top: 8px;">
                <el-pagination
                  small
                  layout="prev, next"
                  :total="designTotal"
                  :page-size="designPageSize"
                  :current-page="designPageNum"
                  @current-change="onDesignPageChange"
                />
              </div>
            </div>
          </el-popover>

          <el-button @click="onDesignSearch" type="primary">搜索</el-button>
          <el-button @click="onAddFromSearch" type="success">添加热门景点</el-button>
        </div>
      </template>


      <el-table :data="list" border style="width:100%" v-loading="loading">
        <el-table-column prop="id" label="热门ID" width="90" />
        <el-table-column prop="attractionId" label="景点ID" width="100" />
        <el-table-column prop="name" label="名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="description" label="描述" min-width="220" show-overflow-tooltip />
        <el-table-column prop="latitude" label="纬度" width="120" />
        <el-table-column prop="longitude" label="经度" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column prop="updateTime" label="更新时间" width="180" />
        <el-table-column label="操作" fixed="right" width="140">
          <template #default="scope">
            <el-button size="small" type="danger" @click="onRowDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

  </div>
</template>

<style scoped>
.admin-popular-page { padding: 8px; }
.block { margin-bottom: 12px; }
.op-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.pager { display: flex; justify-content: flex-end; margin-top: 12px; }
.panel-title { font-size: 14px; color: #666; margin-bottom: 8px; }
</style>
