<template>
  <div class="admin-ai-prompts">
    <el-card class="block" shadow="never">
      <div class="toolbar">
        <div class="toolbar-right">
          <el-button type="primary" @click="onAdd">新增推荐问题</el-button>
          <el-button type="danger" :disabled="!singleDeletable" @click="onDelete(selectedRows[0])">删除</el-button>
          <el-button type="danger" :disabled="selectedRows.length === 0" @click="onBatchDelete">批量删除</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="block" shadow="never">
      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" placeholder="推荐问题" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.isEnabled" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
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
          <el-table-column prop="id" label="编号" width="100" sortable="custom" />
          <el-table-column prop="content" label="推荐问题" min-width="320" show-overflow-tooltip />
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
            <el-form-item label="内容" class="col col-2" prop="content" required>
              <el-input v-model="form.content" placeholder="请输入推荐问题" type="textarea" :rows="3" />
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
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  fetchAdminAiPromptsPage,
  fetchAdminAiPromptById,
  createAdminAiPrompt,
  updateAdminAiPrompt,
  deleteAdminAiPrompt,
} from '@/api'

const loading = ref(false)
const list = ref([])
const total = ref(0)

const query = reactive({
  keyword: '',
  isEnabled: undefined,
  createRange: [],
})

const page = reactive({ current: 1, size: 10 })
const sortField = ref('')
const sortDirection = ref('DESC')

const selectedRows = ref([])
const onSelectionChange = (rows) => { selectedRows.value = rows }
const singleDeletable = computed(() => selectedRows.value.length === 1)

const dialog = reactive({ visible: false, mode: 'create' })
const formRef = ref()
const form = reactive({
  id: '',
  content: '',
  sortOrder: 0,
  isEnabled: 1,
  createTime: '',
  updateTime: '',
})

const rules = {
  content: [{ required: true, message: '请输入推荐问题', trigger: 'blur' }],
  sortOrder: [{ required: true, message: '请输入排序', trigger: 'blur' }, { validator: validateInteger('排序'), trigger: 'blur' }],
  isEnabled: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

const dialogTitle = computed(() => {
  if (dialog.mode === 'create') return '新增推荐问题'
  if (dialog.mode === 'edit') return '编辑推荐问题'
  return '推荐问题详情'
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
  if (query.isEnabled !== undefined) {
    q.isEnabled = query.isEnabled
  }
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
    const data = await fetchAdminAiPromptsPage(buildPagePayload())
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
  query.isEnabled = undefined
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

function resetForm() {
  form.id = ''
  form.content = ''
  form.sortOrder = 0
  form.isEnabled = 1
  form.createTime = ''
  form.updateTime = ''
}

function fillForm(row) {
  form.id = row.id
  form.content = row.content || ''
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
  dialog.visible = true
  loadDetail(row.id)
}

function onEdit() {
  dialog.mode = 'edit'
  nextTick(() => formRef.value?.clearValidate())
}

function onDialogClosed() {
  resetForm()
  formRef.value?.clearValidate()
}

async function loadDetail(id) {
  try {
    const data = await fetchAdminAiPromptById(id)
    fillForm(data || {})
  } catch (e) {
    ElMessage.error(e.message || '加载详情失败')
    dialog.visible = false
  }
}

async function onSubmitCreate() {
  try {
    await formRef.value?.validate()
    await createAdminAiPrompt({
      content: form.content,
      sortOrder: Number(form.sortOrder),
      isEnabled: form.isEnabled,
    })
    ElMessage.success('新增成功')
    dialog.visible = false
    loadData()
  } catch (_) {}
}

async function onSubmitEdit() {
  try {
    await formRef.value?.validate()
    await updateAdminAiPrompt({
      id: Number(form.id),
      content: form.content,
      sortOrder: Number(form.sortOrder),
      isEnabled: form.isEnabled,
    })
    ElMessage.success('保存成功')
    dialog.visible = false
    loadData()
  } catch (_) {}
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除该推荐问题？`, '提示', { type: 'warning' })
    await deleteAdminAiPrompt(row.id)
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
      await deleteAdminAiPrompt(id)
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
.admin-ai-prompts {
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
