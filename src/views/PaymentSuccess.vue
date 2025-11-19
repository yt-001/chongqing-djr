<script setup>
import { useRouter, useRoute } from 'vue-router'
import { ref } from 'vue'

const router = useRouter()
const route = useRoute()
const name = ref(route.query.name || '景点')
const count = ref(Number(route.query.count || 1))
const method = ref(route.query.method || 'wechat')

/**
 * 返回上一页
 */
function goBack() {
  router.back()
}

/**
 * 去使用（回到景点详情）
 */
function goUse() {
  const id = route.params?.id
  if (id) return router.push({ name: 'scenic-detail', params: { id } })
  router.push({ name: 'recommend' })
}
</script>

<template>
  <div class="pay-success">
    <van-nav-bar title="支付成功" left-text="返回" left-arrow @click-left="goBack" />
    <div class="card">
      <div class="icon-wrap">
        <van-icon name="success" color="#12b981" size="36" />
      </div>
      <div class="title">支付成功</div>
      <div class="desc">您已成功购买 {{ count }} 张「{{ name }}」门票</div>
      <div class="tips">支付方式：{{ method === 'wechat' ? '微信支付' : '支付宝' }}</div>
      <div class="actions">
        <van-button round type="primary" @click="goUse">去使用</van-button>
        <van-button round plain style="margin-left:8px" @click="goBack">返回</van-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pay-success { background: #f5f6f7; min-height: 100vh; }
.card { margin: 12px; background: #fff; border-radius: 14px; box-shadow: 0 6px 16px rgba(0,0,0,0.06); padding: 16px; text-align: center; }
.icon-wrap { margin-top: 12px; }
.title { font-weight: 800; font-size: 18px; margin-top: 8px; }
.desc { color: #555; font-size: 14px; margin-top: 6px; }
.tips { color: #888; font-size: 12px; margin-top: 4px; }
.actions { margin-top: 12px; display: flex; justify-content: center; }
</style>