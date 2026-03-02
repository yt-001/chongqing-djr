<script setup>
// 全屏登录页（包含游客登录与管理员登录），使用 Vant 组件
// 变更点：
// 1）左上角新增返回按钮；
// 2）背景图替换为本地重庆夜景图；
// 3）管理员登录的第一个输入框为账号，支持邮箱或电话。
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { showToast } from 'vant'

// 选项卡：visitor(游客) / admin(管理员)
const activeTab = ref('visitor')
const router = useRouter()
// 按钮加载状态（统一一个loading，保证至少1秒动画）
const loading = ref(false)

// 根据窗口宽度切换 PC/移动端布局（>=1024 视为 PC）
const isPc = ref(window.innerWidth >= 1024)
function handleResize() { isPc.value = window.innerWidth >= 1024 }
onMounted(() => window.addEventListener('resize', handleResize))
onBeforeUnmount(() => window.removeEventListener('resize', handleResize))

// 返回上一页（优先返回历史，否则回到首页）
const goBack = () => {
  // 返回上一路由；若无可返回历史则回到首页
  const hasHistory = window.history.length > 1 || document.referrer !== ''
  if (hasHistory) {
    router.back()
  } else {
    router.replace('/')
  }
}

// 用户登录表单数据（账号为邮箱或电话）
const visitorForm = ref({ emailOrPhone: '', password: '', role: 1 })
// 管理员登录表单数据（账号为邮箱或电话）
const adminForm = ref({ emailOrPhone: '', password: '', role: 0 })

// 提交：仅做占位校验与跳转示例
const onSubmitVisitor = async () => {
  const store = useUserStore()
  loading.value = true
  const start = Date.now()
  try {
    const user = await store.login(visitorForm.value)
    const elapsed = Date.now() - start
    if (elapsed < 1000) {
      await new Promise((r) => setTimeout(r, 1000 - elapsed))
    }
    showToast({ message: '登录成功', position: 'top' })
    const target = user?.role === 0 ? '/admin' : '/'
    router.replace(target)
  } catch (e) {
    const elapsed = Date.now() - start
    if (elapsed < 1000) {
      await new Promise((r) => setTimeout(r, 1000 - elapsed))
    }
    const code = e?.code ?? e?.status
    const msg = (e?.data && (e.data.msg || e.data.message)) || e?.msg || e?.message || '登录失败'
    const text = code ? `${msg}（代码：${code}）` : msg
    showToast({ message: text, position: 'top' })
  } finally {
    loading.value = false
  }
}

const onSubmitAdmin = async () => {
  const store = useUserStore()
  loading.value = true
  const start = Date.now()
  try {
    const user = await store.login(adminForm.value)
    const elapsed = Date.now() - start
    if (elapsed < 1000) {
      await new Promise((r) => setTimeout(r, 1000 - elapsed))
    }
    showToast({ message: '登录成功', position: 'top' })
    const target = user?.role === 0 ? '/admin' : '/'
    router.replace(target)
  } catch (e) {
    const elapsed = Date.now() - start
    if (elapsed < 1000) {
      await new Promise((r) => setTimeout(r, 1000 - elapsed))
    }
    const code = e?.code ?? e?.status
    const msg = (e?.data && (e.data.msg || e.data.message)) || e?.msg || e?.message || '登录失败'
    const text = code ? `${msg}（代码：${code}）` : msg
    showToast({ message: text, position: 'top' })
  } finally {
    loading.value = false
  }
}

// 前往注册页
const goRegister = (role) => {
  router.push({ name: 'register', query: { role } })
}
</script>

