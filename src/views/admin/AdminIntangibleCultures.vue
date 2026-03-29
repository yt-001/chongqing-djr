<template>
  <div class="admin-intangible-cultures">
    <el-card class="block" shadow="never">
      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="关键词" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="query.name" placeholder="非遗名称" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="类型">
          <el-input v-model="query.type" placeholder="非遗类型" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="传承人">
          <el-input v-model="query.inheritor" placeholder="传承人" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">搜索</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="block" shadow="never">
      <div class="action-row">
        <el-button type="primary" @click="onAdd">添加非遗文化</el-button>
        <el-button type="danger" :disabled="!singleDeletable" @click="onDelete(selectedRows[0])">删除</el-button>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="onBatchDelete">批量删除</el-button>
      </div>
    </el-card>

    <el-card class="block" shadow="never">
      <div class="table-wrap">
        <el-table
          :data="list"
          border
          style="width: 100%"
          v-loading="loading"
          @selection-change="onSelectionChange"
        >
          <el-table-column type="selection" width="48" fixed="left" />
          <el-table-column prop="id" label="编号" width="80" sortable />
          <el-table-column prop="name" label="非遗名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="type" label="非遗类型" width="120" />
          <el-table-column prop="inheritor" label="传承人" width="120" />
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column prop="createTime" label="创建时间" width="180" />
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
      <div class="dialog-body" v-loading="detailLoading">
        <el-form :key="dialogKey" ref="formRef" :model="form" :rules="rules" :disabled="dialog.mode === 'view'" label-width="96px" class="dialog-form">
          <div class="row row-2">
            <el-form-item label="非遗名称" class="col col-1" prop="name" required>
              <el-input v-model="form.name" placeholder="请输入非遗名称" />
            </el-form-item>
            <el-form-item label="非遗类型" class="col col-1" prop="type">
              <el-input v-model="form.type" placeholder="请输入非遗类型" />
            </el-form-item>
          </div>

          <div class="row row-2">
            <el-form-item label="传承人" class="col col-1" prop="inheritor">
              <el-input v-model="form.inheritor" placeholder="请输入传承人" />
            </el-form-item>
            <el-form-item label="创建时间" class="col col-1" v-if="dialog.mode !== 'create'">
              <el-input v-model="form.createTime" disabled />
            </el-form-item>
          </div>

          <div class="layout-2-1">
            <div class="layout-left">
              <el-form-item label="描述" prop="description">
                <el-input v-model="form.description" type="textarea" :rows="6" placeholder="请输入非遗文化描述" />
              </el-form-item>
            </div>
            <div class="layout-right">
              <div v-if="dialog.mode !== 'view'" class="image-aside" :title="coverUrl ? '点击预览图片' : '点击上传图片'" @click="coverUrl ? openPreview() : triggerUpload()">
                <el-image v-if="coverUrl" :src="coverUrl" fit="cover" class="cover" />
                <div v-else class="cover placeholder">点击上传图片</div>
                <div v-if="uploadedCount > 0" class="badge">+{{ uploadedCount }}</div>
                <div v-if="coverUrl || uploadedCount > 0" class="clear-btn" @click.stop="clearImages">
                  <el-icon class="clear-icon"><Close /></el-icon>
                </div>
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

    <el-dialog v-model="preview.visible" title="图片预览" width="720px" append-to-body>
      <div class="preview-body">
        <div class="preview-container">
          <button class="preview-btn preview-btn-left" @click="prevImage" :disabled="previewImages.length <= 1">
            <el-icon><ArrowLeft /></el-icon>
          </button>
          <div class="preview-image-wrap">
            <el-image 
              v-if="previewImages.length > 0" 
              :src="previewImages[previewIndex]" 
              fit="contain" 
              class="preview-image"
            />
            <div v-else class="preview-empty">无图片</div>
          </div>
          <button class="preview-btn preview-btn-right" @click="nextImage" :disabled="previewImages.length <= 1">
            <el-icon><ArrowRight /></el-icon>
          </button>
        </div>
        <div class="preview-indicator" v-if="previewImages.length > 0">
          {{ previewIndex + 1 }} / {{ previewImages.length }}
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="preview.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Close, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { fetchIntangibleCulturesPage, fetchIntangibleCultureById, addIntangibleCulture, updateIntangibleCulture, deleteIntangibleCulture } from '@/api/modules/intangibleCulture'
import { uploadMultipleImages } from '@/api/modules/upload'
import { processImageData, formatImageDataForSubmit } from '@/utils/imageUtils'

