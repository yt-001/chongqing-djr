<template>
  <div class="admin-accommodations">
    <!-- 顶部：搜索栏 -->
    <el-card class="block" shadow="never">
      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="关键词" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="住宿名称">
          <el-input v-model="query.name" placeholder="住宿名称" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="地理位置">
          <el-input v-model="query.location" placeholder="地理位置" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="住宿类型">
          <el-select v-model="query.typeId" placeholder="住宿类型" clearable style="width: 120px">
            <el-option v-for="t in accommodationTypeOptions" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker v-model="query.createTime" type="date" value-format="YYYY-MM-DD" placeholder="创建时间" style="width: 140px" />
        </el-form-item>
        <el-form-item label="更新时间">
          <el-date-picker v-model="query.updateTime" type="date" value-format="YYYY-MM-DD" placeholder="更新时间" style="width: 140px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">搜索</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 中部：操作按钮 -->
    <el-card class="block" shadow="never">
      <div class="action-row">
        <el-button type="primary" @click="onAdd">添加住宿</el-button>
        <el-button type="danger" :disabled="!singleDeletable" @click="onDelete(selectedRows[0])">删除</el-button>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="onBatchDelete">批量删除</el-button>
      </div>
    </el-card>

    <!-- 表格 + 分页 -->
    <el-card class="block" shadow="never">
      <div class="table-wrap">
        <el-table :data="list" border style="width: 100%" v-loading="loading" @selection-change="onSelectionChange">
          <el-table-column type="selection" width="48" fixed="left" />
          <el-table-column prop="id" label="编号" width="100" sortable="custom" />
          <el-table-column prop="name" label="住宿名称" min-width="200" show-overflow-tooltip />
          <el-table-column label="类型" width="120">
            <template #default="{ row }">{{ getAccommodationTypeText(row) }}</template>
          </el-table-column>
          <el-table-column prop="location" label="地理位置" min-width="180" show-overflow-tooltip />
          <el-table-column prop="pricePerNight" label="每晚价格" width="120" />
          <el-table-column prop="capacity" label="可容纳人数" width="120" />
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
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="total" :current-page="page.current" :page-size="page.size" :page-sizes="[10,20,50]" @size-change="onSizeChange" @current-change="onPageChange" />
      </div>
    </el-card>

    <!-- 复用弹窗：新增 / 查看详情 -->
    <el-dialog v-model="dialog.visible" :title="dialogTitle" width="760px" append-to-body @closed="onDialogClosed">
      <div class="dialog-body" v-loading="detailLoading">
        <el-form :key="dialogKey" ref="formRef" :model="form" :rules="rules" :disabled="dialog.mode === 'view'" label-width="96px" class="dialog-form">
          <!-- 第一行：名称（2列）+ 类型（1列） -->
          <div class="row row-3">
            <el-form-item label="住宿名称" class="col col-2" prop="name" required>
              <el-input v-model="form.name" placeholder="请输入住宿名称" />
            </el-form-item>
            <el-form-item label="类型" class="col col-1" prop="typeId" required>
              <el-select v-model="form.typeId" placeholder="请选择类型">
                <el-option v-for="t in accommodationTypeOptions" :key="t.id" :label="t.name" :value="t.id" />
              </el-select>
            </el-form-item>
          </div>

          <!-- 第二行：地理位置 + 每晚价格 + 可容纳人数 -->
          <div class="row row-3">
            <el-form-item label="地理位置" class="col col-1" prop="location" required>
              <el-input v-model="form.location" placeholder="请输入地理位置" />
            </el-form-item>
            <el-form-item label="每晚价格" class="col col-1" prop="pricePerNight" required>
              <el-input v-model="form.pricePerNight" placeholder="请输入每晚价格" />
            </el-form-item>
            <el-form-item label="可容纳人数" class="col col-1" prop="capacity" required>
              <el-input-number v-model="form.capacity" :min="1" :max="1000" placeholder="请输入可容纳人数" />
            </el-form-item>
          </div>

          <!-- 第三行：纬度 + 经度 + 联系电话 -->
          <div class="row row-3">
            <el-form-item label="纬度" class="col col-1" prop="latitude">
              <el-input v-model="form.latitude" placeholder="请输入纬度" />
            </el-form-item>
            <el-form-item label="经度" class="col col-1" prop="longitude">
              <el-input v-model="form.longitude" placeholder="请输入经度" />
            </el-form-item>
            <el-form-item label="联系电话" class="col col-1" prop="contactPhone" required>
              <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </div>

          <!-- 第四行：设施 -->
          <div class="row row-3">
            <el-form-item label="设施" class="col col-3" prop="facilities">
              <el-input v-model="form.facilities" type="textarea" :rows="2" placeholder="请输入设施信息" />
            </el-form-item>
          </div>

          <!-- 第四行 + 时间行 与 图片预览分栏布局：左侧表单，右侧独立图片区域 -->
          <div class="layout-2-1">
            <div class="layout-left">
              <div class="row row-2">
                <el-form-item label="描述" class="col col-2 desc-left" prop="description" required>
                  <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入描述" class="desc-textarea" />
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
              <!-- 新增/编辑/查看：统一显示样式，始终保持固定尺寸 -->
              <div v-if="dialog.mode !== 'view'" class="image-aside" :title="coverUrl ? '点击预览图片' : '点击上传图片'" @click="coverUrl ? openPreview() : triggerUpload()">
                <el-image v-if="coverUrl" :src="coverUrl" fit="cover" class="cover" />
                <div v-else class="cover placeholder">点击上传图片</div>
                <div v-if="uploadedCount > 0" class="badge">+{{ uploadedCount }}</div>
                <!-- 有图片时显示清除按钮 -->
                <div v-if="coverUrl || uploadedCount > 0" class="clear-btn" @click.stop="clearImages">
                  <el-icon class="clear-icon"><Close /></el-icon>
                </div>
                <!-- 隐藏的上传组件 -->
                <input ref="fileInputRef" type="file" multiple accept="image/*" style="display: none" @change="onFileInputChange">
              </div>
              <div v-else class="image-aside" @click="openPreview" title="点击预览全部图片">
                <el-image v-if="coverUrl" :src="coverUrl" fit="cover" class="cover" />
                <div v-else class="cover placeholder">无封面</div>
                <div v-if="imagesCount > 0" class="badge">+{{ imagesCount }}</div>
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

    <!-- 图片轮播预览弹窗 -->
    <el-dialog v-model="preview.visible" title="图片预览" width="800px" append-to-body>
      <div class="preview-body">
        <el-carousel height="420px" trigger="click" :autoplay="false" indicator-position="outside">
          <el-carousel-item v-for="(img, idx) in previewImages" :key="idx">
            <el-image :src="img" fit="contain" class="preview-image" />
          </el-carousel-item>
        </el-carousel>
      </div>
      <template #footer>
        <el-button type="primary" @click="preview.visible=false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
