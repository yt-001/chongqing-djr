<template>
  <div class="admin-restaurant-categories">
    <el-card class="block" shadow="never">
      <div class="toolbar">
        <el-radio-group v-model="activeTab" size="small">
          <el-radio-button label="restaurant">餐厅分类</el-radio-button>
          <el-radio-button label="dish">菜品分类</el-radio-button>
        </el-radio-group>

        <div class="toolbar-right">
          <el-button type="primary" @click="onAdd">新增分类</el-button>
          <el-button type="danger" :disabled="!singleDeletable" @click="onDelete(selectedRows[0])">删除</el-button>
          <el-button type="danger" :disabled="selectedRows.length === 0" @click="onBatchDelete">批量删除</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="block" shadow="never">
      <div class="search-row">
        <el-input v-model="query.keyword" placeholder="关键词" clearable />
        <el-input v-model="query.name" placeholder="分类名称" clearable />
        <el-select v-model="query.isEnabled" placeholder="是否启用" clearable style="width: 140px">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-date-picker v-model="query.createRange" type="daterange" value-format="YYYY-MM-DD" range-separator="-" start-placeholder="创建开始" end-placeholder="创建结束" />
        <el-button type="primary" @click="onSearch">搜索</el-button>
        <el-button @click="onReset">重置</el-button>
      </div>
    </el-card>

    <el-card class="block" shadow="never">
      <div class="table-wrap">
        <el-table :data="list" border style="width: 100%" :fit="false" v-loading="loading" @selection-change="onSelectionChange">
          <el-table-column type="selection" width="48" fixed="left" />
          <el-table-column prop="id" label="编号" width="120" sortable="custom" />
          <el-table-column prop="name" label="分类名称" min-width="240" show-overflow-tooltip />
          <el-table-column prop="sortOrder" label="排序" width="120" />
          <el-table-column prop="isEnabled" label="状态" width="120">
            <template #default="{ row }">
              <el-tag v-if="row.isEnabled === 1" type="success">启用</el-tag>
              <el-tag v-else type="info">禁用</el-tag>
            </template>
          </el-table-column>
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
          :page-sizes="[10, 20, 50]"
          @size-change="onSizeChange"
          @current-change="onPageChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialogTitle" width="640px" append-to-body @closed="onDialogClosed">
      <div class="dialog-body">
        <el-form ref="formRef" :model="form" :rules="rules" :disabled="dialog.mode === 'view'" label-width="96px" class="dialog-form">
          <div class="row row-2">
            <el-form-item label="分类名称" class="col col-2" prop="name" required>
              <el-input v-model="form.name" placeholder="请输入分类名称" />
            </el-form-item>
          </div>
          <div class="row row-2">
            <el-form-item label="排序" class="col col-1" prop="sortOrder" required>
              <el-input v-model="form.sortOrder" placeholder="数字越小越靠前" />
            </el-form-item>
            <el-form-item label="状态" class="col col-1" prop="isEnabled" required>
              <el-select v-model="form.isEnabled" placeholder="请选择" style="width: 100%">
                <el-option label="启用" :value="1" />
                <el-option label="禁用" :value="0" />
              </el-select>
            </el-form-item>
          </div>

          <div class="row row-2" v-if="dialog.mode !== 'create'">
            <el-form-item label="创建时间" class="col col-1">
              <el-input v-model="form.createTime" disabled />
            </el-form-item>
            <el-form-item label="更新时间" class="col col-1">
              <el-input v-model="form.updateTime" disabled />
            </el-form-item>
          </div>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialog.visible = false">{{ dialog.mode === 'view' ? '关闭' : '取消' }}</el-button>
          <el-button v-if="dialog.mode === 'view'" type="primary" @click="onEdit">修改</el-button>
          <el-button v-if="dialog.mode === 'create' || dialog.mode === 'edit'" type="primary" @click="dialog.mode === 'create' ? onSubmitCreate() : onSubmitEdit()">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('restaurant')
const loading = ref(false)

const query = reactive({
  keyword: '',
  name: '',
  isEnabled: undefined,
  createRange: [],
})

const page = reactive({ current: 1, size: 10 })

