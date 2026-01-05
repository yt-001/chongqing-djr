<template>
  <div class="admin-restaurant-dishes">
    <el-card class="block" shadow="never">
      <div class="search-row">
        <el-input v-model="query.keyword" placeholder="关键词" clearable />
        <el-select v-model="query.restaurantId" placeholder="所属餐厅" clearable filterable style="width: 200px">
          <el-option v-for="r in restaurants" :key="r.id" :label="r.name" :value="r.id" />
        </el-select>
        <el-select v-model="query.categoryId" placeholder="菜品分类" clearable filterable style="width: 160px">
          <el-option v-for="c in dishCategories" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-select v-model="query.isRecommended" placeholder="是否推荐" clearable style="width: 140px">
          <el-option label="推荐" :value="1" />
          <el-option label="不推荐" :value="0" />
        </el-select>
        <el-date-picker v-model="query.createRange" type="daterange" value-format="YYYY-MM-DD" range-separator="-" start-placeholder="创建开始" end-placeholder="创建结束" />
        <el-button type="primary" @click="onSearch">搜索</el-button>
        <el-button @click="onReset">重置</el-button>
      </div>
    </el-card>

    <el-card class="block" shadow="never">
      <div class="action-row">
        <el-button type="primary" @click="onAdd">添加菜品</el-button>
        <el-button type="danger" :disabled="!singleDeletable" @click="onDelete(selectedRows[0])">删除</el-button>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="onBatchDelete">批量删除</el-button>
      </div>
    </el-card>

    <el-card class="block" shadow="never">
      <div class="table-wrap">
        <el-table :data="list" border style="width: 100%" :fit="false" v-loading="loading" @selection-change="onSelectionChange">
          <el-table-column type="selection" width="48" fixed="left" />
          <el-table-column prop="id" label="编号" width="100" sortable="custom" />
          <el-table-column prop="name" label="菜品名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="restaurantName" label="所属餐厅" min-width="200" show-overflow-tooltip />
          <el-table-column prop="categoryName" label="分类" width="120" />
          <el-table-column prop="price" label="价格" width="120">
            <template #default="{ row }">
              <span>{{ formatPrice(row.price) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="isRecommended" label="推荐" width="110">
            <template #default="{ row }">
              <el-tag v-if="row.isRecommended === 1" type="success">推荐</el-tag>
              <el-tag v-else type="info">否</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sortOrder" label="顺序" width="90" />
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

    <el-dialog v-model="dialog.visible" :title="dialogTitle" width="760px" append-to-body @closed="onDialogClosed">
      <div class="dialog-body">
        <el-form ref="formRef" :model="form" :rules="rules" :disabled="dialog.mode === 'view'" label-width="96px" class="dialog-form">
          <div class="layout-2-1">
            <div class="layout-left">
              <div class="row row-3">
                <el-form-item label="菜品名称" class="col col-1" prop="name" required>
                  <el-input v-model="form.name" placeholder="请输入菜品名称" />
                </el-form-item>
                <el-form-item label="所属餐厅" class="col col-1" prop="restaurantId" required>
                  <el-select v-model="form.restaurantId" placeholder="请选择餐厅" filterable style="width: 100%">
                    <el-option v-for="r in restaurants" :key="r.id" :label="r.name" :value="r.id" />
                  </el-select>
                </el-form-item>
                <el-form-item label="分类" class="col col-1" prop="categoryId" required>
                  <el-select v-model="form.categoryId" placeholder="请选择分类" filterable style="width: 100%">
                    <el-option v-for="c in dishCategories" :key="c.id" :label="c.name" :value="c.id" />
                  </el-select>
                </el-form-item>
              </div>

              <div class="row row-3">
                <el-form-item label="价格" class="col col-1" prop="price" required>
                  <el-input v-model="form.price" placeholder="如：18.00" />
                </el-form-item>
                <el-form-item label="推荐" class="col col-1" prop="isRecommended" required>
                  <el-select v-model="form.isRecommended" placeholder="请选择" style="width: 100%">
                    <el-option label="推荐" :value="1" />
                    <el-option label="不推荐" :value="0" />
                  </el-select>
                </el-form-item>
                <el-form-item label="顺序" class="col col-1" prop="sortOrder" required>
                  <el-input v-model="form.sortOrder" placeholder="数字越小越靠前" />
                </el-form-item>
              </div>

              <div class="row row-2">
                <el-form-item label="描述" class="col col-2" prop="description">
                  <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入描述（可选）" />
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
            </div>

            <div class="layout-right">
              <div v-if="dialog.mode !== 'view'" class="image-aside" :title="imagePreviewUrl ? '点击预览图片' : '点击上传图片'" @click="imagePreviewUrl ? openPreview() : triggerUpload()">
                <el-image v-if="imagePreviewUrl" :src="imagePreviewUrl" fit="cover" class="cover" />
                <div v-else class="cover placeholder">点击上传图片</div>
                <div v-if="imagePreviewUrl" class="clear-btn" @click.stop="clearImage">
                  <el-icon class="clear-icon"><Close /></el-icon>
                </div>
                <input ref="fileInputRef" type="file" accept="image/*" style="display: none" @change="onFileInputChange">
              </div>
              <div v-else class="image-aside" @click="openPreview" title="点击预览图片">
                <el-image v-if="imagePreviewUrl" :src="imagePreviewUrl" fit="cover" class="cover" />
                <div v-else class="cover placeholder">无图片</div>
              </div>
            </div>
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

    <el-dialog v-model="preview.visible" title="图片预览" width="720px" append-to-body>
      <div class="preview-body">
        <el-image v-if="imagePreviewUrl" :src="imagePreviewUrl" fit="contain" class="preview-large" />
        <div v-else class="preview-empty">无图片</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Close } from '@element-plus/icons-vue'

const restaurants = ref([
  { id: 1, name: '梁平张鸭子总店' },
  { id: 2, name: '双桂油渣家' },
  { id: 3, name: '明达古镇客栈餐厅' },
  { id: 4, name: '竹尖私房菜' },
  { id: 5, name: '桂湖温泉餐厅' },
  { id: 6, name: '云逸咖啡' },
  { id: 7, name: '合兴农家院' },
  { id: 8, name: '文化街小吃集市' },
])

const dishCategories = ref([
  { id: 1, name: '招牌' },
  { id: 2, name: '热菜' },
  { id: 3, name: '汤类' },
  { id: 4, name: '主食' },
  { id: 5, name: '甜品' },
  { id: 6, name: '凉菜' },
  { id: 7, name: '饮品' },
  { id: 8, name: '轻食' },
])

const restaurantNameMap = computed(() => {
  const map = new Map()
  restaurants.value.forEach(r => map.set(r.id, r.name))
  return map
})

const categoryNameMap = computed(() => {
  const map = new Map()
  dishCategories.value.forEach(c => map.set(c.id, c.name))
  return map
})

const query = reactive({
  keyword: '',
  restaurantId: undefined,
  categoryId: undefined,
  isRecommended: undefined,
  createRange: [],
})

const page = reactive({ current: 1, size: 10 })
const loading = ref(false)

const allRows = ref([
  {
    id: 1000,
    restaurantId: 1,
    categoryId: 1,
    name: '招牌张鸭子',
    description: '秘制卤味，色泽红亮，入口酥香',
    price: 68,
    imageUrl: 'https://example.com/images/dishes/1_zhangyazi.jpg',
    isRecommended: 1,
    sortOrder: 1,
    createTime: '2026-01-01 10:00:00',
    updateTime: '2026-01-01 10:00:00',
  },
  {
    id: 1001,
    restaurantId: 1,
    categoryId: 3,
    name: '鸭架酸菜汤',
    description: '以张鸭子鸭架熬制的酸菜汤，酸爽开胃',
    price: 18,
    imageUrl: 'https://example.com/images/dishes/1_yajia_tang.jpg',
    isRecommended: 0,
    sortOrder: 2,
    createTime: '2026-01-01 10:00:00',
    updateTime: '2026-01-01 10:00:00',
  },
  {
    id: 1002,
    restaurantId: 2,
    categoryId: 4,
    name: '双桂油渣炒饭',
    description: '颗粒分明，油渣香酥，双桂特色',
    price: 22,
    imageUrl: 'https://example.com/images/dishes/2_youzha_chaofan.jpg',
    isRecommended: 1,
    sortOrder: 1,
    createTime: '2026-01-01 10:00:00',
    updateTime: '2026-01-01 10:00:00',
  },
  {
    id: 1003,
    restaurantId: 3,
    categoryId: 2,
    name: '石锅焖排骨',
    description: '慢火焖煮，入口脱骨',
    price: 68,
    imageUrl: 'https://example.com/images/dishes/3_shiguo_paigu.jpg',
    isRecommended: 0,
    sortOrder: 2,
    createTime: '2026-01-01 10:00:00',
    updateTime: '2026-01-01 10:00:00',
  },
  {
    id: 1004,
    restaurantId: 6,
    categoryId: 5,
    name: '焦糖布丁',
    description: '经典甜点，适合作为下午茶',
    price: 22,
    imageUrl: 'https://example.com/images/dishes/6_caramel_pudding.jpg',
    isRecommended: 0,
    sortOrder: 3,
    createTime: '2026-01-01 10:00:00',
    updateTime: '2026-01-01 10:00:00',
  },
])

const filteredRows = computed(() => {
  const keyword = String(query.keyword || '').trim().toLowerCase()
  return allRows.value
    .map(r => ({
      ...r,
      restaurantName: restaurantNameMap.value.get(r.restaurantId) || '',
      categoryName: categoryNameMap.value.get(r.categoryId) || '',
    }))
    .filter(r => {
      if (query.restaurantId != null && query.restaurantId !== '' && r.restaurantId !== query.restaurantId) return false
      if (query.categoryId != null && query.categoryId !== '' && r.categoryId !== query.categoryId) return false
      if (query.isRecommended != null && query.isRecommended !== '' && r.isRecommended !== query.isRecommended) return false
      const range = Array.isArray(query.createRange) ? query.createRange : []
      const start = range?.[0]
      const end = range?.[1]
      if (start || end) {
        const datePart = String(r.createTime || '').slice(0, 10)
        if (!datePart) return false
        if (start && datePart < start) return false
        if (end && datePart > end) return false
      }
      if (!keyword) return true
      const hay = `${r.name} ${r.description || ''} ${r.restaurantName} ${r.categoryName}`.toLowerCase()
      return hay.includes(keyword)
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
const fileInputRef = ref()
const preview = reactive({ visible: false })
const imageState = reactive({ file: null, previewUrl: '' })
const imagePreviewUrl = computed(() => imageState.previewUrl || form.imageUrl)
const form = reactive({
  id: '',
  restaurantId: undefined,
  categoryId: undefined,
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  isRecommended: 0,
  sortOrder: 0,
  createTime: '',
  updateTime: '',
})

const rules = {
  name: [{ required: true, message: '请输入菜品名称', trigger: 'blur' }],
  restaurantId: [{ required: true, message: '请选择所属餐厅', trigger: 'change' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }, { validator: validateNumber('价格'), trigger: 'blur' }],
  isRecommended: [{ required: true, message: '请选择是否推荐', trigger: 'change' }],
  sortOrder: [{ required: true, message: '请输入顺序', trigger: 'blur' }, { validator: validateInteger('顺序'), trigger: 'blur' }],
}

const dialogTitle = computed(() => {
  if (dialog.mode === 'create') return '新增菜品'
  if (dialog.mode === 'edit') return '编辑菜品'
  return '菜品详情'
})

function validateNumber(label) {
  return (_rule, value, callback) => {
    const str = String(value ?? '').trim()
    if (!str) return callback()
    const num = Number(str)
    if (Number.isNaN(num)) return callback(new Error(`${label}必须是数字`))
    if (num < 0) return callback(new Error(`${label}不能小于0`))
    callback()
  }
}

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

function formatPrice(val) {
  const num = Number(val)
  if (Number.isNaN(num)) return '-'
  return `￥${num.toFixed(2)}`
}

function onSearch() {
  page.current = 1
}

function onReset() {
  query.keyword = ''
  query.restaurantId = undefined
  query.categoryId = undefined
  query.isRecommended = undefined
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
  clearImage()
  form.id = ''
  form.restaurantId = undefined
  form.categoryId = undefined
  form.name = ''
  form.description = ''
  form.price = ''
  form.imageUrl = ''
  form.isRecommended = 0
  form.sortOrder = 0
  form.createTime = ''
  form.updateTime = ''
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
  preview.visible = false
}

function fillForm(row) {
  form.id = row.id
  form.restaurantId = row.restaurantId
  form.categoryId = row.categoryId
  form.name = row.name || ''
  form.description = row.description || ''
  form.price = String(row.price ?? '')
  form.imageUrl = row.imageUrl || ''
  form.isRecommended = row.isRecommended ?? 0
  form.sortOrder = row.sortOrder ?? 0
  form.createTime = row.createTime || ''
  form.updateTime = row.updateTime || ''
}

function openPreview() {
  if (!imagePreviewUrl.value) return
  preview.visible = true
}

function triggerUpload() {
  fileInputRef.value?.click()
}

function clearImage() {
  if (imageState.previewUrl && imageState.previewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(imageState.previewUrl)
  }
  imageState.file = null
  imageState.previewUrl = ''
  form.imageUrl = ''
}

function onFileInputChange(e) {
  const file = e.target?.files?.[0]
  if (!file) return
  clearImage()
  imageState.file = file
  imageState.previewUrl = URL.createObjectURL(file)
  form.imageUrl = imageState.previewUrl
  e.target.value = ''
}

function nowText() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

async function onSubmitCreate() {
  try {
    await formRef.value?.validate()
    if (!form.imageUrl) {
      ElMessage.warning('请上传菜品图片')
      return
    }
    const id = nextId()
    const t = nowText()
    const row = {
      id,
      restaurantId: form.restaurantId,
      categoryId: form.categoryId,
      name: form.name,
      description: form.description,
      price: Number(form.price),
      imageUrl: form.imageUrl,
      isRecommended: form.isRecommended,
      sortOrder: Number(form.sortOrder),
      createTime: t,
      updateTime: t,
    }
    allRows.value = [row, ...allRows.value]
    ElMessage.success('已添加（本地模拟）')
    dialog.visible = false
  } catch (_) {}
}

async function onSubmitEdit() {
  try {
    await formRef.value?.validate()
    if (!form.imageUrl) {
      ElMessage.warning('请上传菜品图片')
      return
    }
    const t = nowText()
    allRows.value = allRows.value.map(r => {
      if (r.id !== form.id) return r
      return {
        ...r,
        restaurantId: form.restaurantId,
        categoryId: form.categoryId,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        imageUrl: form.imageUrl,
        isRecommended: form.isRecommended,
        sortOrder: Number(form.sortOrder),
        updateTime: t,
      }
    })
    ElMessage.success('已保存（本地模拟）')
    dialog.visible = false
  } catch (_) {}
}

function nextId() {
  const max = allRows.value.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0)
  return max + 1
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除「${row.name}」？`, '提示', { type: 'warning' })
    if (row.imageUrl && String(row.imageUrl).startsWith('blob:')) {
      URL.revokeObjectURL(row.imageUrl)
    }
    allRows.value = allRows.value.filter(r => r.id !== row.id)
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
    allRows.value.forEach(r => {
      if (ids.has(r.id) && r.imageUrl && String(r.imageUrl).startsWith('blob:')) {
        URL.revokeObjectURL(r.imageUrl)
      }
    })
    allRows.value = allRows.value.filter(r => !ids.has(r.id))
    selectedRows.value = []
    ElMessage.success('已批量删除（本地模拟）')
    if (page.current > 1 && list.value.length === 0) page.current -= 1
  } catch (_) {}
}
</script>

<style scoped>
.admin-restaurant-dishes {
  padding: 16px;
}

.block {
  margin-bottom: 12px;
}

.search-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.action-row {
  display: flex;
  gap: 12px;
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

.row-3 .col {
  flex: 1;
}

.row-2 .col-1 {
  flex: 1;
}

.row-2 .col-2 {
  flex: 2;
}

.layout-2-1 {
  display: flex;
  gap: 14px;
}

.layout-left {
  flex: 1;
}

.layout-right {
  width: 240px;
  display: flex;
  justify-content: flex-end;
}

.image-aside {
  width: 220px;
  height: 220px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  cursor: pointer;
  position: relative;
  background: var(--el-fill-color-lighter);
}

.cover {
  width: 100%;
  height: 100%;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.clear-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-icon {
  color: #fff;
  font-size: 16px;
}

.preview-body {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 360px;
}

.preview-large {
  width: 640px;
  height: 360px;
  border-radius: 10px;
}

.preview-empty {
  color: var(--el-text-color-secondary);
}
</style>