<template>
  <div class="login-page">
    <!-- 左上角返回按钮 -->
    <!-- 移动端显示返回按钮，PC 端不渲染，避免高度与布局影响 -->
    <button v-if="!isPc" class="back-btn" aria-label="返回" @click="goBack">
      <van-icon name="arrow-left" size="20" />
      <span>返回</span>
    </button>

    <!-- 顶部品牌区文案 -->
    <div class="brand">
      <h1>梁平文旅 · 欢迎回来</h1>
      <p>探索双桂福地，悦享柚乡竹海</p>
    </div>

    <!-- 桌面端：Element Plus 布局；移动端：Vant 布局 -->
    <div v-if="isPc" class="pc-login">
      <!-- PC 返回按钮：Element Plus，固定定位不占文档高度 -->
      <el-button class="pc-back" type="default" @click="goBack">
        <arrow-left />
        <span style="margin-left:6px;">返回</span>
      </el-button>
      <div class="pc-card">
        <el-tabs v-model="activeTab" class="pc-tabs">
          <el-tab-pane label="用户登录" name="visitor">
            <el-form :model="visitorForm" label-width="80px" class="pc-form">
              <el-form-item label="账号">
                <el-input v-model="visitorForm.emailOrPhone" placeholder="请输入邮箱或电话" autocomplete="username" />
              </el-form-item>
              <el-form-item label="密码">
                <el-input v-model="visitorForm.password" type="password" placeholder="请输入密码" autocomplete="current-password" />
              </el-form-item>
              <div class="pc-actions">
                <el-button type="primary" :loading="loading" :disabled="loading" @click="onSubmitVisitor">登 录</el-button>
                <el-button @click="goRegister('visitor')">注 册</el-button>
              </div>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="管理员登录" name="admin">
            <el-form :model="adminForm" label-width="80px" class="pc-form">
              <el-form-item label="账号">
                <el-input v-model="adminForm.emailOrPhone" placeholder="请输入邮箱或电话" autocomplete="username" />
              </el-form-item>
              <el-form-item label="密码">
                <el-input v-model="adminForm.password" type="password" placeholder="请输入密码" autocomplete="current-password" />
              </el-form-item>
              <div class="pc-actions">
                <el-button type="primary" :loading="loading" :disabled="loading" @click="onSubmitAdmin">登 录</el-button>
                <el-button @click="goRegister('admin')">注 册</el-button>
              </div>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <div v-else class="m-login">
      <div class="panel">
        <van-tabs class="seg-tabs" v-model:active="activeTab" shrink swipeable>
        <van-tab title="用户登录" name="visitor">
          <van-form @submit="onSubmitVisitor">
            <van-cell-group inset>
              <van-field v-model="visitorForm.emailOrPhone" name="emailOrPhone" label="账号" placeholder="请输入邮箱或电话" clearable required type="text" inputmode="email" autocomplete="username" />
              <van-field v-model="visitorForm.password" name="password" type="password" label="密码" placeholder="请输入密码" clearable required autocomplete="current-password" />
            </van-cell-group>
            <div class="actions">
              <van-button round block type="primary" :loading="loading" :disabled="loading" native-type="submit">登 录</van-button>
              <van-button round block type="default" @click="goRegister('visitor')">注 册</van-button>
            </div>
          </van-form>
        </van-tab>
        <van-tab title="管理员登录" name="admin">
          <van-form @submit="onSubmitAdmin">
            <van-cell-group inset>
              <van-field v-model="adminForm.emailOrPhone" name="emailOrPhone" label="账号" placeholder="请输入邮箱或电话" clearable required type="text" inputmode="email" autocomplete="username" />
              <van-field v-model="adminForm.password" name="password" type="password" label="密码" placeholder="请输入密码" clearable required autocomplete="current-password" />
            </van-cell-group>
            <div class="actions">
              <van-button round block type="primary" :loading="loading" :disabled="loading" native-type="submit">登 录</van-button>
              <van-button round block type="default" @click="goRegister('admin')">注 册</van-button>
            </div>
          </van-form>
        </van-tab>
      </van-tabs>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 全屏容器，使用重庆夜景作为背景图 */
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  /* 使用本地图片作为背景，等比裁切铺满 */
  background: url('@/assets/img/重庆-bg.png') center/cover no-repeat fixed;
  /* 叠加一层浅色蒙层，保证文字可读性 */
  position: relative;
  padding: 24px 16px 32px;
  box-sizing: border-box;
  max-width: 100vw;            /* 防止宽度超出视口 */
  overflow-x: hidden;          /* 避免横向滚动 */
}
.login-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
}
.login-page > * { position: relative; z-index: 1; }

/* 左上角返回按钮 */
.back-btn {
  z-index: 10;
  pointer-events: auto;
  position: absolute;
  top: 14px;
  left: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  color: #333;
  border: none;
}
.back-btn:active { transform: scale(0.98); }
/* 桌面端强制隐藏（双保险），防止样式层面影响布局或高度 */
@media (min-width: 1024px) {
  .back-btn { display: none !important; }
}

