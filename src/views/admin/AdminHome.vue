<template>
  <!-- 管理端页面布局：左侧导航栏 + 顶部工具栏 + 内容区域 -->
  <el-container class="pc-admin">
    <!-- 左侧导航栏 -->
    <el-aside width="165px" class="pc-admin__aside">
      <div class="logo">梁平文旅·管理端</div>
      <AdminSidebar :menus="menusRef" :active-menu="activeMenu" @select="onSelectMenu" />
    </el-aside>

    <!-- 右侧主区域 -->
    <el-container>
      <!-- 顶部工具栏（左：面包屑 | 中：搜索 | 右：头像+姓名） -->
      <el-header class="pc-admin__header pc-admin__header--grid">
        <!-- 左侧：面包屑 -->
        <div class="left-tools">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="(item, idx) in breadcrumb" :key="idx">{{ item }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <!-- 中间：独立搜索栏 -->
        <div class="center-search">
          <el-input v-model="searchText" placeholder="搜索..." clearable style="width: 420px" />
          <el-button type="primary" @click="onSearch">搜索</el-button>
        </div>

        <!-- 右侧：头像 + 用户名 + 下拉菜单 -->
        <div class="right-user">
          <el-dropdown>
            <span class="user-trigger">
              <el-avatar :size="28" :src="headerAvatar || defaultAvatar" />
              <span class="user-name">{{ userName }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="onProfile">个人中心</el-dropdown-item>
                <el-dropdown-item @click="onLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容显示区域 -->
      <el-main class="pc-admin__main">
        <!-- 使用子路由渲染右侧主内容区域 -->
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
// 使用 Element Plus 实现基础管理端布局与交互（桌面端）
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
// 图标按需：已在 main.js 全局注册 @element-plus/icons-vue，这里可直接使用组件标签
import AdminSidebar from './components/AdminSidebar.vue'
import menus from './menu/adminMenu.js'
// 图标已全局注册，无需在此按需引入

const router = useRouter()
const route = useRoute()

// 菜单数据（动态）
const menusRef = menus
// 当前激活的菜单项：跟随路由名称
const activeMenu = ref(route.name)
// 面包屑（示例）
const breadcrumb = ref(['首页', '管理后台', route.name || 'dashboard'])
// 顶部搜索框
const searchText = ref('')

// 选择菜单：使用路由驱动右侧内容
const onSelectMenu = (index) => {
  router.push({ name: index })
  activeMenu.value = index
  breadcrumb.value = ['首页', '管理后台', index]
}

// 点击搜索按钮
const onSearch = () => {
  if (!searchText.value) {
    ElMessage.info('请输入搜索内容')
    return
  }
  ElMessage.success(`已搜索：${searchText.value}`)
}

// 用户菜单：个人中心 / 退出登录
import { useUserStore } from '@/store/user'
const userStore = useUserStore()
const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

/**
 * 将后端返回的头像字段转换为前端可显示的 /images 预览路径
 * @param {string} p
 * @returns {string}
 */
function toImagesPreview(p) {
  if (!p || typeof p !== 'string') return ''
  // 兼容处理：去除可能已存在的 /public/images/ 或 /images/ 前缀，统一加上 /images/
  const fileName = String(p).replace(/^\/public\/images\//, '').replace(/^\/images\//, '')
  return `/images/${fileName}`
}

// 头部显示的头像与用户名（从 Store 映射）
const headerAvatar = computed(() => toImagesPreview((userStore.user && userStore.user.avatarUrl) || ''))
const userName = computed(() => (userStore.user && userStore.user.username) || '管理员')
const onProfile = () => {
  // 跳转到管理端子路由 /admin/profile，在右侧视图区域展示个人中心页面
  router.push({ name: 'admin-profile' })
}
const onLogout = async () => {
  // 调用 Pinia 的退出登录，并跳转到登录页
  try { await userStore.logout() } catch (_) {}
  router.push({ name: 'login' })
}
</script>

<style scoped>
/* 桌面端布局采用 px，不参与 px->vw 转换（通过 postcss.config.js 的 selectorBlackList 以及 admin 目录 exclude） */
.pc-admin { height: 100vh; }
.pc-admin__aside { border-right: 1px solid #eee; }
.pc-admin__header { display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; border-bottom: 1px solid #eee; background: #fff; }
/* 三段式网格布局：左/中/右 固定区域，搜索居中 */
.pc-admin__header--grid { display: grid; grid-template-columns: 1fr auto 1fr; column-gap: 16px; align-items: center; }
.pc-admin__header--grid .left-tools { justify-self: start; }
.pc-admin__header--grid .center-search { justify-self: center; display: flex; gap: 8px; }
.pc-admin__header--grid .right-user { justify-self: end; }
.user-trigger { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
.user-name { color: var(--el-text-color-regular); }

.pc-admin__main { padding: 16px; background: #f5f7fa; }
.logo { height: 56px; display: flex; align-items: center; padding: 0 12px; font-weight: 600; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.panel :deep(.el-card__header) { font-weight: 600; }
</style>
