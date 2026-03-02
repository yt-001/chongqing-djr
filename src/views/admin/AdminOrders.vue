<template>
  <div class="admin-orders-page">
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span class="title">订单管理</span>
          <div class="header-actions">
            <el-button type="primary" :icon="Refresh" circle @click="fetchData" />
          </div>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-form :inline="true" :model="query" class="search-form">
          <el-form-item label="订单编号">
            <el-input v-model="query.orderNo" placeholder="请输入订单号" clearable @keyup.enter="handleSearch" />
          </el-form-item>
          <el-form-item label="产品类型">
            <el-select v-model="query.productType" placeholder="请选择" clearable style="width: 140px">
              <el-option label="景点门票" :value="1" />
              <el-option label="美食券" :value="2" />
              <el-option label="住宿券" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="订单状态">
            <el-select v-model="selectedStatus" placeholder="请选择" clearable style="width: 140px">
              <el-option label="待支付" :value="0" />
              <el-option label="已支付" :value="1" />
              <el-option label="已使用" :value="2" />
              <el-option label="已取消" :value="3" />
              <el-option label="已退款" :value="4" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button :icon="Delete" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 数据表格 -->
      <el-table 
        v-loading="loading" 
        :data="tableData" 
        style="width: 100%" 
        border
        @sort-change="handleSortChange"
      >
        <el-table-column prop="orderNo" label="订单编号" min-width="180" fixed="left" sortable="custom" />
        <el-table-column prop="username" label="下单用户" width="120" />
        <el-table-column prop="productName" label="产品名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="productType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getProductTypeTag(row.productType)">
              {{ getProductTypeName(row.productType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="总金额" width="120" sortable="custom">
          <template #default="{ row }">
            <span class="amount">¥{{ row.totalAmount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="下单时间" width="180" sortable="custom" />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">详情</el-button>
            <el-dropdown @command="(cmd) => handleStatusUpdate(row, cmd)" class="status-dropdown">
              <el-button link type="warning">修改状态</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="0" :disabled="row.status === 0">待支付</el-dropdown-item>
                  <el-dropdown-item :command="1" :disabled="row.status === 1">已支付</el-dropdown-item>
                  <el-dropdown-item :command="2" :disabled="row.status === 2">已使用</el-dropdown-item>
                  <el-dropdown-item :command="3" :disabled="row.status === 3">已取消</el-dropdown-item>
                  <el-dropdown-item :command="4" :disabled="row.status === 4">已退款</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 订单详情对话框 -->
    <el-dialog v-model="detailVisible" title="订单详情" width="600px" destroy-on-close>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单编号" :span="2">{{ currentOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="下单用户">{{ currentOrder.username }}</el-descriptions-item>
        <el-descriptions-item label="用户ID">{{ currentOrder.userId }}</el-descriptions-item>
        <el-descriptions-item label="产品名称" :span="2">{{ currentOrder.productName }}</el-descriptions-item>
        <el-descriptions-item label="单价">¥{{ currentOrder.unitPrice?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="数量">x{{ currentOrder.quantity }}</el-descriptions-item>
        <el-descriptions-item label="总金额" :span="2">
          <span class="amount big">¥{{ currentOrder.totalAmount?.toFixed(2) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ currentOrder.description || '无' }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ currentOrder.paymentTime || '未支付' }}</el-descriptions-item>
        <el-descriptions-item label="过期时间">{{ currentOrder.expireTime || '无' }}</el-descriptions-item>
        <el-descriptions-item label="使用时间" :span="2">{{ currentOrder.usedTime || '未使用' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentOrder.createTime }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ currentOrder.updateTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { Search, Delete, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchAdminOrdersPage, updateOrder, deleteOrder } from '@/api/modules/admin/orders.js'

// --- 数据定义 ---
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const query = reactive({
  orderNo: '',
  productType: null,
  statusList: []
})
const selectedStatus = ref(null)

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortDirection: 'DESC'
})

const detailVisible = ref(false)
const currentOrder = ref({})

// --- 方法 ---
const fetchData = async () => {
  loading.value = true
  try {
    // 处理状态过滤
    query.statusList = selectedStatus.value !== null ? [selectedStatus.value] : []
    
    const res = await fetchAdminOrdersPage({
      ...pagination,
      query
    })
    tableData.value = res.list
    total.value = res.total
  } catch (error) {
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  fetchData()
}

const handleReset = () => {
  query.orderNo = ''
  query.productType = null
  selectedStatus.value = null
  handleSearch()
}

const handleSortChange = ({ prop, order }) => {
  pagination.sortField = prop
  pagination.sortDirection = order === 'ascending' ? 'ASC' : 'DESC'
  fetchData()
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  fetchData()
}

const handleCurrentChange = (val) => {
  pagination.pageNum = val
  fetchData()
}

const handleView = (row) => {
  currentOrder.value = { ...row }
  detailVisible.value = true
}

const handleStatusUpdate = (row, newStatus) => {
  ElMessageBox.confirm(
    `确定将订单 ${row.orderNo} 的状态修改为 [${getStatusName(newStatus)}] 吗？`,
    '状态修改',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      await updateOrder({
        id: row.id,
        status: newStatus
      })
      ElMessage.success('状态更新成功')
      fetchData()
    } catch (error) {
      ElMessage.error('状态更新失败')
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定删除订单 ${row.orderNo} 吗？删除后不可恢复。`,
    '危险操作',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'error' }
  ).then(async () => {
    try {
      await deleteOrder(row.id)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  })
}

// --- 辅助工具 ---
const getProductTypeName = (type) => {
  const map = { 1: '景点门票', 2: '美食券', 3: '住宿券' }
  return map[type] || '未知'
}

const getProductTypeTag = (type) => {
  const map = { 1: 'success', 2: 'warning', 3: 'primary' }
  return map[type] || 'info'
}

const getStatusName = (status) => {
  const map = { 0: '待支付', 1: '已支付', 2: '已使用', 3: '已取消', 4: '已退款' }
  return map[status] || '未知'
}

const getStatusTag = (status) => {
  const map = { 0: 'info', 1: 'primary', 2: 'success', 3: 'warning', 4: 'danger' }
  return map[status] || 'info'
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.admin-orders-page {
  padding: 20px;
}

.table-card {
  border-radius: 8px;
  border: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header .title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.search-bar {
  margin-bottom: 20px;
  background: #f8f9fb;
  padding: 18px 18px 0;
  border-radius: 8px;
}

.amount {
  color: #f56c6c;
  font-weight: bold;
}

.amount.big {
  font-size: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.status-dropdown {
  margin: 0 12px;
}

:deep(.el-table th.el-table__cell) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 600;
}
</style>
