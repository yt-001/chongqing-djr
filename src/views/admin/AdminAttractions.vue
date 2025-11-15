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
    <!-- 复用弹窗：新增 / 查看详情 -->
    <el-dialog v-model="dialog.visible" :title="dialogTitle" width="760px" append-to-body @closed="onDialogClosed">
      <div class="dialog-body" v-loading="detailLoading">
        <el-form :key="dialogKey" ref="formRef" :model="form" :rules="rules" :disabled="dialog.mode === 'view'" label-width="96px" class="dialog-form">
          <!-- 第一行：名称（占两列）、地理位置（占一列） -->
          <div class="row row-3">
            <el-form-item label="景点名称" class="col col-2" prop="name" required>
              <el-input v-model="form.name" placeholder="请输入景点名称" />
            </el-form-item>
            <el-form-item label="地理位置" class="col col-1" prop="location" required>
              <el-input v-model="form.location" placeholder="请输入地理位置" />
            </el-form-item>
          </div>

          <!-- 第二行：经纬度、联系电话、开放时间（三列） -->
          <div class="row row-3">
            <el-form-item label="纬度" class="col col-1" prop="latitude" required>
              <el-input v-model="form.latitude" placeholder="纬度" />
            </el-form-item>
            <el-form-item label="经度" class="col col-1" prop="longitude" required>
              <el-input v-model="form.longitude" placeholder="经度" />
            </el-form-item>
            <el-form-item label="联系电话" class="col col-1" prop="contactPhone" required>
              <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </div>

          <!-- 第三行：门票价格、封面图片、图片JSON（三列） -->
          <div class="row row-3">
            <el-form-item label="门票价格" class="col col-1" prop="ticketPrice" required>
              <el-input v-model="form.ticketPrice" placeholder="请输入价格" />
            </el-form-item>
            <el-form-item label="封面图片" class="col col-1" prop="coverImage" required>
              <el-input v-model="form.coverImage" placeholder="封面图片地址" />
            </el-form-item>
            <el-form-item label="图片JSON" class="col col-1" prop="images" required>
              <el-input v-model="form.images" placeholder='["url1","url2"]' />
            </el-form-item>
          </div>

          <!-- 第四行：开放时间、创建时间、更新时间（三列合并展示） -->
          <div class="row row-3">
            <el-form-item label="开放时间" class="col col-1" prop="openHours" required>
              <el-input v-model="form.openHours" placeholder="如：9:00-18:00" />
            </el-form-item>
            <el-form-item label="创建时间" class="col col-1">
              <el-input v-model="form.createTime" disabled />
            </el-form-item>
            <el-form-item label="更新时间" class="col col-1">
              <el-input v-model="form.updateTime" disabled />
            </el-form-item>
          </div>
          <!-- 最底部：景点描述（单独一行，跨三列，两端对齐） -->
          <div class="row row-3">
            <el-form-item label="景点描述" class="col col-3" prop="description" required>
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="4"
                placeholder="请输入景点描述"
                class="desc-textarea"
              />
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
// 景点列表（管理端）：服务端分页与筛选
import { ref, reactive, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchAdminAttractionsPage, fetchAdminAttractionById, createAdminAttraction, updateAdminAttraction, deleteAdminAttraction } from '@/api'

// 统一搜索条件（与接口请求体一致）
const query = reactive({ keyword: '', createTime: '', updateTime: '', name: '', location: '' })

// 分页与排序
const page = reactive({ current: 1, size: 10 })
const sort = reactive({ field: '', direction: 'DESC' })

// 列表数据
const loading = ref(false)
const list = ref([])
const total = ref(0)

