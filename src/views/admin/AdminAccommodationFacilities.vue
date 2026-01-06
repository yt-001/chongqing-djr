<template>
  <div class="admin-facilities-page">
    <el-card class="block" shadow="never">
      <div class="search-row">
        <el-input v-model="query.name" placeholder="设施名称" clearable />
        <el-button type="primary" @click="onSearch">搜索</el-button>
        <el-button @click="onReset">重置</el-button>
        <el-button type="success" @click="onAdd">新增设施</el-button>
      </div>
    </el-card>

    <el-card class="block" shadow="never">
      <el-table :data="list" border style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="编号" width="100" />
        <el-table-column prop="name" label="设施名称" min-width="200" />
        <el-table-column prop="description" label="描述" min-width="280" show-overflow-tooltip />
        <el-table-column prop="icon" label="图标" width="140" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column prop="updateTime" label="更新时间" width="180" />
        <el-table-column label="操作" fixed="right" width="280">
          <template #default="scope">
            <div class="op-row">
              <el-button size="small" @click="onView(scope.row.id)">查看</el-button>
              <el-button size="small" type="primary" @click="onEdit(scope.row.id)">编辑</el-button>
              <el-button size="small" type="danger" @click="onDelete(scope.row.id)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="total" :current-page="page.current" :page-size="page.size" :page-sizes="[10,20,50]" @size-change="onSizeChange" @current-change="onPageChange" />
      </div>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialogTitle" width="680px" append-to-body @closed="onDialogClosed">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="设施名称" prop="name" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="设施描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="form.icon" placeholder="如：wifi / tv-o" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible=false">取消</el-button>
        <el-button type="primary" @click="dialog.mode==='create'?onSubmitCreate():onSubmitEdit()">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchAccommodationFacilitiesPage, fetchAccommodationFacilityById, createAccommodationFacility, updateAccommodationFacility, deleteAccommodationFacility } from '@/api'

// 查询与分页
const query = reactive({ name: '' })
const page = reactive({ current: 1, size: 10 })
const loading = ref(false)
const list = ref([])
const total = ref(0)

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

// 表单与弹窗
const dialog = reactive({ visible: false, mode: 'create' })
const formRef = ref()
const form = reactive({ id: '', name: '', description: '', icon: '' })
const rules = { name: [{ required: true, message: '请输入设施名称', trigger: 'blur' }] }
const dialogTitle = computed(() => dialog.mode === 'create' ? '新增住宿设施' : '编辑住宿设施')

/** 加载分页数据 */
async function loadData() {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
  loading.value = true
  const startedAt = Date.now()
  try {
    const data = await fetchAccommodationFacilitiesPage({ pageNum: page.current, pageSize: page.size, query })
    list.value = data?.list || data?.records || []
    total.value = data?.total ?? data?.totalRecords ?? 0
  } catch (e) { ElMessage.error(e.message || '加载失败') } finally {
    const elapsed = Date.now() - startedAt
    const remaining = minRefreshMs - elapsed
    refreshTimer = setTimeout(() => {
      loading.value = false
      refreshTimer = null
    }, remaining > 0 ? remaining : 0)
  }
}

/** 搜索并重置页码 */
function onSearch() { page.current = 1; loadData() }
/** 重置查询条件 */
function onReset() { query.name=''; page.current=1; loadData() }
/** 分页大小变化 */
function onSizeChange(sz) { page.size = sz; page.current = 1; requestPageLoad() }
/** 页码变化 */
function onPageChange(p) { page.current = p; requestPageLoad() }

/** 打开新增弹窗 */
function onAdd() { dialog.mode='create'; form.id=''; form.name=''; form.description=''; form.icon=''; dialog.visible=true }

/** 查看详情并进入编辑 */
async function onView(id) {
  try {
    const data = await fetchAccommodationFacilityById(id)
    form.id = data?.id ?? id
    form.name = data?.name ?? ''
    form.description = data?.description ?? ''
    form.icon = data?.icon ?? ''
    dialog.mode = 'edit'
    dialog.visible = true
  } catch (e) { ElMessage.error(e.message || '获取详情失败') }
}

/** 进入编辑模式 */
async function onEdit(id) { await onView(id) }

/** 删除设施 */
async function onDelete(id) {
  try {
    await ElMessageBox.confirm('确认删除该设施？', '提示', { type: 'warning' })
    await deleteAccommodationFacility(id)
    ElMessage.success('删除成功')
    loadData()
  } catch {}
}

/** 提交新增 */
function onSubmitCreate() {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    try {
      await createAccommodationFacility({ name: form.name, description: form.description, icon: form.icon })
      ElMessage.success('新增成功')
      dialog.visible = false
      loadData()
    } catch (e) { ElMessage.error(e.message || '新增失败') }
  })
}

/** 提交编辑 */
function onSubmitEdit() {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    try {
      await updateAccommodationFacility({ id: form.id, name: form.name, description: form.description, icon: form.icon })
      ElMessage.success('修改成功')
      dialog.visible = false
      loadData()
    } catch (e) { ElMessage.error(e.message || '修改失败') }
  })
}

/** 弹窗关闭重置表单 */
function onDialogClosed() { form.id=''; form.name=''; form.description=''; form.icon='' }

loadData()
</script>

<style scoped>
.admin-facilities-page { padding: 8px; }
.block { margin-bottom: 12px; }
.search-row { display: flex; gap: 8px; align-items: center; }
.search-row :deep(.el-input) { width: 260px; }
.pager { display: flex; justify-content: flex-end; margin-top: 12px; }
.op-row { display: flex; flex-wrap: nowrap; gap: 8px; align-items: center; white-space: nowrap; }
</style>