const restaurantCategories = ref([
  { id: 1, name: '小吃店', sortOrder: 1, isEnabled: 1, createTime: '2026-01-01 10:00:00', updateTime: '2026-01-01 10:00:00' },
  { id: 2, name: '私房菜', sortOrder: 2, isEnabled: 1, createTime: '2026-01-01 10:00:00', updateTime: '2026-01-01 10:00:00' },
  { id: 3, name: '古镇餐厅', sortOrder: 3, isEnabled: 1, createTime: '2026-01-01 10:00:00', updateTime: '2026-01-01 10:00:00' },
  { id: 4, name: '咖啡甜点', sortOrder: 4, isEnabled: 1, createTime: '2026-01-01 10:00:00', updateTime: '2026-01-01 10:00:00' },
  { id: 5, name: '农家菜', sortOrder: 5, isEnabled: 1, createTime: '2026-01-01 10:00:00', updateTime: '2026-01-01 10:00:00' },
  { id: 6, name: '温泉餐厅', sortOrder: 6, isEnabled: 1, createTime: '2026-01-01 10:00:00', updateTime: '2026-01-01 10:00:00' },
])

const dishCategories = ref([
  { id: 1, name: '招牌', sortOrder: 1, isEnabled: 1, createTime: '2026-01-01 10:00:00', updateTime: '2026-01-01 10:00:00' },
  { id: 2, name: '热菜', sortOrder: 2, isEnabled: 1, createTime: '2026-01-01 10:00:00', updateTime: '2026-01-01 10:00:00' },
  { id: 3, name: '汤类', sortOrder: 3, isEnabled: 1, createTime: '2026-01-01 10:00:00', updateTime: '2026-01-01 10:00:00' },
  { id: 4, name: '主食', sortOrder: 4, isEnabled: 1, createTime: '2026-01-01 10:00:00', updateTime: '2026-01-01 10:00:00' },
  { id: 5, name: '甜品', sortOrder: 5, isEnabled: 1, createTime: '2026-01-01 10:00:00', updateTime: '2026-01-01 10:00:00' },
  { id: 6, name: '凉菜', sortOrder: 6, isEnabled: 1, createTime: '2026-01-01 10:00:00', updateTime: '2026-01-01 10:00:00' },
  { id: 7, name: '饮品', sortOrder: 7, isEnabled: 1, createTime: '2026-01-01 10:00:00', updateTime: '2026-01-01 10:00:00' },
  { id: 8, name: '轻食', sortOrder: 8, isEnabled: 1, createTime: '2026-01-01 10:00:00', updateTime: '2026-01-01 10:00:00' },
])

const currentRowsRef = computed(() => (activeTab.value === 'restaurant' ? restaurantCategories : dishCategories))

const filteredRows = computed(() => {
  const keyword = String(query.keyword || '').trim().toLowerCase()
  const name = String(query.name || '').trim().toLowerCase()
  const range = Array.isArray(query.createRange) ? query.createRange : []
  const start = range?.[0]
  const end = range?.[1]
  return currentRowsRef.value.value.filter(r => {
    if (query.isEnabled != null && query.isEnabled !== '' && r.isEnabled !== query.isEnabled) return false
    if (start || end) {
      const datePart = String(r.createTime || '').slice(0, 10)
      if (!datePart) return false
      if (start && datePart < start) return false
      if (end && datePart > end) return false
    }
    if (name) {
      if (!String(r.name || '').toLowerCase().includes(name)) return false
    }
    if (!keyword) return true
    return `${r.id} ${r.name}`.toLowerCase().includes(keyword)
  })
})

const total = computed(() => filteredRows.value.length)
const list = computed(() => {
  const start = (page.current - 1) * page.size
  const end = start + page.size
  return filteredRows.value.slice(start, end)
})

const selectedRows = ref([])
const onSelectionChange = (rows) => { selectedRows.value = rows }
const singleDeletable = computed(() => selectedRows.value.length === 1)

const dialog = reactive({ visible: false, mode: 'create' })
const formRef = ref()
const form = reactive({
  id: '',
  name: '',
  sortOrder: 0,
  isEnabled: 1,
  createTime: '',
  updateTime: '',
})

const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  sortOrder: [{ required: true, message: '请输入排序', trigger: 'blur' }, { validator: validateInteger('排序'), trigger: 'blur' }],
  isEnabled: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

