<script setup>
// 我的页面：根据登录状态动态展示内容
// 未登录：头像/昵称区域显示“点击登录”，点击跳转登录页
// 已登录：展示头像、昵称、快捷入口和“退出登录”
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { showToast } from 'vant'
import { updateUser, uploadSingleImage } from '@/api'

const router = useRouter()
const store = useUserStore()

// 计算属性：登录状态与用户信息（从 Pinia 读取）
const isLoggedIn = computed(() => !!store.user)
const user = computed(() => store.user || { username: '游客', avatarUrl: '', backgroundUrl: '' })

// 顶部背景样式：优先使用用户的背景图，其次使用默认渐变
const profileStyle = computed(() => {
  // 统一从 user 读取背景图，兼容常见字段名
  const u = user.value || {}
  const bg = u.backgroundUrl || u.background || u.bgUrl || u.coverUrl || u.bannerUrl
  if (bg) {
    return {
      background: `url(${bg}) center/cover no-repeat`,
      minHeight: '160px',
      paddingTop: '56px',
      paddingBottom: '28px',
    }
  }
  // 无背景图时使用渐变，区域高度保持一致
  return {
    background: 'url(src/assets/img/user-bg.png) center/cover no-repeat',
    minHeight: '160px',
    paddingTop: '56px',
    paddingBottom: '28px',
  }
})

// 跳转到登录页（未登录时头部点击）
const goLogin = () => {
  router.push({ name: 'login' })
}

// 退出登录
const handleLogout = async () => {
  try {
    await store.logout()
    showToast({ message: '已退出登录', position: 'top' })
  } catch (_) {
    // 忽略退出异常
  }
}

/**
 * 打开资料编辑弹窗并初始化表单
 */
const editVisible = ref(false)
const editLoading = ref(false)
const popupMode = ref('view')
const editForm = ref({ username: '', email: '', phone: '', backgroundUrl: '' })
const originalUser = ref(null)
const avatarPreview = ref('')
const avatarUploaded = ref(false)
const pendingAvatarFile = ref(null)
const avatarFileRef = ref(null)
function openEdit() {
  popupMode.value = 'edit'
  const u = user.value || {}
  editForm.value = {
    username: u.username || '',
    email: u.email || '',
    phone: u.phone || '',
    backgroundUrl: u.backgroundUrl || u.background || u.bgUrl || u.coverUrl || u.bannerUrl || ''
  }
  originalUser.value = { ...u }
  avatarPreview.value = ''
  avatarUploaded.value = false
  pendingAvatarFile.value = null
  editVisible.value = true
}

/**
 * 打开资料查看弹窗（仅返回按钮，无任何可编辑项）
 */
function openView() {
  const u = user.value || {}
  editForm.value = {
    username: u.username || '',
    email: u.email || '',
    phone: u.phone || '',
    backgroundUrl: u.backgroundUrl || u.background || u.bgUrl || u.coverUrl || u.bannerUrl || ''
  }
  popupMode.value = 'view'
  originalUser.value = { ...u }
  avatarPreview.value = ''
  avatarUploaded.value = false
  pendingAvatarFile.value = null
  editVisible.value = true
}

/**
 * 提交资料修改并更新本地用户信息
 */
async function submitEdit() {
  if (!store.user || !store.user.id) {
    return showToast({ message: '请先登录', position: 'top' })
  }
  try {
    editLoading.value = true
    // 先上传头像（如选择了新头像）
    let avatarUrl = originalUser.value?.avatarUrl || ''
    if (pendingAvatarFile.value) {
      const urls = await uploadSingleImage(pendingAvatarFile.value)
      avatarUrl = Array.isArray(urls) ? (urls[0] || avatarUrl) : avatarUrl
    }

    // 仅提交修改过的字段
    const editable = ['username', 'email', 'phone']
    const diff = { id: store.user.id }
    let changed = false
    for (const k of editable) {
      if ((editForm.value[k] || '') !== (originalUser.value?.[k] || '')) {
        diff[k] = editForm.value[k]
        changed = true
      }
    }
    if (avatarUrl && avatarUrl !== (originalUser.value?.avatarUrl || '')) {
      diff.avatarUrl = avatarUrl
      changed = true
    }
    if (!changed) {
      showToast({ message: '无修改内容', position: 'top' })
    } else {
      await updateUser(diff)
      store.user = { ...store.user, ...diff }
      showToast({ message: '资料已更新', position: 'top' })
    }
    editVisible.value = false
  } catch (e) {
    showToast({ message: e.message || '更新失败', position: 'top' })
  } finally {
    editLoading.value = false
  }
}