// 住宿管理（管理端）
import { ref, reactive, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { View, Close } from '@element-plus/icons-vue'
import { fetchAdminAccommodationsPage, fetchAdminAccommodationById, createAdminAccommodation, updateAdminAccommodation, deleteAdminAccommodation, fetchAccommodationTypesPage } from '@/api'
import { uploadMultipleImages } from '@/api/modules/upload'
import { processImageData, formatImageDataForSubmit } from '@/utils/imageUtils'

// 搜索条件
const query = reactive({ keyword: '', createTime: '', updateTime: '', name: '', location: '', typeId: null })

// 分页/排序
const page = reactive({ current: 1, size: 10 })
const sort = reactive({ field: '', direction: 'DESC' })

// 列表
const loading = ref(false)
const list = ref([])
const total = ref(0)

const accommodationTypeOptions = ref([])
const accommodationTypeNameById = computed(() => {
  const map = new Map()
  for (const item of accommodationTypeOptions.value) {
    if (item?.id !== undefined && item?.id !== null) {
      map.set(item.id, item?.name || '')
    }
  }
  return map
})

function getAccommodationTypeText(row) {
  const name = row?.typeName
  if (name) return name
  const id = row?.typeId ?? row?.type_id ?? row?.type
  if (id === undefined || id === null || id === '') return ''
  const resolved = accommodationTypeNameById.value.get(id)
  if (resolved) return resolved
  if (typeof id === 'string') return id
  return ''
}

// 弹窗/表单
const dialog = reactive({ visible: false, mode: 'create' }) // 'create' | 'view' | 'edit'
const detailLoading = ref(false)
let detailSeq = 0
const dialogKey = ref(0)
const formRef = ref()
const fileInputRef = ref()
const originalForm = ref(null)

// 校验规则
const rules = {
  name: [{ required: true, message: '请输入住宿名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  typeId: [{ required: true, message: '请选择住宿类型', trigger: 'change' }],
  location: [{ required: true, message: '请输入地理位置', trigger: 'blur' }],
  latitude: [
    { validator: validateNumber('纬度'), trigger: 'blur' }
  ],
  longitude: [
    { validator: validateNumber('经度'), trigger: 'blur' }
  ],
  pricePerNight: [{ required: true, message: '请输入每晚价格', trigger: 'blur' }],
  capacity: [{ required: true, message: '请输入可容纳人数', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { validator: validatePhone, trigger: 'blur' }
  ],
}

// 表单模型
const form = reactive({
  id: '',
  name: '',
  description: '',
  typeId: null,
  location: '',
  latitude: '',
  longitude: '',
  pricePerNight: '',
  capacity: null,
  facilities: '',
  contactPhone: '',
  coverImage: '',
  images: '',
  createTime: '',
  updateTime: ''
})

const dialogTitle = computed(() => {
  if (dialog.mode === 'create') return '新增住宿'
  if (dialog.mode === 'edit') return '编辑住宿'
  return '住宿详情'
})

// 简化的图片管理
const currentImageData = ref({
  files: [],
  coverUrl: '',
  imageUrls: []
})

// 简化的计算属性
const coverUrl = computed(() => currentImageData.value.coverUrl)
const imageList = computed(() => currentImageData.value.imageUrls)
const imagesCount = computed(() => Math.max(0, currentImageData.value.imageUrls.length - 1))
const uploadedCount = computed(() => Math.max(0, currentImageData.value.imageUrls.length - 1))

const previewImages = computed(() => {
  const allUrls = []
  if (currentImageData.value.coverUrl) {
    allUrls.push(currentImageData.value.coverUrl)
  }
  allUrls.push(...currentImageData.value.imageUrls.filter(url => url !== currentImageData.value.coverUrl))
  return [...new Set(allUrls)]
})

function openPreview() {
  // 点击右侧预览区域打开轮播
  if (previewImages.value.length === 0) return
  preview.visible = true
}

function triggerUpload() {
  // 直接触发原生文件选择器
  fileInputRef.value?.click()
}

// 二级弹窗：轮播预览状态
const preview = reactive({ visible: false })

// 选择集
const selectedRows = ref([])
const onSelectionChange = (rows) => { selectedRows.value = rows }
const singleDeletable = computed(() => selectedRows.value.length === 1)

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

// 拉取列表
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
      sortField: sort.field,
      sortDirection: sort.direction,
      query: { ...query }
    }
    const data = await fetchAdminAccommodationsPage(payload)
    list.value = data?.list || data?.records || []
    total.value = data?.total ?? data?.totalRecords ?? 0
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

function onSearch() { page.current = 1; loadData() }
function onReset() { query.keyword='';query.createTime='';query.updateTime='';query.name='';query.location='';query.typeId=null;page.current=1;loadData() }
function onSizeChange(sz) { page.size = sz; page.current = 1; requestPageLoad() }
function onPageChange(p) { page.current = p; requestPageLoad() }

function resetForm() {
  // 清理图片数据
  clearImageData()
  
  // 重置表单
  form.id = ''
  form.name = ''
  form.description = ''
  form.typeId = null
  form.location = ''
  form.latitude = ''
  form.longitude = ''
  form.pricePerNight = ''
  form.capacity = null
  form.facilities = ''
  form.contactPhone = ''
  form.coverImage = ''
  form.images = ''
  form.createTime = ''
  form.updateTime = ''
}

// 清理图片数据的独立函数
function clearImageData() {
  // 清理blob URLs
  currentImageData.value.files.forEach(file => {
    if (file.blobUrl) {
      URL.revokeObjectURL(file.blobUrl)
    }
  })
  
  // 重置图片数据
  currentImageData.value = {
    files: [],
    coverUrl: '',
    imageUrls: []
  }
  
  // 同步到表单
  form.coverImage = ''
  form.images = JSON.stringify([])
}

function onAdd() {
  dialog.mode = 'create'
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
    const data = await fetchAdminAccommodationById(row.id)
    if (seq !== detailSeq || dialog.mode !== 'view') return
    
    // 填充表单数据
    form.id = data?.id ?? row.id
    form.name = data?.name ?? ''
    form.description = data?.description ?? ''
    form.typeId = normalizeTypeId(data)
    form.location = data?.location ?? ''
    form.latitude = data?.latitude ?? ''
    form.longitude = data?.longitude ?? ''
    form.pricePerNight = data?.pricePerNight ?? ''
    form.capacity = data?.capacity ?? null
    form.facilities = data?.facilities ?? ''
    form.contactPhone = data?.contactPhone ?? ''
    form.coverImage = data?.coverImage ?? ''
    form.images = data?.images ?? ''
    form.createTime = data?.createTime ?? ''
    form.updateTime = data?.updateTime ?? ''

    // 加载图片数据到显示状态
    loadImageData()
    
    originalForm.value = { ...form }
  } catch (e) {
    if (seq === detailSeq && dialog.mode === 'view') {
      ElMessage.error(e.message || '查询详情失败')
    }
  } finally {
    if (seq === detailSeq) detailLoading.value = false
  }
}

function onEdit() { dialog.mode = 'edit'; nextTick(() => formRef.value?.clearValidate()) }

function onDialogClosed() {
  detailSeq++
  clearImageData()
  resetForm()
  originalForm.value = null
  detailLoading.value = false
  dialogKey.value++
}

// 从表单数据加载图片到显示状态
function loadImageData() {
  // 使用工具类处理图片数据
  const processedData = processImageData({
    coverImage: form.coverImage,
    images: form.images
  })
  
  // 设置到当前图片数据
  currentImageData.value = {
    files: [],
    coverUrl: processedData.coverUrl,
    imageUrls: processedData.coverUrl ? [processedData.coverUrl, ...processedData.imageUrls] : processedData.imageUrls
  }
}

function buildDiffPayload() {
  if (!originalForm.value) {
    return {
      id: form.id,
      name: form.name,
      description: form.description,
      typeId: form.typeId,
      location: form.location,
      latitude: form.latitude,
      longitude: form.longitude,
      pricePerNight: form.pricePerNight,
      capacity: form.capacity,
      facilities: form.facilities,
      contactPhone: form.contactPhone,
      coverImage: form.coverImage,
      images: form.images,
    }
  }
  const editable = ['name','description','typeId','location','latitude','longitude','pricePerNight','capacity','facilities','contactPhone','coverImage','images']
  const diff = { id: form.id }
  let changed = false
  for (const k of editable) {
    if (form[k] !== originalForm.value[k]) { diff[k] = form[k]; changed = true }
  }
  return changed ? diff : null
}

function onSubmitEdit() {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    try {
      // 先上传图片（如果有新选择的）
      if (currentImageData.value.files.length > 0) {
        const files = currentImageData.value.files.map(item => item.file)
        const uploadedUrls = await uploadMultipleImages(files)
        
        // 使用工具类格式化图片数据
        const formattedData = formatImageDataForSubmit(uploadedUrls)
        form.coverImage = formattedData.coverImage
        form.images = formattedData.images
      }
      
      const diff = buildDiffPayload()
      if (!diff) { ElMessage.warning('未修改任何内容'); return }
      await updateAdminAccommodation(diff)
      ElMessage.success('修改成功')
      dialog.visible = false
      loadData()
    } catch (e) { ElMessage.error(e.message || '修改失败') }
  })
}