const dialogTitle = computed(() => {
  const prefix = activeTab.value === 'restaurant' ? '餐厅' : '菜品'
  if (dialog.mode === 'create') return `新增${prefix}分类`
  if (dialog.mode === 'edit') return `编辑${prefix}分类`
  return `${prefix}分类详情`
})

function validateInteger(label) {
  return (_rule, value, callback) => {
    const str = String(value ?? '').trim()
    if (!str) return callback()
    const num = Number(str)
    if (!Number.isInteger(num)) return callback(new Error(`${label}必须是整数`))
    if (num < 0) return callback(new Error(`${label}不能小于0`))
    callback()
  }
}

function onSearch() {
  page.current = 1
}

function onReset() {
  query.keyword = ''
  query.name = ''
  query.isEnabled = undefined
  query.createRange = []
  page.current = 1
}

function onSizeChange(sz) {
  page.size = sz
  page.current = 1
}

function onPageChange(p) {
  page.current = p
}

function resetForm() {
  form.id = ''
  form.name = ''
  form.sortOrder = 0
  form.isEnabled = 1
  form.createTime = ''
  form.updateTime = ''
}

function fillForm(row) {
  form.id = row.id
  form.name = row.name || ''
  form.sortOrder = row.sortOrder ?? 0
  form.isEnabled = row.isEnabled ?? 1
  form.createTime = row.createTime || ''
  form.updateTime = row.updateTime || ''
}

function onAdd() {
  dialog.mode = 'create'
  resetForm()
  dialog.visible = true
  nextTick(() => formRef.value?.clearValidate())
}

function onView(row) {
  dialog.mode = 'view'
  fillForm(row)
  dialog.visible = true
}

function onEdit() {
  dialog.mode = 'edit'
  nextTick(() => formRef.value?.clearValidate())
}

function onDialogClosed() {
  resetForm()
  formRef.value?.clearValidate()
}

function nowText() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function nextId() {
  const max = currentRowsRef.value.value.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0)
  return max + 1
}

async function onSubmitCreate() {
  try {
    await formRef.value?.validate()
    const id = nextId()
    const t = nowText()
    const row = {
      id,
      name: form.name,
      sortOrder: Number(form.sortOrder),
      isEnabled: form.isEnabled,
      createTime: t,
      updateTime: t,
    }
    currentRowsRef.value.value = [row, ...currentRowsRef.value.value]
    ElMessage.success('已新增（本地模拟）')
    dialog.visible = false
  } catch (_) {}
}

async function onSubmitEdit() {
  try {
    await formRef.value?.validate()
    const t = nowText()
    currentRowsRef.value.value = currentRowsRef.value.value.map(r => {
      if (r.id !== form.id) return r
      return {
        ...r,
        name: form.name,
        sortOrder: Number(form.sortOrder),
        isEnabled: form.isEnabled,
        updateTime: t,
      }
    })
    ElMessage.success('已保存（本地模拟）')
    dialog.visible = false
  } catch (_) {}
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除「${row.name}」？`, '提示', { type: 'warning' })
    currentRowsRef.value.value = currentRowsRef.value.value.filter(r => r.id !== row.id)
    selectedRows.value = selectedRows.value.filter(r => r.id !== row.id)
    ElMessage.success('已删除（本地模拟）')
    if (page.current > 1 && list.value.length === 0) page.current -= 1
  } catch (_) {}
}

async function onBatchDelete() {
  const ids = new Set(selectedRows.value.map(r => r.id))
  if (ids.size === 0) return
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${ids.size} 条记录？`, '提示', { type: 'warning' })
    currentRowsRef.value.value = currentRowsRef.value.value.filter(r => !ids.has(r.id))
    selectedRows.value = []
    ElMessage.success('已批量删除（本地模拟）')
    if (page.current > 1 && list.value.length === 0) page.current -= 1
  } catch (_) {}
}
</script>

<style scoped>
.admin-restaurant-categories {
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

.search-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
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

.dialog-body {
  padding: 6px 0 0;
}

.row {
  display: flex;
  gap: 12px;
}

.row-2 .col-1 {
  flex: 1;
}

.row-2 .col-2 {
  flex: 2;
}
</style>

