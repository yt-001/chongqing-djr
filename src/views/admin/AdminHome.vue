<template>
  <!-- 管理端页面布局：左侧导航栏 + 顶部工具栏 + 内容区域 -->
  <el-container class="pc-admin">
    <!-- 左侧导航栏 -->
    <el-aside width="220px" class="pc-admin__aside">
      <div class="logo">重庆文旅·管理端</div>
      <el-menu :default-active="activeMenu" class="el-menu-vertical-demo" @select="onSelectMenu">
        <el-menu-item index="dashboard">
          <el-icon><Monitor /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="attractions">
          <el-icon><Location /></el-icon>
          <span>景点管理</span>
        </el-menu-item>
        <el-menu-item index="restaurants">
          <el-icon><ForkSpoon /></el-icon>
          <span>餐饮管理</span>
        </el-menu-item>
        <el-menu-item index="orders">
          <el-icon><Document /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
        <el-menu-item index="users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 右侧主区域 -->
    <el-container>
      <!-- 顶部工具栏 -->
      <el-header class="pc-admin__header">
        <div class="left-tools">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="(item, idx) in breadcrumb" :key="idx">{{ item }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="right-tools">
          <el-input v-model="searchText" placeholder="搜索..." clearable style="width: 240px" />
          <el-button type="primary" @click="onSearch">搜索</el-button>
          <el-dropdown>
            <span class="el-dropdown-link">
              <el-avatar :size="28" icon="UserFilled" />
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
        <div v-if="activeMenu === 'dashboard'" class="panel">
          <el-card header="统计总览">
            <div class="stats">
              <el-statistic title="今日访问" :value="1268" />
              <el-statistic title="新增用户" :value="58" />
              <el-statistic title="订单数量" :value="132" />
            </div>
          </el-card>
        </div>
        <div v-else-if="activeMenu === 'attractions'" class="panel">
          <el-card header="景点管理">
            <el-empty description="即将接入景点列表与编辑功能" />
          </el-card>
        </div>
        <div v-else-if="activeMenu === 'restaurants'" class="panel">
          <el-card header="餐饮管理">
            <el-empty description="即将接入餐饮列表与编辑功能" />
          </el-card>
        </div>
        <div v-else-if="activeMenu === 'orders'" class="panel">
          <el-card header="订单管理">
            <el-empty description="即将接入订单列表与处理功能" />
          </el-card>
        </div>
        <div v-else-if="activeMenu === 'users'" class="panel">
          <el-card header="用户管理">
            <el-empty description="即将接入用户列表与角色配置" />
          </el-card>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
// 使用 Element Plus 实现基础管理端布局与交互（桌面端）
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
// 图标按需：已在 main.js 全局注册 @element-plus/icons-vue，这里可直接使用组件标签
import { Monitor, Location, ForkSpoon, Document, User } from '@element-plus/icons-vue'

// 当前激活的菜单项（默认仪表盘）
const activeMenu = ref('dashboard')
// 面包屑（示例）
const breadcrumb = ref(['首页', '管理后台', '仪表盘'])
// 顶部搜索框
const searchText = ref('')

// 切换菜单时更新面包屑与主内容
const onSelectMenu = (index) => {
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

// 用户菜单：个人中心 / 退出登录（示例）
const onProfile = () => ElMessage.info('即将进入个人中心')
const onLogout = () => ElMessage.success('已退出登录（示例）')
</script>

<style scoped>
/* 桌面端布局采用 px，不参与 px->vw 转换（通过 postcss.config.js 的 selectorBlackList 以及 admin 目录 exclude） */
.pc-admin { height: 100vh; }
.pc-admin__aside { border-right: 1px solid #eee; }
.pc-admin__header { display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; border-bottom: 1px solid #eee; background: #fff; }
.pc-admin__main { padding: 16px; background: #f5f7fa; }
.logo { height: 56px; display: flex; align-items: center; padding: 0 12px; font-weight: 600; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.panel :deep(.el-card__header) { font-weight: 600; }
</style>
