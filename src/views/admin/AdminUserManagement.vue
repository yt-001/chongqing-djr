<template>
  <div class="admin-users">
    <!-- 搜索与筛选区 -->
    <el-card class="block">
      <div class="search-row">
        <el-input v-model="query.keyword" placeholder="搜索用户名/手机号/邮箱" clearable @clear="onSearch" />
        <el-select v-model="query.role" placeholder="角色" clearable style="width: 120px">
          <el-option label="普通用户" value="user" />
          <el-option label="管理员" value="admin" />
        </el-select>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </div>
    </el-card>

    <!-- 数据列表区 -->
    <el-card class="block">
      <!-- 表格 -->
      <div class="table-wrap">
        <el-table :data="list" border stripe v-loading="loading" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" align="center" />
          <el-table-column label="头像" width="80" align="center">
            <template #default="{ row }">
              <el-avatar :size="40" :src="row.avatarUrl || 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'" />
            </template>
          </el-table-column>
          <el-table-column prop="username" label="用户名" min-width="120" />
          <el-table-column prop="phone" label="手机号" width="120" />
          <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
          <el-table-column prop="role" label="角色" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.role === 'admin' ? 'danger' : 'info'">
                {{ row.role === 'admin' ? '管理员' : '用户' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="注册时间" width="170" />
          <el-table-column label="操作" width="180" fixed="right" align="center">
            <template #default="{ row }">
              <div class="action-row" style="justify-content: center;">
                <el-button link type="primary" @click="onEdit(row)">编辑</el-button>
                <el-button link type="danger" @click="onDelete(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pager">
        <el-pagination
          v-model:current-page="page.current"
          v-model:page-size="page.size"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="onSizeChange"
          @current-change="onPageChange"
        />
      </div>
    </el-card>

    <!-- 编辑/新增弹窗 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.mode === 'add' ? '新增用户' : '编辑用户'"
      width="500px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-radio-group v-model="form.role">
            <el-radio label="user">普通用户</el-radio>
            <el-radio label="admin">管理员</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="新密码" prop="password" v-if="dialog.mode === 'edit'">
           <el-input v-model="form.password" placeholder="不修改请留空" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="onSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchAdminUsersPage, updateAdminUser, deleteAdminUser, resetAdminUserPassword } from '@/api'

// 列表数据与状态
const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = reactive({ current: 1, size: 10 })
const query = reactive({ keyword: '', role: '' })

const minRefreshMs = 600
const pageGuardMs = 600
let refreshTimer = null
let pageGuardTimer = null
let lastPageTriggerTime = 0

function requestPageLoad() {
  const now = Date.now()
  const elapsed = now - lastPageTriggerTime
  if (!loading.value && elapsed >= pageGuardMs) {
    lastPageTriggerTime = now
    loadData()
    return
  }
  if (pageGuardTimer) clearTimeout(pageGuardTimer)
  pageGuardTimer = setTimeout(() => {
    lastPageTriggerTime = Date.now()
    loadData()
  }, Math.max(pageGuardMs - elapsed, 0))
}

// 弹窗与表单
const dialog = reactive({ visible: false, mode: 'edit' })
const submitting = ref(false)
const formRef = ref(null)
const form = reactive({
  id: '',
  username: '',
  phone: '',
  email: '',
  role: 'user',
  password: '' // 仅用于重置密码
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }]
}

// 加载列表
async function loadData() {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
  loading.value = true
  const startedAt = Date.now()
  try {
    const payload = {
      pageNum: page.current,
      pageSize: page.size,
      query: { ...query }
    }
    // 如果是后端对接，这里调用 fetchAdminUsersPage(payload)
    // 这里做模拟数据演示，除非后端已就绪
    const res = await fetchAdminUsersPage(payload).catch(mockFetch)
    list.value = res.list || []
    total.value = res.total || 0
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    const elapsed = Date.now() - startedAt
    const remaining = minRefreshMs - elapsed
    refreshTimer = setTimeout(() => {
      loading.value = false
      refreshTimer = null
    }, remaining > 0 ? remaining : 0)
  }
}

// 模拟后端数据（如果没有真实接口）
async function mockFetch() {
  // 延迟模拟
  await new Promise(r => setTimeout(r, 500))
  return {
    list: Array.from({ length: page.size }, (_, i) => ({
      id: (page.current - 1) * page.size + i + 1,
      username: `User_${(page.current - 1) * page.size + i + 1}`,
      phone: `1380013800${i}`,
      email: `user${i}@example.com`,
      role: i === 0 ? 'admin' : 'user',
      avatarUrl: '',
      createTime: '2025-01-01 12:00:00'
    })),
    total: 100
  }
}

function onSearch() { page.current = 1; loadData() }
function onReset() { query.keyword=''; query.role=''; page.current=1; loadData() }
function onSizeChange(sz) { page.size = sz; page.current = 1; requestPageLoad() }
function onPageChange(p) { page.current = p; requestPageLoad() }

// 编辑
function onEdit(row) {
  dialog.mode = 'edit'
  form.id = row.id
  form.username = row.username
  form.phone = row.phone
  form.email = row.email
  form.role = row.role || 'user'
  form.password = ''
  dialog.visible = true
}

// 提交
async function onSubmit() {
  if (!formRef.value) return
  await formRef.value.validate()
  
  submitting.value = true
  try {
    // 1. 更新基本信息
    const payload = {
      id: form.id,
      username: form.username,
      phone: form.phone,
      email: form.email,
      role: form.role
    }
    await updateAdminUser(payload) // 真实接口
    
    // 2. 如果填了密码，调用重置密码接口
    if (form.password) {
      await resetAdminUserPassword(form.id, form.password)
    }
    
    ElMessage.success('保存成功')
    dialog.visible = false
    loadData()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

// 删除
async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除用户：${row.username}？`, '警告', { type: 'warning' })
    await deleteAdminUser(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

onMounted(loadData)
</script>

<style scoped>
.search-row { display: flex; gap: 8px; flex-wrap: wrap; }
.search-row :deep(.el-input), .search-row :deep(.el-select) { width: 200px; }
.block { margin-bottom: 16px; }
.table-wrap { width: 100%; overflow-x: auto; }
.pager { display: flex; justify-content: flex-end; margin-top: 12px; }
</style>
