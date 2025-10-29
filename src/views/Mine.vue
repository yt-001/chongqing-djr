<script setup>
// 我的页面：根据登录状态动态展示内容
// 未登录：头像/昵称区域显示“点击登录”，点击跳转登录页
// 已登录：展示头像、昵称、快捷入口和“退出登录”
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { showToast } from 'vant'

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
          round
          width="68"
          height="68"
          :src="user.avatarUrl || 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'"
          fit="cover"
        />
        <div class="nickname">{{ isLoggedIn ? (user.username || '用户') : '点击登录' }}</div>
      </div>

    </div>

    <!-- 快捷功能区 1 -->
    <van-cell-group inset class="block">
      <van-grid :column-num="4" clickable>
        <van-grid-item icon="orders-o" text="充值订单" @click="onFeatureClick('充值订单')" />
        <van-grid-item icon="service-o" text="客服中心" @click="onFeatureClick('客服中心')" />
        <van-grid-item icon="star-o" text="我的收藏" @click="onFeatureClick('我的收藏')" />
        <van-grid-item icon="coupon-o" text="优惠券" @click="onFeatureClick('优惠券')" />
      </van-grid>
    </van-cell-group>

    <!-- 快捷功能区 2 -->
    <van-cell-group inset class="block">
      <van-grid :column-num="4" clickable>
        <van-grid-item icon="description" text="用户协议" @click="onFeatureClick('用户协议')" />
        <van-grid-item icon="award-o" text="平台资质" @click="onFeatureClick('平台资质')" />
        <van-grid-item icon="friends-o" text="我要合作" @click="onFeatureClick('我要合作')" />
        <van-grid-item icon="chat-o" text="消息通知" @click="onFeatureClick('消息通知')" />
        <van-grid-item icon="manager-o" text="个人信息" @click="onFeatureClick('个人信息')" />
        <van-grid-item icon="notes-o" text="规则中心" @click="onFeatureClick('规则中心')" />
      </van-grid>
    </van-cell-group>

    <!-- 退出登录，仅在已登录显示 -->
    <van-cell-group inset v-if="isLoggedIn" class="block">
      <van-cell title="退出登录" is-link @click="handleLogout" />
    </van-cell-group>
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
</style>