// 弹窗与表单状态（新增/查看复用）
const dialog = reactive({ visible: false, mode: 'create' }) // mode: 'create' | 'view' | 'edit'
const detailLoading = ref(false)
let detailSeq = 0 // 详情请求序列号，用于防止查看响应覆盖新增表单
const dialogKey = ref(0) // 强制重建表单实例，清空内部缓存
const formRef = ref()
// 原始数据快照：用于编辑时只提交变更字段
const originalForm = ref(null)
const rules = {
  // 必填：名称/描述/位置/纬度/经度/封面/图片JSON/开放时间/价格/电话
  name: [{ required: true, message: '请输入景点名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入景点描述', trigger: 'blur' }],
  location: [{ required: true, message: '请输入地理位置', trigger: 'blur' }],
  latitude: [
    { required: true, message: '请输入纬度', trigger: 'blur' },
    { validator: validateNumber('纬度'), trigger: 'blur' }
  ],
  longitude: [
    { required: true, message: '请输入经度', trigger: 'blur' },
    { validator: validateNumber('经度'), trigger: 'blur' }
  ],
  coverImage: [{ required: true, message: '请输入封面图片地址', trigger: 'blur' }],
  images: [{ required: true, message: '请输入图片JSON数组', trigger: 'blur' }],
  openHours: [{ required: true, message: '请输入开放时间', trigger: 'blur' }],
  ticketPrice: [
    { required: true, message: '请输入门票价格', trigger: 'blur' },
    { validator: validateNumber('门票价格'), trigger: 'blur' }
  ],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { validator: validatePhone, trigger: 'blur' }
  ],
}
const form = reactive({
  id: '',
  name: '',
  description: '',
  location: '',
  latitude: '',
  longitude: '',
  coverImage: '',
  images: '',
  openHours: '',
  ticketPrice: '',
  contactPhone: '',
  createTime: '',
  updateTime: ''
})
const dialogTitle = computed(() => {
  if (dialog.mode === 'create') return '新增景点'
  if (dialog.mode === 'edit') return '编辑景点'
  return '景点详情'
})

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
function resetForm() {
  // 清空所有字段，避免任何残留
  form.id = ''
  form.name = ''
  form.description = ''
  form.location = ''
  form.latitude = ''
  form.longitude = ''
  form.coverImage = ''
  form.images = ''
  form.openHours = ''
  form.ticketPrice = ''
  form.contactPhone = ''
  form.createTime = ''
  form.updateTime = ''
}

function onAdd() {
  dialog.mode = 'create'
  // 递增序列号，标记之前的查看请求响应为过期
  detailSeq++
  resetForm()
  originalForm.value = null
  detailLoading.value = false
  dialog.visible = true
}

async function onView(row) {
  dialog.mode = 'view'
  resetForm()
  dialog.visible = true
  dialogKey.value++
  detailLoading.value = true
  const seq = ++detailSeq
  try {
    const data = await fetchAdminAttractionById(row.id)
    // 如果在等待过程中用户切换了模式或发起了新增，则丢弃响应
    if (seq !== detailSeq || dialog.mode !== 'view') return
    // 将详情回显到表单（包含后端新增字段）
    form.id = data?.id ?? row.id
    form.name = data?.name ?? ''
    form.description = data?.description ?? ''
    form.location = data?.location ?? ''
    form.latitude = data?.latitude ?? ''
    form.longitude = data?.longitude ?? ''
    form.coverImage = data?.coverImage ?? ''
    form.images = data?.images ?? ''
    form.openHours = data?.openHours ?? ''
    form.ticketPrice = data?.ticketPrice ?? ''
    form.contactPhone = data?.contactPhone ?? ''
    form.createTime = data?.createTime ?? ''
    form.updateTime = data?.updateTime ?? ''
    // 保存一份原始快照，用于后续差异提交
    originalForm.value = {
      id: form.id,
      name: form.name,
      description: form.description,
      location: form.location,
      latitude: form.latitude,
      longitude: form.longitude,
      coverImage: form.coverImage,
      images: form.images,
      openHours: form.openHours,
      ticketPrice: form.ticketPrice,
      contactPhone: form.contactPhone,
      createTime: form.createTime,
      updateTime: form.updateTime,
    }
  } catch (e) {
    // 若已切换模式，无需提示错误；仅在当前仍处于查看模式时提示
    if (seq === detailSeq && dialog.mode === 'view') {
      ElMessage.error(e.message || '查询详情失败')
    }
  } finally {
    if (seq === detailSeq) {
      detailLoading.value = false
    }

  }
}

function onEdit() {
  // 查看模式切换为编辑模式，允许修改并显示保存按钮
  dialog.mode = 'edit'
  nextTick(() => formRef.value?.clearValidate())
}

function onDialogClosed() {
  // 弹窗关闭统一重置，清空表单并失效所有未完成的查看响应
  detailSeq++
  resetForm()
  detailLoading.value = false
  dialogKey.value++
}

