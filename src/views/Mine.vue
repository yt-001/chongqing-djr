<script setup>
// 我的页示例，新增登录按钮
import { useRouter } from 'vue-router'
const router = useRouter()

// 跳转到登录页
const goLogin = () => {
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="page">
    <el-empty description="我的页面开发中">
      <template #default>
        <div class="actions">
          <van-button type="primary" round @click="goLogin">去登录</van-button>
        </div>
      </template>
    </el-empty>
  </div>
</template>

<style scoped>
.page { padding: 16px; }
.actions { display: flex; justify-content: center; }
</style>
