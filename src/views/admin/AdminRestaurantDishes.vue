<template>
  <div class="admin-restaurant-dishes">
    <el-card class="block" shadow="never">
      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="菜品名称">
          <el-input v-model="query.name" placeholder="菜品名称" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="所属餐厅">
          <el-select v-model="query.restaurantId" placeholder="全部" clearable filterable style="width: 140px">
            <el-option v-for="r in restaurants" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="菜品分类">
          <el-select v-model="query.categoryId" placeholder="全部" clearable filterable style="width: 110px">
            <el-option v-for="c in dishCategories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="推荐">
          <el-select v-model="query.isRecommended" placeholder="全部" clearable style="width: 100px">
            <el-option label="推荐" :value="1" />
            <el-option label="不推荐" :value="0" />
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
      <div class="action-row">
        <el-button type="primary" @click="onAdd">添加菜品</el-button>
        <el-button type="danger" :disabled="!singleDeletable" @click="onDelete(selectedRows[0])">删除</el-button>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="onBatchDelete">批量删除</el-button>
      </div>
    </el-card>

    <el-card class="block" shadow="never">
      <div class="table-wrap">
        <el-table :data="list" border style="width: 100%" v-loading="loading" @selection-change="onSelectionChange" @sort-change="onSortChange">
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
import { ref, reactive, computed, nextTick, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Close } from '@element-plus/icons-vue'
import {
  fetchAdminRestaurantsPage,
  fetchDishCategoriesPage,
  fetchRestaurantDishesPage,
  createRestaurantDish,
  updateRestaurantDish,
  deleteRestaurantDish,
  uploadSingleImage,
} from '@/api'
import { processImageData } from '@/utils/imageUtils'

const restaurants = ref([])

const dishCategories = ref([])

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
  name: '',
  restaurantId: undefined,
  categoryId: undefined,
  isRecommended: undefined,
  createRange: [],
})

const page = reactive({ current: 1, size: 10 })
const loading = ref(false)

const sort = reactive({ field: '', direction: 'DESC' })

const 最短刷新毫秒 = 600
const 分页保护毫秒 = 600
let 刷新序号 = 0
let 分页保护定时器 = null
let 上次分页触发时间 = 0

const allRawList = ref([])
const allModeReady = ref(false)

const rawList = ref([])
const list = computed(() => {
  const rMap = restaurantNameMap.value
  const cMap = categoryNameMap.value
  return (rawList.value || []).map(r => ({
    ...r,
    restaurantName: rMap.get(r.restaurantId) || '',
    categoryName: cMap.get(r.categoryId) || '',
  }))
})
const total = ref(0)

const selectedRows = ref([])
const onSelectionChange = (rows) => { selectedRows.value = rows }
const singleDeletable = computed(() => selectedRows.value.length === 1)

const dialog = reactive({ visible: false, mode: 'create' })
const formRef = ref()
const fileInputRef = ref()
const preview = reactive({ visible: false })
const imageState = reactive({ file: null, previewUrl: '' })
const imagePreviewUrl = computed(() => {
  if (imageState.previewUrl) {
    return imageState.previewUrl
  }
  if (form.imageUrl) {
    // 处理图片路径，确保正确的URL格式
    const processed = processImageData({ coverImage: form.imageUrl })
    return processed.coverUrl
  }
  return ''
})
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
  refreshView()
}

function onReset() {
  query.name = ''
  query.restaurantId = undefined
  query.categoryId = undefined
  query.isRecommended = undefined
  query.createRange = []
  page.current = 1
  refreshView()
}

function onSizeChange(sz) {
  page.size = sz
  page.current = 1
  请求分页刷新()
}

function onPageChange(p) {
  page.current = p
  请求分页刷新()
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
  imageState.file = null
  imageState.previewUrl = ''
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
  e.target.value = ''
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
    categoryId: query.categoryId,
    name: (query.name || '').trim() || undefined,
    isRecommended: query.isRecommended,
    createTimeStart,
    createTimeEnd,
  }
  return {
    pageNum: page.current,
    pageSize: page.size,
    sortField: sort.field,
    sortDirection: sort.field ? sort.direction : undefined,
    query: q,
  }
}