const query = reactive({ keyword: '', name: '', type: '', inheritor: '' })

const page = reactive({ current: 1, size: 10 })

const loading = ref(false)
const list = ref([])
const total = ref(0)

const selectedRows = ref([])
const singleDeletable = computed(() => selectedRows.value.length === 1)

const dialog = reactive({ visible: false, mode: 'view' })
const dialogKey = ref(0)
const detailLoading = ref(false)
const formRef = ref(null)
const form = reactive({
  id: null,
  name: '',
  type: '',
  inheritor: '',
  description: '',
  coverImage: '',
  images: '[]',
  createTime: ''
})

const rules = {
  name: [{ required: true, message: '请输入非遗名称', trigger: 'blur' }]
}

const dialogTitle = computed(() => {
  if (dialog.mode === 'create') return '新增非遗文化'
  if (dialog.mode === 'edit') return '修改非遗文化'
  return '查看非遗文化'
})

const fileInputRef = ref(null)
const uploadedFiles = ref([])
const coverUrl = computed(() => {
  if (form.coverImage) {
    return processImageData({ coverImage: form.coverImage, images: '[]' }).coverUrl
  }
  if (uploadedFiles.value.length > 0) {
    return URL.createObjectURL(uploadedFiles.value[0])
  }
  return ''
})
const uploadedCount = computed(() => Math.max(0, uploadedFiles.value.length - 1))
const imagesCount = computed(() => {
  try {
    const arr = JSON.parse(form.images || '[]')
    return Array.isArray(arr) ? arr.length : 0
  } catch {
    return 0
  }
})

const preview = reactive({ visible: false })
const previewIndex = ref(0)
const previewImages = computed(() => {
  const cover = coverUrl.value
  let imgs = []
  try {
    imgs = JSON.parse(form.images || '[]')
  } catch {}
  const urls = imgs.map(p => processImageData({ coverImage: p, images: '[]' }).coverUrl)
  return [cover, ...urls].filter(Boolean)
})

const prevImage = () => {
  if (previewIndex.value > 0) {
    previewIndex.value--
  } else {
    previewIndex.value = previewImages.value.length - 1
  }
}