/**
 * 触发选择头像文件
 */
function triggerAvatarUpload() {
  avatarFileRef.value?.click()
}

/**
 * 选择头像后上传，返回的URL用于预览与保存
 * @param {Event} e
 */
function onAvatarFileChange(e) {
  const file = (e.target.files && e.target.files[0]) || null
  if (!file) return
  // 本地预览（隐藏遮掩层）
  const url = URL.createObjectURL(file)
  avatarPreview.value = url
  avatarUploaded.value = true
  pendingAvatarFile.value = file
}

/**
 * 头像显示路径拼接（/public/images + 文件名或相对路径）
 * @param {string} nameOrPath
 * @returns {string}
 */
function resolveAvatarUrl(nameOrPath) {
  if (!nameOrPath) return ''
  const s = String(nameOrPath)
  if (/^https?:\/\//.test(s) || s.startsWith('/')) return s
  return `/public/images/${s}`
}

// 占位：各功能入口点击
const onFeatureClick = (name) => {
  showToast({ message: `${name} 开发中`, position: 'top' })
}
</script>

<template>
  <div class="mine-page">
    <!-- 顶部个人区：根据登录状态切换点击逻辑 -->
    <div class="profile-card" :class="{ clickable: !isLoggedIn }" :style="profileStyle" @click="!isLoggedIn && goLogin()">
      <div class="profile-inner">
        <van-image
          class="profile-avatar"
          round
          :src="(resolveAvatarUrl(user.avatarUrl) || 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg')"
          fit="cover"
        />
        <div class="nickname">{{ isLoggedIn ? (user.username || '用户') : '点击登录' }}</div>
      </div>

    </div>

    <!-- 快捷功能区 1 -->
    <van-cell-group inset class="block">
      <van-grid :column-num="4" clickable>
        <van-grid-item icon="orders-o" text="待消费卷" @click="router.push({ name: 'pending-vouchers' })" />
        <van-grid-item icon="service-o" text="客服中心" @click="onFeatureClick('客服中心')" />
        <van-grid-item icon="star-o" text="我的收藏" @click="router.push({ name: 'my-favorites' })" />
        <van-grid-item icon="coupon-o" text="优惠券" @click="onFeatureClick('优惠券')" />
        <van-grid-item icon="clock-o" text="未完成" @click="router.push({ name: 'incomplete-orders' })" />
        <van-grid-item icon="passed" text="已完成" @click="router.push({ name: 'completed-orders' })" />
      </van-grid>
    </van-cell-group>

    <!-- 快捷功能区 2 -->
    <van-cell-group inset class="block">
      <van-grid :column-num="4" clickable>
        <van-grid-item icon="description" text="用户协议" @click="onFeatureClick('用户协议')" />
        <van-grid-item icon="award-o" text="平台资质" @click="onFeatureClick('平台资质')" />
        <van-grid-item icon="friends-o" text="我要合作" @click="onFeatureClick('我要合作')" />
        <van-grid-item icon="chat-o" text="消息通知" @click="onFeatureClick('消息通知')" />
        <van-grid-item icon="manager-o" text="个人信息" @click="openView" />
        <van-grid-item icon="notes-o" text="规则中心" @click="onFeatureClick('规则中心')" />
      </van-grid>
    </van-cell-group>

    <!-- 修改资料 / 退出登录 -->
    <van-cell-group inset v-if="isLoggedIn" class="block">
      <van-cell title="修改资料" is-link @click="openEdit" />
      <van-cell title="退出登录" is-link @click="handleLogout" />
    </van-cell-group>

    <!-- 编辑/查看弹窗 -->
    <van-popup v-model:show="editVisible" round :style="{ width: '90%' }">
      <van-nav-bar :title="popupMode === 'edit' ? '修改资料' : '个人信息'" left-text="返回" left-arrow @click-left="editVisible=false" />
      <div class="popup-body">
        <div class="popup-avatar">
          <div class="avatar-wrapper" @click="popupMode==='edit' && triggerAvatarUpload()">
            <van-image
              class="avatar-img"
              round
              :src="(avatarPreview || resolveAvatarUrl(user.avatarUrl) || 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg')"
              fit="cover"
            />
            <div v-if="popupMode==='edit' && !avatarUploaded" class="avatar-overlay">
              <van-icon name="photograph" size="28" color="#fff" />
            </div>
          </div>
          <input ref="avatarFileRef" type="file" accept="image/*" style="display:none" @change="onAvatarFileChange" />
        </div>

        <template v-if="popupMode === 'view'">
          <van-cell-group inset>
            <van-cell title="用户名" :value="editForm.username || '未设置'" />
            <van-cell title="邮箱" :value="editForm.email || '未设置'" />
            <van-cell title="手机号" :value="editForm.phone || '未设置'" />
          </van-cell-group>
        </template>

        <template v-else>
          <van-cell-group>
            <van-field v-model="editForm.username" label="用户名" placeholder="请输入用户名" />
            <van-field v-model="editForm.email" label="邮箱" placeholder="请输入邮箱" />
            <van-field v-model="editForm.phone" label="手机号" placeholder="请输入手机号" />
          </van-cell-group>
          <div class="edit-actions">
            <van-button round type="primary" :loading="editLoading" @click="submitEdit">保存</van-button>
            <van-button round plain style="margin-left:8px" @click="editVisible=false">取消</van-button>
          </div>
        </template>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
/* 页面容器 */
.mine-page {
  min-height: 100vh;
  background: #f5f6f7;
  padding: 0 0 24px;
}

/* 顶部个人名片：绿色渐变 + 白色卡片 */
.profile-card {
  position: relative;
  padding-top: 56px;      /* 顶部留白 */
  padding-bottom: 28px;   /* 背景底部在昵称下方 */
  margin-bottom: 12px;
  min-height: 160px;      /* 背景区域固定高度，确保可见 */
  /* 背景由 :style 动态绑定 */
}
.profile-card.clickable { cursor: pointer; }
.profile-card .profile-inner {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 10px;
}
.nickname {
  color: #fff;
  font-size: 16px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}

/* 下方白色余额卡片 */
.balance-card {
  width: calc(100% - 24px);
  margin: 16px auto 0;
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 8px 20px rgba(255, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.amount { color: #111; }
.amount .num { font-weight: 700; font-size: 18px; margin-right: 4px; }
.amount .unit { color: #333; font-size: 12px; }
.action { color: #12b981; font-size: 13px; }

/* 通用卡片块间距 */
.block { margin: 10px 12px; border-radius: 12px; overflow: hidden; }

/* Grid 文案适配 */
:deep(.van-grid-item__text) { font-size: 12px; }
.edit-title { font-weight: 700; font-size: 16px; margin-bottom: 10px; }
.edit-actions { display: flex; justify-content: flex-end; margin-top: 12px; }
.popup-body { padding: 12px 16px 16px; }
.popup-avatar { display: flex; justify-content: center; margin: 8px 0 12px; }
.avatar-wrapper { position: relative; --avatar-size: 88px; width: var(--avatar-size); height: var(--avatar-size); border-radius: 50%; overflow: hidden; box-sizing: border-box; }
/* 使用居中+等尺寸，避免不同设备的亚像素偏移 */
.avatar-overlay { position: absolute; width: 100%; height: 100%; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.35); border-radius: 50%; pointer-events: none; }
.avatar-wrapper :deep(.van-image) { width: 100%; height: 100%; }
.avatar-wrapper :deep(.van-image__img) { width: 100%; height: 100%; object-fit: cover; display: block; }
.avatar-img { width: var(--avatar-size); height: var(--avatar-size); }
.profile-avatar { width: 68px; height: 68px; display: block; }
</style>