function onSortChange({ prop, order }) {
  if (!order) {
    sort.field = ''
    sort.direction = 'DESC'
  } else {
    sort.field = prop || ''
    if (order === 'ascending') sort.direction = 'ASC'
    else sort.direction = 'DESC'
  }
  page.current = 1
  refreshView()
}

function 延时(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function 请求分页刷新() {
  const 当前时间 = Date.now()
  const 已过时间 = 当前时间 - 上次分页触发时间
  if (!loading.value && 已过时间 >= 分页保护毫秒) {
    上次分页触发时间 = 当前时间
    refreshView()
    return
  }
  if (分页保护定时器) clearTimeout(分页保护定时器)
  分页保护定时器 = setTimeout(() => {
    上次分页触发时间 = Date.now()
    refreshView()
  }, Math.max(分页保护毫秒 - 已过时间, 0))
}

async function loadRestaurants() {
  try {
    const data = await fetchAdminRestaurantsPage({
      pageNum: 1,
      pageSize: 200,
      sortField: 'name',
      sortDirection: 'ASC',
      query: {},
    })
    restaurants.value = data?.list || data?.records || []
  } catch (e) {
    restaurants.value = []
  }
}

async function loadDishCategories() {
  try {
    const data = await fetchDishCategoriesPage({
      pageNum: 1,
      pageSize: 200,
      sortField: 'sortOrder',
      sortDirection: 'ASC',
      query: {},
    })
    dishCategories.value = data?.list || data?.records || []
  } catch (e) {
    dishCategories.value = []
  }
}

function getDatePart(val) {
  if (!val) return ''
  return String(val).slice(0, 10)
}

function compareMaybe(a, b) {
  if (a == null && b == null) return 0
  if (a == null) return -1
  if (b == null) return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b))
}

function applyAllMode() {
  const keyword = String(query.name || '').trim().toLowerCase()
  const categoryId = query.categoryId
  const isRecommended = query.isRecommended
  const range = getCreateTimeRange()
  const start = range.createTimeStart
  const end = range.createTimeEnd

  let rows = allRawList.value.slice()

  if (keyword) {
    rows = rows.filter(r => String(r.name || '').toLowerCase().includes(keyword))
  }
  if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
    rows = rows.filter(r => r.categoryId === categoryId)
  }
  if (isRecommended !== undefined && isRecommended !== null && isRecommended !== '') {
    rows = rows.filter(r => r.isRecommended === isRecommended)
  }
  if (start || end) {
    rows = rows.filter(r => {
      const d = getDatePart(r.createTime)
      if (!d) return false
      if (start && d < start) return false
      if (end && d > end) return false
      return true
    })
  }

  if (sort.field) {
    const dir = sort.direction === 'ASC' ? 1 : -1
    const field = sort.field
    rows.sort((ra, rb) => compareMaybe(ra?.[field], rb?.[field]) * dir)
  }

  total.value = rows.length
  const startIdx = (page.current - 1) * page.size
  const endIdx = startIdx + page.size
  rawList.value = rows.slice(startIdx, endIdx)
}

async function ensureAllFetched(force = false) {
  if (!force && allModeReady.value) return
  if (restaurants.value.length === 0) {
    await loadRestaurants()
  }
  if (restaurants.value.length === 0) {
    allRawList.value = []
    allModeReady.value = true
    return
  }
  const payload = {
    pageNum: 1,
    pageSize: 200,
    sortField: sort.field,
    sortDirection: sort.direction,
    query: {},
  }

  const tasks = restaurants.value.map(r => fetchRestaurantDishesPage(r.id, payload))
  const results = await Promise.allSettled(tasks)
  const merged = []
  for (const res of results) {
    if (res.status !== 'fulfilled') continue
    const data = res.value
    const rows = data?.list || data?.records || []
    merged.push(...rows)
  }
  allRawList.value = merged
  allModeReady.value = true
}