const nextImage = () => {
  if (previewIndex.value < previewImages.value.length - 1) {
    previewIndex.value++
  } else {
    previewIndex.value = 0
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const payload = {
      pageNum: page.current,
      pageSize: page.size,
      query: {
        keyword: query.keyword || undefined,
        name: query.name || undefined,
        type: query.type || undefined,
        inheritor: query.inheritor || undefined
      }
    }
    const res = await fetchIntangibleCulturesPage(payload)
    list.value = res?.list || []
    total.value = res?.total || 0
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const onSearch = () => {
  page.current = 1
  fetchData()
}

const onReset = () => {
  Object.assign(query, { keyword: '', name: '', type: '', inheritor: '' })
  page.current = 1
  fetchData()
}

const onSizeChange = (size) => {
  page.size = size
  fetchData()
}

const onPageChange = (current) => {
  page.current = current
  fetchData()
}

const onSelectionChange = (rows) => {
  selectedRows.value = rows
}

const resetForm = () => {
  Object.assign(form, {
    id: null,
    name: '',
    type: '',
    inheritor: '',
    description: '',
    coverImage: '',
    images: '[]',
    createTime: ''
  })
  uploadedFiles.value = []
}

const onAdd = () => {
  resetForm()
  dialog.mode = 'create'
  dialog.visible = true
  dialogKey.value++
}

const onView = async (row) => {
  resetForm()
  dialog.mode = 'view'
  dialog.visible = true
  detailLoading.value = true
  try {
    const data = await fetchIntangibleCultureById(row.id)
    Object.assign(form, data)
    dialogKey.value++
  } catch (e) {
    ElMessage.error(e.message || '加载详情失败')
    dialog.visible = false
  } finally {
    detailLoading.value = false
  }
}

const onEdit = () => {
  dialog.mode = 'edit'
  dialogKey.value++
}

const onDialogClosed = () => {
  resetForm()
}

const triggerUpload = () => {
  fileInputRef.value?.click()
}

const onFileInputChange = (e) => {
  const files = Array.from(e.target.files || [])
  if (files.length === 0) return
  uploadedFiles.value = files
  e.target.value = ''
}

const clearImages = () => {
  form.coverImage = ''
  form.images = '[]'
  uploadedFiles.value = []
}

const openPreview = () => {
  if (previewImages.value.length > 0) {
    previewIndex.value = 0
    preview.visible = true
  }
}

const onSubmitCreate = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  try {
    let coverImage = form.coverImage
    let images = form.images

    if (uploadedFiles.value.length > 0) {
      const urls = await uploadMultipleImages(uploadedFiles.value)
      if (urls.length > 0) {
        const formatted = formatImageDataForSubmit(urls)
        coverImage = formatted.coverImage
        images = formatted.images
      }
    }

    const payload = {
      name: form.name,
      type: form.type,
      inheritor: form.inheritor,
      description: form.description,
      coverImage,
      images
    }

    await addIntangibleCulture(payload)
    ElMessage.success('添加成功')
    dialog.visible = false
    fetchData()
  } catch (e) {
    ElMessage.error(e.message || '添加失败')
  }
}

const onSubmitEdit = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  try {
    let coverImage = form.coverImage
    let images = form.images

    if (uploadedFiles.value.length > 0) {
      const urls = await uploadMultipleImages(uploadedFiles.value)
      if (urls.length > 0) {
        const formatted = formatImageDataForSubmit(urls)
        coverImage = formatted.coverImage
        images = formatted.images
      }
    }

    const payload = {
      id: form.id,
      name: form.name,
      type: form.type,
      inheritor: form.inheritor,
      description: form.description,
      coverImage,
      images
    }

    await updateIntangibleCulture(payload)
    ElMessage.success('修改成功')
    dialog.visible = false
    fetchData()
  } catch (e) {
    ElMessage.error(e.message || '修改失败')
  }
}

const onDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除「${row.name}」吗？`, '删除确认', { type: 'warning' })
    await deleteIntangibleCulture(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '删除失败')
    }
  }
}

const onBatchDelete = async () => {
  if (selectedRows.value.length === 0) return
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 条数据吗？`, '批量删除确认', { type: 'warning' })
    await Promise.all(selectedRows.value.map(row => deleteIntangibleCulture(row.id)))
    ElMessage.success('批量删除成功')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '批量删除失败')
    }
  }
}

fetchData()
</script>

<style scoped>
.admin-intangible-cultures {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.block {
  width: 100%;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-row {
  display: flex;
  gap: 8px;
}

.table-wrap {
  width: 100%;
}

.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.dialog-body {
  padding: 0 20px;
}

.dialog-form {
  width: 100%;
}

.row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.row-2 .col { flex: 1; }
.row-3 .col-1 { flex: 1; }
.row-3 .col-2 { flex: 2; }
.row-3 .col-3 { flex: 3; }

.layout-2-1 {
  display: flex;
  gap: 16px;
}

.layout-left {
  flex: 2;
}

.layout-right {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.image-aside {
  width: 200px;
  height: 200px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.image-aside:hover {
  border-color: #409eff;
}

.image-aside .cover {
  width: 100%;
  height: 100%;
}

.image-aside .placeholder {
  color: #909399;
  font-size: 14px;
}

.image-aside .badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #409eff;
  color: #fff;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.clear-btn {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.clear-icon {
  color: #fff;
  font-size: 14px;
}

.preview-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  padding: 20px 0;
}

.preview-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
}

.preview-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #dcdfe6;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #606266;
  z-index: 10;
  transition: all 0.2s;
}

.preview-btn:hover:not(:disabled) {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

.preview-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.preview-btn-left {
  left: 10px;
}

.preview-btn-right {
  right: 10px;
}

.preview-image-wrap {
  width: 640px;
  height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
}

.preview-empty {
  color: #909399;
  font-size: 14px;
}

.preview-indicator {
  margin-top: 16px;
  font-size: 14px;
  color: #606266;
}
</style>
