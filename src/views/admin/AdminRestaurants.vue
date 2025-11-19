<template>
  <div class="admin-restaurants">
    <!-- 顶部：搜索栏 -->
    <el-card class="block" shadow="never">
      <div class="search-row">
        <el-input v-model="query.keyword" placeholder="关键词" clearable />
        <el-input v-model="query.name" placeholder="餐厅名称" clearable />
        <el-input v-model="query.location" placeholder="地理位置" clearable />
        <el-date-picker v-model="query.createTime" type="date" value-format="YYYY-MM-DD" placeholder="创建时间" />
        <el-date-picker v-model="query.updateTime" type="date" value-format="YYYY-MM-DD" placeholder="更新时间" />
        <el-button type="primary" @click="onSearch">搜索</el-button>
        <el-button @click="onReset">重置</el-button>
      </div>
    </el-card>

    <!-- 中部：操作按钮 -->
    <el-card class="block" shadow="never">
      <div class="action-row">
        <el-button type="primary" @click="onAdd">添加餐厅</el-button>
        <el-button type="danger" :disabled="!singleDeletable" @click="onDelete(selectedRows[0])">删除</el-button>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="onBatchDelete">批量删除</el-button>
      </div>
    </el-card>

    <!-- 表格 + 分页 -->
    <el-card class="block" shadow="never">
      <div class="table-wrap">
        <el-table :data="list" border style="width: 100%" :fit="false" v-loading="loading" @selection-change="onSelectionChange">
          <el-table-column type="selection" width="48" fixed="left" />
          <el-table-column prop="id" label="编号" width="100" sortable="custom" />
          <el-table-column prop="name" label="餐厅名称" min-width="200" show-overflow-tooltip />
          <el-table-column prop="description" label="描述" min-width="260" show-overflow-tooltip />
          <el-table-column prop="location" label="地理位置" min-width="180" show-overflow-tooltip />
          <el-table-column prop="openHours" label="营业时间" width="140" />
          <el-table-column prop="priceRange" label="价格区间" width="140" />
          <el-table-column prop="specialty" label="招牌菜" width="160" show-overflow-tooltip />
          <el-table-column prop="rating" label="推荐指数" width="120" />
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
          <!-- 第一行：名称（2列）+ 地理位置（1列） -->
          <div class="row row-3">
            <el-form-item label="餐厅名称" class="col col-2" prop="name" required>
              <el-input v-model="form.name" placeholder="请输入餐厅名称" />
            </el-form-item>
            <el-form-item label="地理位置" class="col col-1" prop="location" required>
              <el-input v-model="form.location" placeholder="请输入地理位置" />
            </el-form-item>
          </div>

          <!-- 第二行：营业时间、价格区间、招牌菜 -->
          <div class="row row-3">
            <el-form-item label="营业时间" class="col col-1" prop="openHours" required>
              <el-input v-model="form.openHours" placeholder="如：10:00-22:00" />
            </el-form-item>
            <el-form-item label="价格区间" class="col col-1" prop="priceRange" required>
              <el-input v-model="form.priceRange" placeholder="如：￥50-100" />
            </el-form-item>
            <el-form-item label="招牌菜" class="col col-1" prop="specialty" required>
              <el-input v-model="form.specialty" placeholder="请输入招牌菜" />
            </el-form-item>
          </div>

          <!-- 第三行 + 时间行 与 图片预览分栏布局：左侧表单，右侧独立图片区域 -->
          <div class="layout-2-1">
            <div class="layout-left">
              <div class="row row-2">
                <el-form-item label="联系电话" class="col col-1" prop="contactPhone" required>
                  <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
                </el-form-item>
                <el-form-item label="推荐指数" class="col col-1" prop="rating" required>
                  <el-input v-model="form.rating" placeholder="0-5" />
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
              <!-- 将描述移到左侧列，位于时间行下方，填充你标注的空白区域 -->
              <div class="row row-2">
                <el-form-item label="描述" class="col col-2 desc-left" prop="description" required>
                  <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入描述" class="desc-textarea" />
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
// 美食管理（管理端）
import { ref, reactive, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { View, Close } from '@element-plus/icons-vue'
import { fetchAdminRestaurantsPage, fetchAdminRestaurantById, createAdminRestaurant, updateAdminRestaurant, deleteAdminRestaurant } from '@/api'
import { uploadMultipleImages } from '@/api/modules/upload'
import { processImageData, formatImageDataForSubmit } from '@/utils/imageUtils'

// 搜索条件
const query = reactive({ keyword: '', createTime: '', updateTime: '', name: '', location: '' })

// 分页/排序
const page = reactive({ current: 1, size: 10 })
const sort = reactive({ field: '', direction: 'DESC' })

// 列表
const loading = ref(false)
const list = ref([])
const total = ref(0)

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
  name: [{ required: true, message: '请输入餐厅名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
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
  openHours: [{ required: true, message: '请输入营业时间', trigger: 'blur' }],
  priceRange: [{ required: true, message: '请输入价格区间', trigger: 'blur' }],
  specialty: [{ required: true, message: '请输入招牌菜', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { validator: validatePhone, trigger: 'blur' }
  ],
  rating: [
    { required: true, message: '请输入推荐指数', trigger: 'blur' },
    { validator: validateRating, trigger: 'blur' }
  ],
}

// 表单模型
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
  priceRange: '',
  specialty: '',
  contactPhone: '',
  rating: '',
  createTime: '',
  updateTime: ''
})

const dialogTitle = computed(() => {
  if (dialog.mode === 'create') return '新增餐厅'
  if (dialog.mode === 'edit') return '编辑餐厅'
  return '餐厅详情'
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

// 拉取列表
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
    const data = await fetchAdminRestaurantsPage(payload)
    list.value = data?.list || data?.records || []
    total.value = data?.total ?? data?.totalRecords ?? 0
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function onSearch() { page.current = 1; loadData() }
function onReset() { query.keyword='';query.createTime='';query.updateTime='';query.name='';query.location='';page.current=1;loadData() }
function onSizeChange(sz) { page.size = sz; page.current = 1; loadData() }
function onPageChange(p) { page.current = p; loadData() }

function resetForm() {
  // 清理图片数据
  clearImageData()
  
  // 重置表单
  form.id = ''
  form.name = ''
  form.description = ''
  form.location = ''
  form.latitude = ''
  form.longitude = ''
  form.coverImage = ''
  form.images = ''
  form.openHours = ''
  form.priceRange = ''
  form.specialty = ''
  form.contactPhone = ''
  form.rating = ''
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
    const data = await fetchAdminRestaurantById(row.id)
    if (seq !== detailSeq || dialog.mode !== 'view') return
    
    // 填充表单数据
    form.id = data?.id ?? row.id
    form.name = data?.name ?? ''
    form.description = data?.description ?? ''
    form.location = data?.location ?? ''
    form.latitude = data?.latitude ?? ''
    form.longitude = data?.longitude ?? ''
    form.coverImage = data?.coverImage ?? ''
    form.images = data?.images ?? ''
    form.openHours = data?.openHours ?? ''
    form.priceRange = data?.priceRange ?? ''
    form.specialty = data?.specialty ?? ''
    form.contactPhone = data?.contactPhone ?? ''
    form.rating = data?.rating ?? ''
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
      location: form.location,
      openHours: form.openHours,
      priceRange: form.priceRange,
      specialty: form.specialty,
      contactPhone: form.contactPhone,
      rating: form.rating,
    }
  }
  const editable = ['name','description','location','latitude','longitude','coverImage','images','openHours','priceRange','specialty','contactPhone','rating']
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
      await updateAdminRestaurant(diff)
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
        location: form.location,
        latitude: form.latitude,
        longitude: form.longitude,
        coverImage: form.coverImage,
        images: form.images,
        openHours: form.openHours,
        priceRange: form.priceRange,
        specialty: form.specialty,
        contactPhone: form.contactPhone,
        rating: form.rating,
      }
      await createAdminRestaurant(payload)
      ElMessage.success('新增成功')
      dialog.visible = false
      loadData()
    } catch (e) { ElMessage.error(e.message || '新增失败') }
  })
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除餐厅：${row.name}？`, '提示', { type: 'warning' })
    await deleteAdminRestaurant(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch {}
}

async function onBatchDelete() {
  try {
    await ElMessageBox.confirm(`确认批量删除 ${selectedRows.value.length} 条记录？`, '提示', { type: 'warning' })
    for (const item of selectedRows.value) { await deleteAdminRestaurant(item.id) }
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
function validateNumber(label) {
  return (_r, v, cb) => {
    if (v === '' || v === null || v === undefined) return cb()
    const num = Number(v)
    if (Number.isNaN(num)) return cb(new Error(`${label}必须为数字`))
    cb()
  }
}
function validateRating(_r, v, cb) {
  if (v === '' || v === null || v === undefined) return cb()
  const num = Number(v)
  if (Number.isNaN(num)) return cb(new Error('推荐指数必须为数字'))
  if (num < 0 || num > 5) return cb(new Error('推荐指数取值范围 0-5'))
  cb()
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



function clearImages() {
  clearImageData()
}

// 首次加载
loadData()
</script>

<style scoped>
.search-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.search-row :deep(.el-input),
.search-row :deep(.el-select),
.search-row :deep(.el-date-editor) { width: 240px; }

.admin-restaurants .block { margin-bottom: 16px; }
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

/* 新布局：左表单 + 右图片侧栏（占位与高度自适应） */
.layout-2-1 { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; align-items: start; }
.layout-left { display: block; }
.layout-right { display: block; }
@media (max-width: 1023px) { .layout-2-1 { grid-template-columns: 1fr; } }

/* 让左右区块之间以及与下方“描述”保持合理间距 */
.layout-2-1 + .row { margin-top: 12px; }

@media (max-width: 1023px) { .dialog-form .row-3 { grid-template-columns: 1fr; } .dialog-form .col-2, .dialog-form .col-3, .dialog-form .col-1 { grid-column: span 1; } }

/* 图片预览区域样式（独立侧栏尺寸更大一些） */
.image-aside { position: relative; width: 100%; height: 180px; border: 1px dashed var(--el-border-color); border-radius: 6px; display: flex; align-items: center; justify-content: center; background: #fafafa; overflow: hidden; margin-top: 8px; margin-right: 2px; cursor: pointer; }
.image-aside:hover { border-color: var(--el-color-primary); }
.image-aside.uploader { cursor: default; height: auto; padding: 8px; display: block; text-align: center; }
.uploader-title { font-size: 12px; color: #999; margin-bottom: 6px; }
.uploader-unified { margin-bottom: 6px; display: inline-block; }
.image-aside .cover { width: 100%; height: 100%; object-fit: cover; }
.image-aside .placeholder { width: 100%; height: 100%; color: #999; display: flex; align-items: center; justify-content: center; background: repeating-linear-gradient(45deg,#f5f5f5,#f5f5f5 10px,#ffffff 10px,#ffffff 20px); }
.image-aside .badge { position: absolute; right: 6px; bottom: 6px; background: rgba(0,0,0,.6); color: #fff; font-size: 12px; padding: 2px 6px; border-radius: 10px; }

/* 图片蒙版和查看图标 */
.image-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease; cursor: pointer; }
.image-aside:hover .image-overlay { opacity: 1; }
.preview-icon { color: #fff; font-size: 32px; }

/* 清除按钮样式 */
.clear-btn { position: absolute; top: 6px; right: 6px; width: 24px; height: 24px; background: rgba(220,53,69,0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; transition: all 0.3s ease; }
.clear-btn:hover { background: rgba(220,53,69,1); transform: scale(1.1); }
.clear-icon { color: #fff; font-size: 14px; }

/* 轮播预览样式 */
.preview-body { padding: 4px; }
.preview-image { width: 100%; height: 100%; }

/* 隐藏的上传组件 */
.hidden-upload { display: none; }

/* 右侧描述表单项样式，使其与图片宽度对齐 */
.desc-right { margin-top: 10px; }
.desc-right :deep(.el-textarea__inner) { min-height: 120px; }
/* 左侧描述（时间行下方，占满两列） */
.desc-left :deep(.el-textarea__inner) { min-height: 120px; }
</style>