function onSubmitCreate() {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    try {
      // 先上传图片（如果有新选择的）
      if (currentImageData.value.files.length > 0) {
        const files = currentImageData.value.files.map(item => item.file)
        const uploadedUrls = await uploadMultipleImages(files)
        
        // 使用工具类格式化图片数据
        const formattedData = formatImageDataForSubmit(uploadedUrls)
        form.coverImage = formattedData.coverImage
        form.images = formattedData.images
      }
      
      const payload = {
        name: form.name,
        description: form.description,
        typeId: form.typeId,
        location: form.location,
        latitude: form.latitude,
        longitude: form.longitude,
        pricePerNight: form.pricePerNight,
        capacity: form.capacity,
        facilities: form.facilities,
        contactPhone: form.contactPhone,
        coverImage: form.coverImage,
        images: form.images,
      }
      await createAdminAccommodation(payload)
      ElMessage.success('新增成功')
      dialog.visible = false
      loadData()
    } catch (e) { ElMessage.error(e.message || '新增失败') }
  })
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除住宿：${row.name}？`, '提示', { type: 'warning' })
    await deleteAdminAccommodation(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch {}
}

async function onBatchDelete() {
  try {
    await ElMessageBox.confirm(`确认批量删除 ${selectedRows.value.length} 条记录？`, '提示', { type: 'warning' })
    for (const item of selectedRows.value) { await deleteAdminAccommodation(item.id) }
    ElMessage.success('批量删除成功')
    selectedRows.value = []
    loadData()
  } catch {}
}

function validatePhone(_r, v, cb) {
  if (!v) return cb()
  const ok = /^\+?\d[\d\-\s]{5,}$/.test(v)
  if (!ok) return cb(new Error('联系电话格式不正确'))
  cb()
}

function validateNumber(fieldName) {
  return (_r, v, cb) => {
    if (!v) return cb()
    const num = parseFloat(v)
    if (isNaN(num)) {
      return cb(new Error(`${fieldName}必须是数字`))
    }
    if (fieldName === '纬度' && (num < -90 || num > 90)) {
      return cb(new Error('纬度范围：-90到90'))
    }
    if (fieldName === '经度' && (num < -180 || num > 180)) {
      return cb(new Error('经度范围：-180到180'))
    }
    cb()
  }
}

function onFileInputChange(event) {
  const files = Array.from(event.target.files || [])
  
  if (files.length === 0) {
    return
  }
  
  // 清理之前的blob URLs
  currentImageData.value.files.forEach(oldFile => {
    if (oldFile.blobUrl) {
      URL.revokeObjectURL(oldFile.blobUrl)
    }
  })
  
  // 处理新文件 - 只创建预览，不上传
  const urls = files.map(file => {
    const blobUrl = URL.createObjectURL(file)
    return { file, blobUrl }
  })
  
  // 更新显示数据（仅预览）
  currentImageData.value = {
    files: urls,
    coverUrl: urls[0]?.blobUrl || '',
    imageUrls: urls.map(item => item.blobUrl)
  }
  
  // 暂时不上传图片，等保存时再处理
  // form.coverImage 和 form.images 将在保存时设置
  
  // 清空input的值，确保下次选择同一文件时能触发change事件
  event.target.value = ''
}

// 上传图片到服务器
async function uploadFiles(files) {
  try {
    const uploadedUrls = await uploadMultipleImages(files)
    
    // 使用工具类格式化图片数据
    const formattedData = formatImageDataForSubmit(uploadedUrls)
    form.coverImage = formattedData.coverImage
    form.images = formattedData.images
    
    // 更新预览显示
    const processedData = processImageData({
      coverImage: form.coverImage,
      images: form.images
    })
    
    currentImageData.value = {
      files: [],
      coverUrl: processedData.coverUrl,
      imageUrls: processedData.coverUrl ? [processedData.coverUrl, ...processedData.imageUrls] : processedData.imageUrls
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    ElMessage.error('图片上传失败')
  }
}

function clearImages() {
  clearImageData()
}

function normalizeTypeId(data) {
  const raw = data?.typeId ?? data?.type_id ?? data?.type
  if (raw === undefined || raw === null || raw === '') return null
  if (typeof raw === 'number') return raw
  const asNumber = Number(raw)
  if (!Number.isNaN(asNumber) && String(asNumber) === String(raw).trim()) return asNumber
  const name = data?.typeName ?? (typeof raw === 'string' ? raw : '')
  if (!name) return null
  const hit = accommodationTypeOptions.value.find(t => t?.name === name)
  return hit?.id ?? null
}

async function loadAccommodationTypeOptions() {
  try {
    const data = await fetchAccommodationTypesPage({ pageNum: 1, pageSize: 1000, query: {} })
    accommodationTypeOptions.value = data?.list || data?.records || []
  } catch {
    accommodationTypeOptions.value = []
  }
}

// 首次加载
async function init() {
  await loadAccommodationTypeOptions()
  loadData()
}
init()
</script>

<style scoped>
.search-form .el-form-item {
  margin-right: 16px;
  margin-bottom: 12px;
}

.admin-accommodations .block { margin-bottom: 16px; }
.action-row { display: flex; gap: 8px; }
.table-wrap { width: 100%; overflow-x: auto; }
.pager { display: flex; justify-content: flex-end; margin-top: 12px; }

.dialog-form { width: 100%; }
.dialog-form .row { display: grid; gap: 16px; margin-bottom: 14px; }
.dialog-form .row-3 { grid-template-columns: repeat(3, 1fr); }
.dialog-form .row-2 { grid-template-columns: repeat(2, 1fr); }
.dialog-form .col-2 { grid-column: span 2; }
.dialog-form .col-3 { grid-column: span 3; }
.dialog-form .col-1 { grid-column: span 1; }
.dialog-form :deep(.el-form-item) { margin-bottom: 0; align-items: center; }
.dialog-form :deep(.el-form-item__label) { align-self: start; padding-top: 4px; }
.desc-textarea :deep(textarea) { text-align: justify; }

.dialog-body { padding: 8px 14px 6px; overflow: visible; }
.dialog-form :deep(.el-form-item__error) { position: static; margin-top: 4px; line-height: 1.2; white-space: normal; }
.dialog-form :deep(.el-form-item__content) { padding-bottom: 4px; }
/* 保证数字输入组件在网格中占满列宽，避免布局断裂 */
.dialog-form :deep(.el-input-number) { width: 100%; }

/* 新布局：左表单 + 右图片侧栏（占位与高度自适应） */
.layout-2-1 { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; align-items: start; }
.layout-left { display: block; }
.layout-right { display: block; }
@media (max-width: 1023px) { .layout-2-1 { grid-template-columns: 1fr; } }

/* 让左右区块之间以及与下方"描述"保持合理间距 */
.layout-2-1 + .row { margin-top: 12px; }

@media (max-width: 1023px) { .dialog-form .row-3 { grid-template-columns: 1fr; } .dialog-form .col-2, .dialog-form .col-3, .dialog-form .col-1 { grid-column: span 1; } }

/* 图片预览区域样式（独立侧栏尺寸更大一些） */
.image-aside { position: relative; width: 100%; height: 180px; border: 1px dashed var(--el-border-color); border-radius: 6px; display: flex; align-items: center; justify-content: center; background: #fafafa; overflow: hidden; margin-top: 8px; margin-right: 2px; cursor: pointer; }
.image-aside:hover { border-color: var(--el-color-primary); }
.image-aside .cover { width: 100%; height: 100%; object-fit: cover; }
.image-aside .placeholder { color: #999; font-size: 14px; }
.image-aside .badge { position: absolute; top: 4px; right: 4px; background: var(--el-color-danger); color: white; border-radius: 10px; padding: 2px 6px; font-size: 12px; line-height: 1; }
.image-aside .clear-btn { position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; background: rgba(0,0,0,0.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; transition: opacity 0.2s; }
.image-aside:hover .clear-btn { opacity: 1; }
.image-aside .clear-icon { color: white; font-size: 12px; }

/* 预览轮播样式 */
.preview-body { padding: 4px; }
/* 让轮播组件占满弹窗宽度，避免内容区域过窄 */
.preview-body :deep(.el-carousel) { width: 100%; }
.preview-image { width: 100%; height: 100%; }
</style>
