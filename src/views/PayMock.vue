<script setup>
import { useRouter, useRoute } from 'vue-router'
import { ref } from 'vue'
import { showToast } from 'vant'
import { createOrder } from '@/api'

const router = useRouter()
const route = useRoute()
const loading = ref(false)

/**
 * 模拟支付成功：读取订单草稿，设置为已支付并创建订单
 */
async function onPaySuccess() {
  if (loading.value) return
  loading.value = true
  try {
    await new Promise((r) => setTimeout(r, 600))
    const raw = sessionStorage.getItem('orderDraft')
    const draft = raw ? JSON.parse(raw) : null
    if (!draft) {
      showToast({ message: '订单信息缺失', position: 'top' })
      return
    }
    const payload = {
      ...draft,
      status: 1,
    }
    await createOrder(payload)
    sessionStorage.removeItem('orderDraft')
    router.push({ name: 'pay-success', params: route.params || {}, query: route.query || {} })
  } catch (e) {
    showToast({ message: '创建订单失败', position: 'top' })
  } finally {
    loading.value = false
  }
}

/**
 * 模拟支付失败：读取订单草稿，设置为未支付并创建订单，然后返回
 * 不传递支付/过期/使用时间，时间由后端负责生成
 */
async function onPayFail() {
  if (loading.value) return
  loading.value = true
  try {
    const raw = sessionStorage.getItem('orderDraft')
    const draft = raw ? JSON.parse(raw) : null
    if (!draft) {
      showToast({ message: '订单信息缺失', position: 'top' })
      return router.back()
    }
    const payload = {
      ...draft,
      status: 0,
      failReason: 'PaymentFailed',
    }
    await createOrder(payload)
    sessionStorage.removeItem('orderDraft')
    showToast({ message: '支付未完成', position: 'top' })
    router.back()
  } catch (_) {
    showToast({ message: '创建订单失败', position: 'top' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="pay-mock">
    <van-nav-bar title="模拟支付" left-text="返回" left-arrow @click-left="router.back()" />
    <div class="panel">
      <van-button block type="primary" round :loading="loading" loading-text="正在处理..." @click="onPaySuccess">支付成功</van-button>
      <van-button block type="danger" round plain style="margin-top:10px;" :disabled="loading" @click="onPayFail">支付失败</van-button>
    </div>
  </div>
  
</template>

<style scoped>
.pay-mock { min-height: 100vh; background: #f5f6f7; }
.panel { margin: 12px; background: #fff; border-radius: 14px; box-shadow: 0 6px 16px rgba(0,0,0,0.06); padding: 16px; }
</style>