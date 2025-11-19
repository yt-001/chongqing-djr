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

    <!-- 底部：表格 + 分页（铺满父容器，"操作列"固定在最右） -->
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

          <!-- 第三四行与右侧图片预览改为分栏布局：左侧表单 + 右侧图片预览 -->
          <div class="layout-2-1">
            <div class="layout-left">
              <div class="row row-2">
                <el-form-item label="门票价格" class="col col-1" prop="ticketPrice" required>
                  <el-input v-model="form.ticketPrice" placeholder="请输入价格" />
                </el-form-item>
                <el-form-item label="开放时间" class="col col-1" prop="openHours" required>
                  <el-input v-model="form.openHours" placeholder="如：9:00-18:00" />
                </el-form-item>
                <div class="col col-1" />
              </div>
              <div class="row row-2" v-if="dialog.mode !== 'create'">
                <el-form-item label="创建时间" class="col col-1">
                  <el-input v-model="form.createTime" disabled />
                </el-form-item>
                <el-form-item label="更新时间" class="col col-1">
                  <el-input v-model="form.updateTime" disabled />
                </el-form-item>
              </div>
              <div class="row row-3">
                <el-form-item label="景点描述" class="col col-3 desc-left" prop="description" required>
                  <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入景点描述" class="desc-textarea" />
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
  </div>

    <!-- 图片轮播预览弹窗（与餐厅一致） -->
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
</template>

<script setup>
// 景点列表（管理端）：服务端分页与筛选
import { ref, reactive, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { View, Close } from '@element-plus/icons-vue'
import { fetchAdminAttractionsPage, fetchAdminAttractionById, createAdminAttraction, updateAdminAttraction, deleteAdminAttraction } from '@/api'
import { uploadMultipleImages } from '@/api/modules/upload'
import { processImageData, formatImageDataForSubmit } from '@/utils/imageUtils'

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
const fileInputRef = ref()
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
const preview = reactive({ visible: false })
function openPreview() { if (previewImages.value.length > 0) preview.visible = true }

function triggerUpload() {
  // 直接触发原生文件选择器
  fileInputRef.value?.click()
}

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
  form.ticketPrice = ''
  form.contactPhone = ''
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
    
    // 加载图片数据到显示状态
    loadImageData()
    
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
  clearImageData()
  resetForm()
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

async function onSubmitEdit() {
  // 先校验表单
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  
  try {
    // 如果有新选择的文件，先上传图片
    if (currentImageData.value.files.length > 0) {
      ElMessage.info('正在上传图片...')
      
      // 提取实际的文件对象
      const filesToUpload = currentImageData.value.files.map(item => item.file)
      const uploadedUrls = await uploadMultipleImages(filesToUpload)
      
      if (!uploadedUrls || uploadedUrls.length === 0) {
        ElMessage.error('图片上传失败，请重试')
        return
      }
      
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
      

    }
    
    const payload = { ...form } // 包含 id 与可编辑字段
    await updateAdminAttraction(payload)
    ElMessage.success('修改成功')
    dialog.visible = false
    loadData()
  } catch (e) {
    ElMessage.error(e.message || '修改失败')
  }
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

async function onSubmitCreate() {
  // 先校验表单
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  
  try {
    // 如果有新选择的文件，先上传图片
    if (currentImageData.value.files.length > 0) {
      ElMessage.info('正在上传图片...')
      
      // 提取实际的文件对象
      const filesToUpload = currentImageData.value.files.map(item => item.file)
      const uploadedUrls = await uploadMultipleImages(filesToUpload)
      
      if (!uploadedUrls || uploadedUrls.length === 0) {
        ElMessage.error('图片上传失败，请重试')
        return
      }
      
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
      

    }
    
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
  
  // 处理新文件
  const urls = files.map(file => {
    const blobUrl = URL.createObjectURL(file)
    return { file, blobUrl }
  })
  
  // 更新显示数据
  currentImageData.value = {
    files: urls,
    coverUrl: urls[0]?.blobUrl || '',
    imageUrls: urls.map(item => item.blobUrl)
  }
  
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
.dialog-form .row { display: grid; margin-bottom: 12px; }
.dialog-form .row-3 { grid-template-columns: repeat(3, 1fr); }
.dialog-form .row-2 { grid-template-columns: repeat(2, 1fr); }
.dialog-form .col-2 { grid-column: span 2; }
.dialog-form .col-3 { grid-column: span 3; }
.dialog-form .col-1 { grid-column: span 1; }
.dialog-form :deep(.el-form-item) { margin-bottom: 0; align-items: center; }
.dialog-form :deep(.el-form-item__label) { align-self: start; padding-top: 4px; }
.desc-textarea :deep(textarea) { text-align: justify; }
.meta-row :deep(.el-input__wrapper) { background: #fafafa; }

/* 新增：左右分栏与右侧图片区域样式，复用餐厅风格 */
.layout-2-1 { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; align-items: start; }
.layout-right { display: block; }
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

/* 隐藏的上传组件 */
.hidden-upload { display: none; }

.preview-body { padding: 4px; }
.preview-image { width: 100%; height: 100%; }

.dialog-body { padding: 8px 14px 6px; overflow: visible; }
/* 让错误提示占据文档流并自动换行，避免被裁剪 */
.dialog-form :deep(.el-form-item__error) {
  position: static;
  margin-top: 4px;
  line-height: 1.2;
  white-space: normal;
}
/* 给内容区域底部预留空间，避免错误提示与下一行挤在一起 */
.dialog-form :deep(.el-form-item__content) { padding-bottom: 4px; }
@media (max-width: 1023px) {
  .dialog-form .row-3 { grid-template-columns: 1fr; }
  .dialog-form .col-2, .dialog-form .col-3, .dialog-form .col-1 { grid-column: span 1; }
  .layout-2-1 { grid-template-columns: 1fr; }
}
</style>
