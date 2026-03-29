<template>
  <div class="admin-intangible-culture-types">
    <el-card class="block" shadow="never">
      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="类型名称">
          <el-input v-model="query.name" placeholder="类型名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">搜索</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="block" shadow="never">
      <div class="action-row">
        <el-button type="primary" @click="onAdd">添加类型</el-button>
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
          <el-table-column prop="id" label="编号" width="80" />
          <el-table-column prop="name" label="类型名称" min-width="200" />
          <el-table-column prop="description" label="描述" min-width="300" show-overflow-tooltip />
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" fixed="right" width="150">
            <template #default="scope">
              <el-button size="small" @click="onEdit(scope.row)">编辑</el-button>
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

    <el-dialog v-model="dialog.visible" :title="dialogTitle" width="500px" append-to-body @closed="onDialogClosed">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="类型名称" prop="name" required>
          <el-input v-model="form.name" placeholder="请输入类型名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入类型描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialog.visible = false">取消</el-button>
          <el-button type="primary" @click="onSubmit">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const query = reactive({ name: '' })

const page = reactive({ current: 1, size: 10 })

const loading = ref(false)
const list = ref([
  { id: 1, name: '传统技艺', description: '传统手工技艺类非物质文化遗产', createTime: '2024-01-01 10:00:00' },
  { id: 2, name: '传统美术', description: '传统美术类非物质文化遗产', createTime: '2024-01-01 10:00:00' },
  { id: 3, name: '传统音乐', description: '传统音乐类非物质文化遗产', createTime: '2024-01-01 10:00:00' },
  { id: 4, name: '传统舞蹈', description: '传统舞蹈类非物质文化遗产', createTime: '2024-01-01 10:00:00' },
  { id: 5, name: '传统戏剧', description: '传统戏剧类非物质文化遗产', createTime: '2024-01-01 10:00:00' },
  { id: 6, name: '曲艺', description: '曲艺类非物质文化遗产', createTime: '2024-01-01 10:00:00' },
  { id: 7, name: '传统体育', description: '传统体育、游艺与杂技类非物质文化遗产', createTime: '2024-01-01 10:00:00' },
  { id: 8, name: '传统医药', description: '传统医药类非物质文化遗产', createTime: '2024-01-01 10:00:00' },
  { id: 9, name: '民俗', description: '民俗类非物质文化遗产', createTime: '2024-01-01 10:00:00' }
])
const total = ref(9)

const selectedRows = ref([])

const dialog = reactive({ visible: false, mode: 'create' })
const formRef = ref(null)
const form = reactive({
  id: null,
  name: '',
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入类型名称', trigger: 'blur' }]
}

const dialogTitle = computed(() => dialog.mode === 'create' ? '新增类型' : '编辑类型')

const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    let filtered = list.value
    if (query.name) {
      filtered = filtered.filter(item => item.name.includes(query.name))
    }
    list.value = filtered
    total.value = filtered.length
    loading.value = false
  }, 300)
}

const onSearch = () => {
  page.current = 1
  fetchData()
}

const onReset = () => {
  query.name = ''
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
  Object.assign(form, { id: null, name: '', description: '' })
}

const onAdd = () => {
  resetForm()
  dialog.mode = 'create'
  dialog.visible = true
}

const onEdit = (row) => {
  resetForm()
  Object.assign(form, row)
  dialog.mode = 'edit'
  dialog.visible = true
}

const onDialogClosed = () => {
  resetForm()
}

const onSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  if (dialog.mode === 'create') {
    const newItem = {
      id: list.value.length + 1,
      name: form.name,
      description: form.description,
      createTime: new Date().toLocaleString()
    }
    list.value.push(newItem)
    total.value++
    ElMessage.success('添加成功')
  } else {
    const index = list.value.findIndex(item => item.id === form.id)
    if (index > -1) {
      list.value[index] = { ...list.value[index], ...form }
    }
    ElMessage.success('修改成功')
  }
  dialog.visible = false
}

const onDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除「${row.name}」吗？`, '删除确认', { type: 'warning' })
    const index = list.value.findIndex(item => item.id === row.id)
    if (index > -1) {
      list.value.splice(index, 1)
      total.value--
    }
    ElMessage.success('删除成功')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const onBatchDelete = async () => {
  if (selectedRows.value.length === 0) return
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 条数据吗？`, '批量删除确认', { type: 'warning' })
    selectedRows.value.forEach(row => {
      const index = list.value.findIndex(item => item.id === row.id)
      if (index > -1) {
        list.value.splice(index, 1)
        total.value--
      }
    })
    ElMessage.success('批量删除成功')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

fetchData()
</script>

<style scoped>
.admin-intangible-culture-types {
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