/* 顶部品牌区 */
.brand {
  text-align: center;
  padding: 36px 0 12px;
  color: #fff;
  text-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.brand h1 { margin: 0 0 6px; font-size: 22px; }
.brand p { margin: 0; font-size: 13px; opacity: 0.9; }
@media (min-width: 1024px) {
  /* 桌面端：压缩标题区，避免过高 */
  .brand { padding: 24px 0 8px; }
}

/* Tabs 分段样式（圆角胶囊） */
.seg-tabs :deep(.van-tabs__wrap) {
  margin: 8px 12px 12px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 14px;
  padding: 4px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.10);
}
.seg-tabs :deep(.van-tabs__line) { display: none; }
.seg-tabs :deep(.van-tabs__nav) { background: transparent; }
.seg-tabs :deep(.van-tab) {
  border-radius: 10px;
  transition: background 0.2s ease, color 0.2s ease;
}
.seg-tabs :deep(.van-tab--active) {
  background: #1f6fff;
  color: #fff;
}

/* 响应式居中容器：PC 端居中、移动端全宽 */
.login-container {
  max-width: 920px;              /* PC 端最大宽度，避免过宽变形 */
  margin: 0 auto;                /* 居中 */
  width: 100%;
}
@media (max-width: 768px) {
  .login-container { max-width: 560px; }
}
@media (max-width: 480px) {
  .login-container { max-width: 100%; }
}

/* 分区登录整体白色面板 */
.panel {
  margin: 4px 12px 0;
  padding: 12px 0 8px;           /* PC 端适当加大内边距 */
  background: rgba(255, 255, 255, 0.98);
  border-radius: 14px;
  box-shadow: 0 10px 24px rgba(0,0,0,0.16);
}

/* 表单卡片优化（与 panel 统一） */
:deep(.van-cell-group--inset) {
  margin: 12px 16px;             /* PC 端适当增大左右留白 */
  border-radius: 12px;
  overflow: hidden;
  box-shadow: none;
  border: 1px solid rgba(0,0,0,0.06);
}

/* 表单按钮区 */
.actions {
  margin: 16px 16px;            /* 与表单留白统一 */
  display: grid;                 /* 网格布局，便于间距控制 */
  gap: 12px;                     /* 垂直间距 */
}

/* 适配桌面端按钮宽度：在 PC 端按钮不要100%占满，以视觉居中为主 */
@media (min-width: 1024px) {
  .actions :deep(.van-button) { width: 60%; justify-self: center; }
}

/* 桌面端 Element Plus 卡片与表单样式 */
.pc-login { display: flex; justify-content: center; }
.pc-card { width: 680px; max-width: 92vw; background: rgba(255,255,255,0.98); border-radius: 12px; box-shadow: 0 10px 24px rgba(0,0,0,0.16); padding: 16px 20px; }
.pc-tabs :deep(.el-tabs__nav-wrap) { margin-bottom: 12px; }
.pc-form { padding: 8px 6px; }
.pc-actions { display: flex; gap: 12px; justify-content: center; margin-top: 8px; }
.pc-form :deep(.el-input__wrapper) { border-radius: 8px; }
/* PC 返回按钮：固定定位，不占文档流高度 */
.pc-back { position: fixed; top: 18px; left: 18px; z-index: 20; }
/* 移动端容器：保留原有 Vant 样式作用域 */
.m-login .seg-tabs :deep(.van-tabs__wrap) { margin: 8px 12px 12px; background: rgba(255, 255, 255, 0.95); border-radius: 14px; padding: 4px; box-shadow: 0 6px 18px rgba(0,0,0,0.10); }
.m-login .panel { margin: 4px 12px 0; padding: 6px 0 2px; background: rgba(255, 255, 255, 0.98); border-radius: 14px; box-shadow: 0 10px 24px rgba(0,0,0,0.16); }
.m-login .actions { margin: 16px 12px; display: grid; gap: 12px; }

/* 桌面端容器：Element Plus 样式（pc-前缀避免参与移动端 px->vw） */
.pc-login { display: flex; justify-content: center; }
.pc-card { width: 680px; max-width: 92vw; background: rgba(255,255,255,0.98); border-radius: 12px; box-shadow: 0 10px 24px rgba(0,0,0,0.16); padding: 16px 20px; }
.pc-tabs :deep(.el-tabs__nav-wrap) { margin-bottom: 12px; }
.pc-form { padding: 8px 6px; }
.pc-actions { display: flex; gap: 12px; justify-content: center; margin-top: 8px; }
.pc-form :deep(.el-input__wrapper) { border-radius: 8px; }
/* PC 返回按钮：固定定位，不占文档流高度 */
.pc-back { position: fixed; top: 18px; left: 18px; z-index: 20; }
</style>