<template>
  <div class="admin-attractions">
    <!-- 顶部：搜索栏（独立一层，统一宽度） -->
    <el-card class="block" shadow="never">
      <div class="search-row">
        <el-input v-model="query.keyword" placeholder="关键词" clearable />
        <el-input v-model="query.name" placeholder="景点名称" clearable />
        <el-input v-model="query.location" placeholder="地理位置" clearable />
        <el-date-picker v-model="query.createTime" type="date" value-format="YYYY-MM-DD" placeholder="创建时间" />
        <el-date-picker v-model="query.updateTime" type="date" value-format="YYYY-MM-DD" placeholder="更新时间" />
        <el-button type="primary" @click="onSearch">搜索</el-button>
        <el-button @click="onReset">重置</el-button>
      </div>
    </el-card>

    <!-- 中部：操作按钮（新增 / 删除 / 批量删除） -->
    <el-card class="block" shadow="never">
      <div class="action-row">
        <el-button type="primary" @click="onAdd">添加景点</el-button>
        <el-button type="danger" :disabled="!singleDeletable" @click="onDelete(selectedRows[0])">删除</el-button>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="onBatchDelete">批量删除</el-button>
      </div>
    </el-card>

    <!-- 底部：表格 + 分页（铺满父容器，“操作列”固定在最右） -->
    <el-card class="block" shadow="never">
      <div class="table-wrap">
        <el-table
          :data="list"
          border
          style="width: 100%"
          :fit="false"
          v-loading="loading"
          @selection-change="onSelectionChange"
        >
          <el-table-column type="selection" width="48" fixed="left" />
          <el-table-column prop="id" label="编号" width="100" sortable="custom" />
          <el-table-column prop="name" label="景点名称" min-width="200" show-overflow-tooltip />
          <el-table-column prop="description" label="景点描述" min-width="260" show-overflow-tooltip />
          <el-table-column prop="location" label="地理位置" min-width="180" show-overflow-tooltip />
          <el-table-column prop="openHours" label="开放时间" width="140" />
          <el-table-column prop="ticketPrice" label="门票价格" width="120" />
          <el-table-column prop="contactPhone" label="联系电话" width="150" />
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column prop="updateTime" label="更新时间" width="180" />
          <el-table-column label="操作" fixed="right" width="180">
            <template #default="scope">
              <el-button size="small" @click="onView(scope.row)">查看</el-button>
              <el-button size="small" type="danger" @click="onDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pager">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :current-page="page.current"
          :page-size="page.size"
          :page-sizes="[10,20,50]"
          @size-change="onSizeChange"
          @current-change="onPageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
// 景点列表（管理端）：服务端分页与筛选
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchAdminAttractionsPage } from '@/api'

// 统一搜索条件（与接口请求体一致）
const query = reactive({ keyword: '', createTime: '', updateTime: '', name: '', location: '' })

// 分页与排序
const page = reactive({ current: 1, size: 10 })
const sort = reactive({ field: '', direction: 'DESC' })

// 列表数据
const loading = ref(false)
const list = ref([])
const total = ref(0)

// 选择集（用于删除/批删）
const selectedRows = ref([])
const onSelectionChange = (rows) => { selectedRows.value = rows }
const singleDeletable = computed(() => selectedRows.value.length === 1)

// 拉取列表（服务端分页）
async function loadData() {
  loading.value = true
  try {
    const payload = {
      pageNum: page.current,
      pageSize: page.size,
      sortField: sort.field,
      sortDirection: sort.direction,
      query: { ...query }
    }
    const data = await fetchAdminAttractionsPage(payload)
    // 兼容不同返回结构：优先 {list,total}
    list.value = data?.list || data?.records || []
    total.value = data?.total ?? data?.totalRecords ?? 0
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// 交互：搜索/重置/分页
function onSearch() {
  page.current = 1
  loadData()
}
function onReset() {
  query.keyword = ''
  query.createTime = ''
  query.updateTime = ''
  query.name = ''
  query.location = ''
  page.current = 1
  loadData()
}
function onSizeChange(sz) { page.size = sz; page.current = 1; loadData() }
function onPageChange(p) { page.current = p; loadData() }

// 排序：如需列触发，在 el-table 上监听 sort-change 事件，设置 sort.field/sort.direction 后调用 loadData()

// 占位：新增/查看/删除/批量删除（接口接入后替换）
function onAdd() { ElMessage.success('点击了添加景点（占位）') }
function onView(row) { ElMessage.info(`查看：#${row.id} ${row.name}`) }
async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除景点：${row.name}？`, '提示', { type: 'warning' })
    ElMessage.success('删除成功（占位）')
    loadData()
  } catch {}
}
async function onBatchDelete() {
  try {
    await ElMessageBox.confirm(`确认批量删除 ${selectedRows.value.length} 条记录？`, '提示', { type: 'warning' })
    ElMessage.success('批量删除成功（占位）')
    selectedRows.value = []
    loadData()
  } catch {}
}

// 首次加载
loadData()
</script>

<style scoped>
/* 统一搜索框尺寸，保持稳定 */
.search-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.search-row :deep(.el-input),
.search-row :deep(.el-select),
.search-row :deep(.el-date-editor) { width: 240px; }

.admin-attractions .block { margin-bottom: 16px; }
.action-row { display: flex; gap: 8px; }

/* 表格容器：铺满父容器，列宽不被单列牵连（fit=false），溢出时允许横向滚动 */
.table-wrap { width: 100%; overflow-x: auto; }

.pager { display: flex; justify-content: flex-end; margin-top: 12px; }
</style>
