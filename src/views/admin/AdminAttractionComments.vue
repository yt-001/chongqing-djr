<template>
  <div class="admin-comments">
    <el-card class="block" shadow="never">
      <div class="toolbar">
        <div class="toolbar-right">
          <el-button type="danger" :disabled="!singleDeletable" @click="onDelete(selectedRows[0])">删除</el-button>
          <el-button type="danger" :disabled="selectedRows.length === 0" @click="onBatchDelete">批量删除</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="block" shadow="never">
      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" placeholder="评论内容" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input v-model="query.userId" placeholder="用户ID" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="景点ID">
          <el-input v-model="query.targetId" placeholder="景点ID" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="评分">
          <el-select v-model="query.rating" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="n in 5" :key="n" :label="`${n}星`" :value="n" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.isApproved" placeholder="全部" clearable style="width: 120px">
            <el-option label="已通过" :value="1" />
            <el-option label="待审核" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="query.createRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="-"
            start-placeholder="开始"
            end-placeholder="结束"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">搜索</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="block" shadow="never">
      <div class="table-wrap">
        <el-table :data="list" border style="width: 100%" v-loading="loading" @selection-change="onSelectionChange" @sort-change="onSortChange">
          <el-table-column type="selection" width="48" fixed="left" />
          <el-table-column prop="id" label="编号" width="110" sortable="custom" />
          <el-table-column prop="userId" label="用户ID" width="120" />
          <el-table-column prop="attractionId" label="景点ID" width="120" />
          <el-table-column prop="content" label="评论内容" min-width="260" show-overflow-tooltip />
          <el-table-column prop="rating" label="评分" width="100" sortable="custom" />
          <el-table-column prop="isApproved" label="状态" width="120">
            <template #default="{ row }">
              <el-tag v-if="row.isApproved === 1" type="success">已通过</el-tag>
              <el-tag v-else type="warning">待审核</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" sortable="custom" />
          <el-table-column prop="updateTime" label="更新时间" width="180" sortable="custom" />
          <el-table-column label="操作" fixed="right" width="220">
            <template #default="scope">
              <el-button size="small" type="success" :disabled="scope.row.isApproved === 1" @click="onApprove(scope.row, 1)">通过</el-button>
              <el-button size="small" :disabled="scope.row.isApproved === 0" @click="onApprove(scope.row, 0)">取消</el-button>
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
          :page-sizes="[10, 20, 50]"
          @size-change="onSizeChange"
          @current-change="onPageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchAdminAttractionCommentsPage, updateAdminComment, deleteAdminComment } from '@/api'

const loading = ref(false)
const list = ref([])
const total = ref(0)

const query = reactive({
  keyword: '',
  userId: '',
  targetId: '',
  rating: undefined,
  isApproved: undefined,
  createRange: [],
})

const page = reactive({ current: 1, size: 10 })
const sortField = ref('')
const sortDirection = ref('DESC')

const selectedRows = ref([])
const onSelectionChange = (rows) => { selectedRows.value = rows }
const singleDeletable = computed(() => selectedRows.value.length === 1)

function getCreateTimeRange() {
  const range = Array.isArray(query.createRange) ? query.createRange : []
  const start = range?.[0]
  const end = range?.[1]
  return {
    createTimeStart: start || '',
    createTimeEnd: end || '',
  }
}

function buildPagePayload() {
  const { createTimeStart, createTimeEnd } = getCreateTimeRange()
  const q = {
    keyword: query.keyword || '',
    createTimeStart,
    createTimeEnd,
  }
  if (query.userId) q.userId = Number(query.userId)
  if (query.targetId) q.attractionId = Number(query.targetId)
  if (query.rating !== undefined) q.rating = query.rating
  if (query.isApproved !== undefined) q.isApproved = query.isApproved
  return {
    pageNum: page.current,
    pageSize: page.size,
    sortField: sortField.value || '',
    sortDirection: sortDirection.value || 'DESC',
    query: q,
  }
}

function onSortChange({ prop, order }) {
  if (!order) {
    sortField.value = ''
    sortDirection.value = 'DESC'
  } else {
    sortField.value = prop || ''
    sortDirection.value = order === 'ascending' ? 'ASC' : 'DESC'
  }
  page.current = 1
  loadData()
}

async function loadData() {
  loading.value = true
  try {
    const data = await fetchAdminAttractionCommentsPage(buildPagePayload())
    list.value = data?.list || []
    total.value = data?.total ?? 0
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function onSearch() {
  page.current = 1
  loadData()
}

function onReset() {
  query.keyword = ''
  query.userId = ''
  query.targetId = ''
  query.rating = undefined
  query.isApproved = undefined
  query.createRange = []
  page.current = 1
  loadData()
}

function onSizeChange(sz) {
  page.size = sz
  page.current = 1
  loadData()
}

function onPageChange(p) {
  page.current = p
  loadData()
}

async function onApprove(row, value) {
  try {
    await updateAdminComment({ id: row.id, isApproved: value })
    row.isApproved = value
    ElMessage.success(value === 1 ? '已通过' : '已取消')
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm('确认删除该评论？', '提示', { type: 'warning' })
    await deleteAdminComment(row.id)
    ElMessage.success('删除成功')
    selectedRows.value = selectedRows.value.filter(r => r.id !== row.id)
    if (page.current > 1 && list.value.length === 1) page.current -= 1
    loadData()
  } catch (_) {}
}

async function onBatchDelete() {
  const ids = new Set(selectedRows.value.map(r => r.id))
  if (ids.size === 0) return
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${ids.size} 条记录？`, '提示', { type: 'warning' })
    for (const id of ids) {
      await deleteAdminComment(id)
    }
    ElMessage.success('批量删除成功')
    selectedRows.value = []
    if (page.current > 1 && list.value.length === ids.size) page.current -= 1
    loadData()
  } catch (_) {}
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.admin-comments {
  padding: 16px;
}
.block {
  margin-bottom: 12px;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.search-form .el-form-item {
  margin-right: 16px;
  margin-bottom: 12px;
}
.table-wrap {
  width: 100%;
  overflow: auto;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