function onSubmitEdit() {
  // 先校验表单
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    try {
      const payload = { ...form } // 包含 id 与可编辑字段
      await updateAdminAttraction(payload)
      ElMessage.success('修改成功')
      dialog.visible = false
      loadData()
    } catch (e) {
      ElMessage.error(e.message || '修改失败')
    }
  })
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除景点：${row.name}？`, '提示', { type: 'warning' })
    await deleteAdminAttraction(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch {}
}
async function onBatchDelete() {
  try {
    await ElMessageBox.confirm(`确认批量删除 ${selectedRows.value.length} 条记录？`, '提示', { type: 'warning' })
    for (const item of selectedRows.value) {
      await deleteAdminAttraction(item.id)
    }
    ElMessage.success('批量删除成功')
    selectedRows.value = []
    loadData()
  } catch {}
}

function validateNumber(label) {
  return (_rule, value, callback) => {
    if (value === '' || value === null || value === undefined) return callback()
    const num = Number(value)
    if (Number.isNaN(num)) return callback(new Error(`${label}必须为数字`))
    callback()
  }
}
function validatePhone(_rule, value, callback) {
  if (!value) return callback()
  const ok = /^\+?\d[\d\-\s]{5,}$/.test(value)
  if (!ok) return callback(new Error('联系电话格式不正确'))
  callback()
}

// 构建仅包含变更项的载荷（始终包含 id，排除创建/更新时间）
function buildDiffPayload() {
  if (!originalForm.value) {
    // 无快照，退化为全量提交可编辑字段
    return {
      id: form.id,
      name: form.name,
      description: form.description,
      location: form.location,
      latitude: form.latitude,
      longitude: form.longitude,
      coverImage: form.coverImage,
      images: form.images,
      openHours: form.openHours,
      ticketPrice: form.ticketPrice,
      contactPhone: form.contactPhone,
    }
  }
  const editableFields = ['name','description','location','latitude','longitude','coverImage','images','openHours','ticketPrice','contactPhone']
  const diff = { id: form.id }
  let changed = false
  for (const key of editableFields) {
    const oldVal = originalForm.value[key]
    const newVal = form[key]
    if (newVal !== oldVal) {
      diff[key] = newVal
      changed = true
    }
  }
  return changed ? diff : null
}

function onSubmitCreate() {
  // 先校验表单
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    try {
      // 构造新增载荷：不包含 id/createTime/updateTime
      const payload = {
        name: form.name,
        description: form.description,
        location: form.location,
        latitude: form.latitude,
        longitude: form.longitude,
        coverImage: form.coverImage,
        images: form.images,
        openHours: form.openHours,
        ticketPrice: form.ticketPrice,
        contactPhone: form.contactPhone,
      }
      await createAdminAttraction(payload)
      ElMessage.success('新增成功')
      dialog.visible = false
      loadData()
    } catch (e) {
      ElMessage.error(e.message || '新增失败')
    }
  })
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

/* 弹窗表单紧凑多列布局 */
.dialog-form { width: 100%; }
.dialog-form .row { display: grid; gap: 12px; margin-bottom: 12px; }
.dialog-form .row-3 { grid-template-columns: repeat(3, 1fr); }
.dialog-form .col-2 { grid-column: span 2; }
.dialog-form .col-3 { grid-column: span 3; }
.dialog-form .col-1 { grid-column: span 1; }
.dialog-form :deep(.el-form-item) { margin-bottom: 0; align-items: center; }
.dialog-form :deep(.el-form-item__label) { align-self: start; padding-top: 4px; }
.desc-textarea :deep(textarea) { text-align: justify; }
.meta-row :deep(.el-input__wrapper) { background: #fafafa; }

.dialog-body { padding: 8px 14px 6px; overflow: visible; }
/* 让错误提示占据文档流并自动换行，避免被裁剪 */
.dialog-form :deep(.el-form-item__error) {
  position: static;
  margin-top: 4px;
  line-height: 1.2;
  white-space: normal;
}
/* 给内容区域底部预留空间，避免错误提示与下一行挤在一起 */
.dialog-form :deep(.el-form-item__content) {
  padding-bottom: 4px;
}
@media (max-width: 1023px) {
  .dialog-form .row-3 { grid-template-columns: 1fr; }
  .dialog-form .col-2, .dialog-form .col-3, .dialog-form .col-1 { grid-column: span 1; }
}
</style>
