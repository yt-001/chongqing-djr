<template>
  <div class="pc-profile">
    <!-- 顶部背景图区域 -->
    <div class="profile-header">
      <div class="header-bg"></div>
    </div>
    
    <!-- 主内容区域 -->
    <el-card class="block" shadow="never">
      <template #header>
        <div class="card-header">个人中心</div>
      </template>

      <div class="profile-content">
        <!-- 左侧头像区域 -->
        <div class="avatar-section">
          <el-avatar :size="120" :src="currentDisplayAvatar || defaultAvatar" />
        </div>

        <!-- 中间信息区域：一行两列紧凑排列 -->
        <div class="info-section">
          <div class="info-grid">
            <div class="info-item">
              <span class="label">ID:</span>
              <span class="value">{{ current.id || '无' }}</span>
            </div>
            <div class="info-item">
              <span class="label">用户名:</span>
              <span class="value">{{ current.username || '游客' }}</span>
            </div>
            <div class="info-item">
              <span class="label">邮箱:</span>
              <span class="value">{{ current.email || '未设置' }}</span>
            </div>
            <div class="info-item">
              <span class="label">手机号:</span>
              <span class="value">{{ current.phone || '未设置' }}</span>
            </div>
            <div class="info-item">
              <span class="label">状态:</span>
              <el-tag :type="current.status === 1 ? 'success' : 'info'" size="small">
                {{ current.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="label">角色:</span>
              <el-tag :type="current.role === 0 ? 'danger' : 'primary'" size="small">
                {{ current.role === 0 ? '管理员' : '用户' }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="label">创建时间:</span>
              <span class="value">{{ current.createTime || '未知' }}</span>
            </div>
            <div class="info-item">
              <span class="label">更新时间:</span>
              <span class="value">{{ current.updateTime || '未知' }}</span>
            </div>
          </div>
        </div>

        <!-- 右侧按钮区域 -->
        <div class="button-section">
          <el-button type="primary" @click="showEditDialog" class="action-btn">
            修改信息
          </el-button>
          <el-button type="danger" @click="handleLogout" class="action-btn">
            退出登录
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 修改信息弹窗 -->
    <el-dialog 
      v-model="editDialog.visible" 
      title="修改个人信息" 
      width="600px"
      @close="resetEditForm"
    >
      <div class="dialog-content">
        <!-- 左侧头像区域 -->
        <div class="dialog-avatar-section">
          <div class="avatar-wrapper" @click="triggerAvatarUpload">
            <el-avatar 
              :size="100" 
              :src="editForm.avatarUrl || defaultAvatar" 
              class="dialog-avatar"
            />
            <div class="avatar-overlay">
              <div class="upload-icon">📤</div>
            </div>
          </div>
          <div class="avatar-upload-tip">点击更换头像</div>
          <input 
            ref="avatarInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="onAvatarChange"
          />
        </div>

        <!-- 右侧表单区域 -->
        <div class="dialog-form-section">
          <el-form :model="editForm" label-width="80px">
            <el-form-item label="用户名">
              <el-input v-model="editForm.username" placeholder="请输入用户名" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="editForm.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="editForm.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-form>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="saveUserInfoWithUpload">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
// 管理端个人中心：展示当前用户信息，支持弹窗编辑
import { reactive, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { uploadSingleImage } from '@/api/modules/upload'
import { updateUser } from '@/api/modules/user'
 

const router = useRouter()
const userStore = useUserStore()
const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

function toImagesPreview(p) {
  if (!p || typeof p !== 'string') return ''
  // 兼容处理：去除可能已存在的 /public/images/ 或 /images/ 前缀，统一加上 /images/
  const fileName = String(p).replace(/^\/public\/images\//, '').replace(/^\/images\//, '')
  return `/images/${fileName}`
}

// 当前用户信息
const current = computed(() => userStore.user || { 
  id: '', 
  username: '游客', 
  status: 1, 
  role: 1 
})

const currentDisplayAvatar = computed(() => toImagesPreview((userStore.user && userStore.user.avatarUrl) || ''))

// 编辑弹窗相关
const editDialog = reactive({
  visible: false
})

// 编辑表单数据
const editForm = reactive({
  username: '',
  email: '',
  phone: ''
})

// 头像上传相关
const avatarInput = ref(null)
const avatarFile = ref(null)

// 显示编辑弹窗
function showEditDialog() {
  editForm.username = current.value.username || ''
  editForm.email = current.value.email || ''
  editForm.phone = current.value.phone || ''
  editForm.avatarUrl = toImagesPreview((userStore.user && userStore.user.avatarUrl) || '')
  editDialog.visible = true
}

// 重置编辑表单
function resetEditForm() {
  editForm.username = ''
  editForm.email = ''
  editForm.phone = ''
}

// 触发头像上传
function triggerAvatarUpload() {
  avatarInput.value?.click()
}

/**
 * 头像文件选择处理：生成本地预览并缓存文件
 * @param {Event} event
 */
function onAvatarChange(event) {
  const file = event.target.files[0]
  if (file) {
    avatarFile.value = file
    // 创建本地预览
    const reader = new FileReader()
    reader.onload = (e) => {
      editForm.avatarUrl = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

/**
 * 保存用户信息（包含头像上传）
 */
async function saveUserInfoWithUpload() {
  try {
    /**
     * 头像上传返回路径的规范化为可显示 URL
     * @param {string} p
     */
    

    // 仅当选择了新文件时才进行上传与替换
    let avatarUrl = null
    
    // 如果有新选择的头像文件，先上传
    if (avatarFile.value) {
      try {
        const filenames = await uploadSingleImage(avatarFile.value)
        const filename = Array.isArray(filenames) ? filenames[0] : filenames
        // 存储到数据库时，统一带上 /public/images/ 前缀，保持与景点、餐厅等数据一致
        avatarUrl = `/public/images/${filename}`
      } catch (uploadError) {
        ElMessage.error('头像上传失败')
        return
      }
    }
    
    // 更新用户信息到store
    const updatedUser = {
      ...current.value,
      username: editForm.username,
      email: editForm.email,
      phone: editForm.phone,
      avatarUrl: avatarUrl ? avatarUrl : current.value.avatarUrl
    }
    
    // 包装数据给后端（模拟API调用）
    const userData = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatarUrl: avatarUrl || null
    }
    
    // 调用后端 /users 更新接口
    await updateUser(userData)
    
    userStore.setSession({ 
      token: userStore.token, 
      user: updatedUser 
    })
    // 若上传成功，更新弹窗内预览为可显示的完整 URL
    if (avatarUrl) {
      editForm.avatarUrl = toImagesPreview(avatarUrl)
    }
    
    ElMessage.success('个人信息修改成功')
    editDialog.visible = false
    avatarFile.value = null // 清空文件缓存
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

// 替换为真实上传接口：见上方 uploadSingleImage 使用

// 退出登录
async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await userStore.logout()
    router.push({ name: 'login' })
    ElMessage.success('已退出登录')
  } catch (error) {
    // 用户取消操作
  }
}
</script>

<style scoped>
/* 桌面端管理页面样式，不参与 px->vw 转换 */
.pc-profile {
  padding: 16px;
}

.block {
  border-radius: 0 0 12px 12px;
  overflow: hidden;
  border-top: none;
}

.card-header {
  font-weight: 600;
  font-size: 16px;
}

.profile-content {
  display: flex;
  gap: 32px;
  align-items: stretch;
}

/* 左侧头像区域 */
.avatar-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-width: 120px;
}

/* 中间信息区域 */
.info-section {
  flex: 1;
  display: flex;
  align-items: center;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 24px;
  width: 100%;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item .label {
  font-weight: 500;
  color: #606266;
  min-width: 80px;
  white-space: nowrap;
}

.info-item .value {
  color: #303133;
  flex: 1;
}

/* 顶部背景图区域 */
.profile-header {
  position: relative;
  width: 100%;
  height: 200px;
  margin-bottom: -1px; /* 与卡片无缝连接 */
}

.header-bg {
  width: 100%;
  height: 100%;
  background: url('/public/admin-pg.png') center/cover no-repeat;
  border-radius: 12px 12px 0 0;
}

/* 右侧按钮区域 */
.button-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 120px;
  justify-content: center;
}

.action-btn {
  width: 100%;
  height: 40px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn + .action-btn {
  margin-top: 16px; /* 覆盖默认的 margin-left，改为垂直间距 */
  margin-left: 0;
}

.action-btn {
  width: 100%;
  height: 40px;
}

/* 编辑弹窗样式 */
.avatar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-row .el-avatar {
  flex-shrink: 0;
}

.avatar-row .el-input {
  flex: 1;
}

/* 弹窗内容布局 */
.dialog-content {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.dialog-avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  min-width: 120px;
  position: relative;
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
}

.dialog-avatar {
  transition: transform 0.2s;
}

.avatar-wrapper:hover .dialog-avatar {
  transform: scale(1.05);
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 50%;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.upload-icon {
  color: #fff;
  font-size: 24px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.avatar-upload-tip {
  font-size: 12px;
  color: #909399;
}

.dialog-form-section {
  flex: 1;
  min-width: 300px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>