async function loadData() {
  try {
    const payload = buildPagePayload()
    const data = await fetchRestaurantDishesPage(query.restaurantId, payload)
    rawList.value = data?.list || data?.records || []
    total.value = data?.total ?? data?.totalRecords ?? 0
  } catch (e) {
    rawList.value = []
    total.value = 0
    ElMessage.error(e.message || '加载失败')
  } finally {}
}

async function refreshView() {
  const 当前序号 = ++刷新序号
  const 开始时间 = Date.now()
  loading.value = true
  try {
    selectedRows.value = []
    if (query.restaurantId) {
      await loadData()
    } else {
      await ensureAllFetched(false)
      applyAllMode()
    }
  } finally {
    const 剩余时间 = 最短刷新毫秒 - (Date.now() - 开始时间)
    if (剩余时间 > 0) await 延时(剩余时间)
    if (当前序号 === 刷新序号) loading.value = false
  }
}

async function resolveSubmitImageUrl() {
  if (imageState.file) {
    const urls = await uploadSingleImage(imageState.file)
    const url = Array.isArray(urls) ? urls[0] : urls
    if (!url) throw new Error('图片上传失败')
    return url
  }
  return form.imageUrl || ''
}

async function onSubmitCreate() {
  try {
    await formRef.value?.validate()
    if (!imageState.file && !form.imageUrl) {
      ElMessage.warning('请上传菜品图片')
      return
    }
    const imageUrl = await resolveSubmitImageUrl()
    const payload = {
      categoryId: form.categoryId,
      name: form.name,
      description: form.description,
      price: Number(form.price),
      imageUrl,
      isRecommended: form.isRecommended,
      sortOrder: Number(form.sortOrder),
    }
    await createRestaurantDish(form.restaurantId, payload)
    ElMessage.success('新增成功')
    dialog.visible = false
    allModeReady.value = false
    refreshView()
  } catch (_) {}
}

async function onSubmitEdit() {
  try {
    await formRef.value?.validate()
    if (!imageState.file && !form.imageUrl) {
      ElMessage.warning('请上传菜品图片')
      return
    }
    const imageUrl = await resolveSubmitImageUrl()
    const payload = {
      categoryId: form.categoryId,
      name: form.name,
      description: form.description,
      price: Number(form.price),
      imageUrl,
      isRecommended: form.isRecommended,
      sortOrder: Number(form.sortOrder),
    }
    await updateRestaurantDish(form.restaurantId, form.id, payload)
    ElMessage.success('保存成功')
    dialog.visible = false
    allModeReady.value = false
    refreshView()
  } catch (_) {}
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除「${row.name}」？`, '提示', { type: 'warning' })
    const restaurantId = row.restaurantId || query.restaurantId
    if (!restaurantId) return
    await deleteRestaurantDish(restaurantId, row.id)
    ElMessage.success('删除成功')
    selectedRows.value = selectedRows.value.filter(r => r.id !== row.id)
    if (page.current > 1 && rawList.value.length === 1) page.current -= 1
    allModeReady.value = false
    refreshView()
  } catch (_) {}
}

async function onBatchDelete() {
  const rows = selectedRows.value.slice()
  if (rows.length === 0) return
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${rows.length} 条记录？`, '提示', { type: 'warning' })
    for (const r of rows) {
      const restaurantId = r.restaurantId || query.restaurantId
      if (!restaurantId) continue
      await deleteRestaurantDish(restaurantId, r.id)
    }
    selectedRows.value = []
    ElMessage.success('批量删除成功')
    if (page.current > 1 && rawList.value.length === rows.length) page.current -= 1
    allModeReady.value = false
    refreshView()
  } catch (_) {}
}

watch(
  () => query.restaurantId,
  () => {
    page.current = 1
    refreshView()
  }
)

onMounted(async () => {
  await Promise.all([loadRestaurants(), loadDishCategories()])
  allModeReady.value = false
  refreshView()
})
</script>

<style scoped>
.admin-restaurant-dishes {
  padding: 16px;
}

.block {
  margin-bottom: 12px;
}

.search-form .el-form-item {
  margin-right: 16px;
  margin-bottom: 12px;
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
