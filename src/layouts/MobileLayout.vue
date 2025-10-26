<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, watch } from 'vue'
// 使用 Vant 的 Tabbar 代替 Element Plus 菜单

// 选中的 Tab 索引
const route = useRoute()
const router = useRouter()
const active = ref(route.name || 'home')

watch(() => route.name, (name) => {
  active.value = name
})

// 切换 Tab
const onTabChange = (name) => {
  if (name === 'home') router.push('/')
  if (name === 'mine') router.push('/mine')
}
</script>

<template>
  <div class="mobile-layout">
    <main class="content">
      <router-view />
    </main>

    <nav class="tabbar">
      <van-tabbar v-model="active" @change="onTabChange">
        <van-tabbar-item name="home" icon="home-o">首页</van-tabbar-item>
        <van-tabbar-item name="mine" icon="user-o">我的</van-tabbar-item>
      </van-tabbar>
    </nav>
  </div>
</template>

<style scoped>
/**** 移动端安全区与底部 Tabbar ****/
.mobile-layout { min-height: 100vh; display: flex; flex-direction: column; }
.content { flex: 1 1 auto; padding-bottom: env(safe-area-inset-bottom); }
.tabbar { position: sticky; bottom: 0; background: #fff; }
</style>
