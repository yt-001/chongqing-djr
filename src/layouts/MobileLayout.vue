<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, watch, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
// 使用 Vant 的 Tabbar 代替 Element Plus 菜单

// 选中的 Tab 索引
const route = useRoute()
const router = useRouter()
const active = ref(route.name || 'home')

// 应用加载时自动恢复会话（调用 check 接口）
const userStore = useUserStore()
onMounted(async () => {
  try { await userStore.fetchSession() } catch (_) {}
})

watch(() => route.name, (name) => {
  active.value = name
})

// 切换 Tab
const onTabChange = (name) => {
  if (name === 'home') router.push('/')
  if (name === 'recommend') router.push('/recommend')
  if (name === 'food') router.push('/food')
  if (name === 'booking') router.push('/booking')
  if (name === 'mine') router.push('/mine')
}

// 计算底部 Tabbar 的占位高度（含安全区）
const tabbarRef = ref(null)
const baseTabbarHeight = 50 // Vant 默认高度约 50px
const safeInsetBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)').replace('px', '')) || 0
const tabbarPlaceholder = baseTabbarHeight + safeInsetBottom
</script>

<template>
  <div class="mobile-layout">
    <main class="content" :style="{ paddingBottom: (!route.meta?.hideTabbar ? tabbarPlaceholder + 'px' : '0px') }">
      <router-view />
    </main>

    <nav class="tabbar" v-if="!route.meta?.hideTabbar">
      <van-tabbar v-model="active" @change="onTabChange" ref="tabbarRef">
        <van-tabbar-item name="home" icon="home-o">首页</van-tabbar-item>
        <van-tabbar-item name="recommend" icon="fire-o">推荐</van-tabbar-item>
        <van-tabbar-item name="food" icon="smile-o">美食</van-tabbar-item>
        <van-tabbar-item name="booking" icon="orders-o">预定</van-tabbar-item>
        <van-tabbar-item name="mine" icon="user-o">我的</van-tabbar-item>
      </van-tabbar>
    </nav>
  </div>
</template>

<style scoped>
/**** 移动端安全区与底部 Tabbar ****/
.mobile-layout { min-height: 100vh; display: flex; flex-direction: column; }
/**** 让内容区域永远不被底部 Tabbar 遮挡：通过内联 style 注入 padding-bottom ****/
.content { flex: 1 1 auto; overflow-y: auto; }
/**** 将 Tabbar 固定在窗口底部 ****/
.tabbar { position: fixed; left: 0; right: 0; bottom: 0; background: #fff; z-index: 1000; }
</style>
