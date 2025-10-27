<script setup>
// 注册页，根据角色区分：visitor(游客) / admin(管理员)
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const role = computed(() => (route.query.role === 'admin' ? 'admin' : 'visitor'))

// 游客注册表单
const visitorForm = ref({ nickname: '', phone: '' })
// 管理员注册表单
const adminForm = ref({ username: '', password: '', confirm: '' })

const onSubmitVisitor = () => {
  // 这里通常会调用接口进行注册
  // 注册成功后返回登录页
  router.replace({ name: 'login' })
}

const onSubmitAdmin = () => {
  // 这里通常会调用接口进行注册
  // 确认密码校验示例
  if (adminForm.value.password !== adminForm.value.confirm) {
    // 真实项目中可用 Toast 提示
    alert('两次输入的密码不一致')
    return
  }
  router.replace({ name: 'login' })
}
</script>

<template>
  <div class="register-page">
    <div class="brand">
      <h1>账号注册</h1>
      <p>当前角色：{{ role === 'admin' ? '管理员' : '游客' }}</p>
    </div>

    <template v-if="role === 'visitor'">
      <van-form @submit="onSubmitVisitor">
        <van-cell-group inset>
          <van-field v-model="visitorForm.nickname" name="nickname" label="昵称" placeholder="请输入昵称" required />
          <van-field v-model="visitorForm.phone" name="phone" type="tel" label="手机号" placeholder="请输入手机号" />
        </van-cell-group>
        <div class="actions">
          <van-button round block type="primary" native-type="submit">注 册</van-button>
          <van-button round block type="default" @click="router.back()">返 回</van-button>
        </div>
      </van-form>
    </template>

    <template v-else>
      <van-form @submit="onSubmitAdmin">
        <van-cell-group inset>
          <van-field v-model="adminForm.username" name="username" label="账号" placeholder="请输入管理员账号" required />
          <van-field v-model="adminForm.password" name="password" type="password" label="密码" placeholder="请输入密码" required />
          <van-field v-model="adminForm.confirm" name="confirm" type="password" label="确认密码" placeholder="请再次输入密码" required />
        </van-cell-group>
        <div class="actions">
          <van-button round block type="primary" native-type="submit">注 册</van-button>
          <van-button round block type="default" @click="router.back()">返 回</van-button>
        </div>
      </van-form>
    </template>
  </div>
</template>

<style scoped>
/* 全屏容器 */
.register-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #ffffff 0%, #f6f7fb 100%);
  padding: 24px 16px 32px;
  box-sizing: border-box;
}

/* 顶部品牌区 */
.brand {
  text-align: center;
  padding: 24px 0 12px;
}
.brand h1 { margin: 0 0 6px; font-size: 22px; }
.brand p { margin: 0; color: #888; font-size: 13px; }

/* 表单按钮区 */
.actions { margin: 16px 12px; display: grid; gap: 12px; }
</style>
