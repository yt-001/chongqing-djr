<script setup>
import { computed } from 'vue'
import { showToast } from 'vant'

const props = defineProps({
  order: { type: Object, required: true },
  showTimes: { type: Array, default: () => ['paymentTime', 'usedTime', 'expireTime'] },
  inlineTimes: { type: Boolean, default: false }
})

/**
 * 映射产品类型文案
 * @returns {string}
 */
const productTypeText = computed(() => {
  const t = Number(props.order?.productType || 0)
  if (t === 1) return '景点门票'
  if (t === 2) return '美食消费券'
  if (t === 3) return '住宿消费券'
  return '未知产品'
})

/**
 * 产品类型标签样式（0.3透明背景）
 * @returns {{background:string,color:string}}
 */
const typeStyle = computed(() => {
  const t = Number(props.order?.productType || 0)
  // 基础色：景点(蓝)、美食(粉红)、住宿(青绿)
  const cfg = {
    1: { bg: 'rgba(21,101,192,0.3)', fg: '#1565c0' },
    2: { bg: 'rgba(233,30,99,0.3)', fg: '#e91e63' },
    3: { bg: 'rgba(0,121,107,0.3)', fg: '#00796b' }
  }[t] || { bg: 'rgba(96,125,139,0.3)', fg: '#607d8b' }
  return { background: cfg.bg, color: cfg.fg }
})

/**
 * 映射订单状态文案与颜色
 * @returns {{text:string,color:string}}
 */
const statusInfo = computed(() => {
  const s = Number(props.order?.status || 0)
  const expire = props.order?.expireTime ? new Date(props.order.expireTime).getTime() : null
  const used = props.order?.usedTime ? new Date(props.order.usedTime).getTime() : null
  const now = Date.now()
  const isExpired = (s === 1) && !used && !!expire && now > expire
  // 标签色系：强调与可视区分，透明度轻微降低更柔和
  if (isExpired) return { text: '已过期', color: 'rgba(121,85,72,0.9)' }
  if (s === 0) return { text: '待支付', color: 'rgba(255,152,0,0.9)' }
  if (s === 1) return { text: '已支付', color: 'rgba(33,150,243,0.9)' }
  if (s === 2) return { text: '已使用', color: 'rgba(76,175,80,0.9)' }
  if (s === 3) return { text: '已取消', color: 'rgba(158,158,158,0.9)' }
  if (s === 4) return { text: '已退款', color: 'rgba(244,67,54,0.9)' }
  return { text: '未知状态', color: 'rgba(96,125,139,0.9)' }
})

/**
 * 金额格式化
 * @param {number|string} n
 * @returns {string}
 */
function fmtAmount(n) {
  const v = Number(n || 0)
  return `¥ ${v.toFixed(2)}`
}

/**
 * 时间格式化：YYYY-MM-DD HH:mm
 * @param {string|number|Date} t
 * @returns {string}
 */
function fmtTime(t) {
  if (!t) return '-'
  const d = new Date(t)
  const pad = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * 卡片自带点击反馈（由父级真正处理导航）
 */
function onClickCard() {}
</script>

<template>
  <div class="order-card" @click="onClickCard">
    <div class="hd">
      <div class="title">
        <span class="name">{{ props.order.productName }}</span>
        <span class="type" :style="typeStyle">{{ productTypeText }}</span>
      </div>
      <van-tag :style="{ background: statusInfo.color, color: '#fff' }" round>{{ statusInfo.text }}</van-tag>
    </div>
    <div class="meta">
      <span class="no">订单编号：{{ props.order.orderNo }}</span>
      <span class="pid">产品ID：{{ props.order.productId }}</span>
    </div>
    <div class="desc">{{ props.order.description }}</div>
    <div class="amount">
      <span>数量：{{ props.order.quantity }}</span>
      <span>单价：{{ fmtAmount(props.order.unitPrice) }}</span>
      <span class="total">合计：{{ fmtAmount(props.order.totalAmount) }}</span>
    </div>
    <div class="times" :class="{ inline: inlineTimes }">
      <span v-if="showTimes.includes('paymentTime')">支付时间：{{ fmtTime(props.order.paymentTime) }}</span>
      <span v-if="showTimes.includes('usedTime')">使用时间：{{ fmtTime(props.order.usedTime) }}</span>
      <span v-if="showTimes.includes('expireTime')">过期时间：{{ fmtTime(props.order.expireTime) }}</span>
    </div>
  </div>
</template>

<style scoped>
.order-card { background: #fff; border: 1px solid #e6f0fb; border-radius: 12px; padding: 12px; display: grid; gap: 8px; }
.hd { display: flex; align-items: center; justify-content: space-between; }
 .title { display: flex; align-items: center; gap: 8px; }
 .name { font-weight: 700; color: #143a72; }
.type { font-size: 12px; padding: 2px 8px; border-radius: 10px; }
.meta { display: flex; gap: 12px; color: #607d8b; font-size: 12px; }
.desc { color: #37474f; font-size: 13px; }
.amount { display: flex; gap: 12px; align-items: center; font-size: 13px; }
.amount .total { font-weight: 700; color: #1565c0; }
.times { display: grid; gap: 4px; color: #90a4ae; font-size: 12px; }
.times.inline { display: flex; gap: 12px; flex-wrap: wrap; }
</style>