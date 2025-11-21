<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import QRCode from 'qrcode'
import JsBarcode from 'jsbarcode'
import { useRouter, useRoute } from 'vue-router'
import { updateOrder } from '@/api'
import { showToast } from 'vant'

const router = useRouter()
const route = useRoute()
const order = ref(null)
const qrRef = ref(null)
const barcodeRef = ref(null)
const codesRef = ref(null)
const codeWidth = ref(220)
const loadingCodes = ref(true)
const acting = ref(false)
const MIN_ACTING_MS = 800

/**
 * 绘制模拟二维码（非标准，仅用于 UI 展示）
 * @param {HTMLCanvasElement} canvas
 * @param {string} text
 */
function renderQRCode(canvas, text) {
  if (!canvas) return
  const size = Math.max(160, codeWidth.value || 220)
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, size, size)
}

/**
 * 绘制模拟条形码（非标准，仅用于 UI 展示）
 * @param {HTMLCanvasElement} canvas
 * @param {string} text
 */
function renderBarcode(svg, text) {
  if (!svg) return
  const w = Math.max(160, codeWidth.value || 220)
  svg.setAttribute('width', `${w}px`)
  svg.setAttribute('height', `90px`)
}

/**
 * 初始化订单详情：从 sessionStorage 读取并渲染二维码/条码
 */
async function initDetail() {
  const raw = sessionStorage.getItem('orderDetail')
  order.value = raw ? JSON.parse(raw) : null
  if (!order.value || !order.value.orderNo) {
    return router.back()
  }
  await nextTick()
  updateCodeWidth()
  renderQRCode(qrRef.value, '')
  renderBarcode(barcodeRef.value, '')
  setTimeout(async () => {
    try {
      const text = String(order.value.orderNo)
      await renderCodes(text)
    } finally { loadingCodes.value = false }
  }, 800)
}

/**
 * 根据容器宽度更新码宽度（使条形码与二维码左右对齐）
 */
function updateCodeWidth() {
  const el = codesRef.value
  if (!el) return
  const padding = 24 // code-box 左右各12px
  codeWidth.value = Math.max(160, Math.floor(el.clientWidth - padding))
}

/**
 * 按当前宽度渲染二维码与条形码
 * @param {string} text
 */
async function renderCodes(text) {
  updateCodeWidth()
  await QRCode.toCanvas(qrRef.value, text, { width: codeWidth.value, margin: 0 })
  barcodeRef.value.setAttribute('width', `${codeWidth.value}px`)
  JsBarcode(barcodeRef.value, text, { format: 'CODE128', displayValue: false, margin: 0 })
}

function handleResize() {
  if (!order.value || loadingCodes.value) { updateCodeWidth(); return }
  const text = String(order.value.orderNo)
  renderCodes(text)
}

onMounted(() => { initDetail(); window.addEventListener('resize', handleResize) })
onUnmounted(() => { window.removeEventListener('resize', handleResize) })

/**
 * 返回上一页
 */
function goBack() { router.back() }

/**
 * 取消订单（未完成页面）
 */
async function handleCancel() {
  if (!order.value || acting.value) return
  acting.value = true
  try {
    const payload = { status: 3 }
    if (order.value.id) payload.id = order.value.id
    if (order.value.orderNo) payload.orderNo = order.value.orderNo
    await Promise.all([
      updateOrder(payload),
      new Promise((r) => setTimeout(r, MIN_ACTING_MS)),
    ])
    order.value.status = 3
    sessionStorage.setItem('orderDetail', JSON.stringify(order.value))
    showToast({ message: '已取消订单', position: 'top' })
    router.back()
  } catch (_) {
    showToast({ message: '取消订单失败', position: 'top' })
  } finally {
    acting.value = false
  }
}

/**
 * 申请退款（待使用页面）
 */
async function handleRefund() {
  if (!order.value || acting.value) return
  acting.value = true
  try {
    const payload = { status: 4 }
    if (order.value.id) payload.id = order.value.id
    if (order.value.orderNo) payload.orderNo = order.value.orderNo
    await Promise.all([
      updateOrder(payload),
      new Promise((r) => setTimeout(r, MIN_ACTING_MS)),
    ])
    order.value.status = 4
    sessionStorage.setItem('orderDetail', JSON.stringify(order.value))
    showToast({ message: '已申请退款', position: 'top' })
    router.back()
  } catch (_) {
    showToast({ message: '申请退款失败', position: 'top' })
  } finally {
    acting.value = false
  }
}
</script>

<template>
  <div class="order-detail">
    <van-nav-bar title="订单详情" left-text="返回" left-arrow @click-left="goBack" />
    <div v-if="order" class="card">
      <div class="hd">
        <div class="title">{{ order.productName }}</div>
        <van-tag type="primary" round>{{ order.orderNo }}</van-tag>
      </div>
      <div class="meta">
        <span>产品类型：{{ order.productType === 1 ? '景点门票' : order.productType === 2 ? '美食消费券' : order.productType === 3 ? '住宿消费券' : '未知' }}</span>
        <span>数量：{{ order.quantity }}</span>
        <span>单价：¥ {{ Number(order.unitPrice || 0).toFixed(2) }}</span>
        <span class="total">合计：¥ {{ Number(order.totalAmount || 0).toFixed(2) }}</span>
      </div>
      <div class="desc">{{ order.description }}</div>

      <div class="codes" ref="codesRef">
        <div class="code-box">
          <svg ref="barcodeRef" class="barcode"></svg>
        </div>
        <div class="code-box">
          <canvas ref="qrRef" class="qr"></canvas>
        </div>
        <div class="code-cover" v-if="loadingCodes">
          <van-loading type="spinner" size="22" />
        </div>
      </div>
      <div class="actions">
        <van-button v-if="order.status === 0" type="danger" round block :loading="acting" loading-text="正在处理..." :disabled="acting" @click="handleCancel">取消订单</van-button>
        <van-button v-if="order.status === 1" type="warning" round block plain :loading="acting" loading-text="正在处理..." :disabled="acting" @click="handleRefund">申请退款</van-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-detail { min-height: 100vh; background: #f5f6f7; }
.card { margin: 12px; background: #fff; border-radius: 14px; box-shadow: 0 6px 16px rgba(0,0,0,0.06); padding: 14px; display: grid; gap: 10px; }
.hd { display: flex; align-items: center; justify-content: space-between; }
.title { font-weight: 800; font-size: 18px; color: #143a72; }
.meta { display: flex; gap: 12px; flex-wrap: wrap; color: #607d8b; font-size: 13px; }
.meta .total { font-weight: 700; color: #1565c0; }
.desc { color: #37474f; font-size: 13px; }
.codes { position: relative; display: grid; grid-template-columns: 1fr; gap: 12px; }
.code-box { background: #fafafa; border: 1px dashed #e0e0e0; border-radius: 12px; padding: 12px; text-align: center; display: flex; justify-content: center; align-items: center; }
.code-cover { position: absolute; inset: 0; display: flex; justify-content: center; align-items: center; background: rgba(255,255,255,0.7); border-radius: 12px; }
.qr { width: 100%; aspect-ratio: 1 / 1; }
.barcode { width: 100%; height: 90px; }
.actions { display: grid; gap: 8px; }
</style>