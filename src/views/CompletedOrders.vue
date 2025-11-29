<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user.js'
import OrderCard from '@/components/OrderCard.vue'
import { fetchOrdersPage } from '@/api'

const router = useRouter()

/**
 * 返回上一页
 */
function goBack() { router.back() }

const orders = ref([])
const loading = ref(false)
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)
const loadingMore = ref(false)
/**
 * 加载指示器的最小展示时长（毫秒）
 */
const MIN_LOADING_MS = 600

/**
 * 加载“已完成”订单列表（状态=2 已使用）
 * 排序：按 `createTime` 降序
 */
async function loadOrders() {
  loading.value = true
  try {
    const userId = useUserStore().user?.id
    const data = await fetchOrdersPage({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      sortField: 'createTime',
      sortDirection: 'DESC',
      query: { statusList: [2], userId }
    })
    const first = (data.list || [])
    orders.value = first
    total.value = data.total || 0
    hasMore.value = (first.length >= pageSize.value)
  } finally {
    loading.value = false
  }
}

/**
 * 追加加载下一页（下拉抖动触发，按 `createTime` 降序）
 */
async function loadNextPage() {
  if (!hasMore.value || loadingMore.value) return
  loadingMore.value = true
  try {
    const userId = useUserStore().user?.id
    const [data] = await Promise.all([
      fetchOrdersPage({
        pageNum: pageNum.value + 1,
        pageSize: pageSize.value,
        sortField: 'createTime',
        sortDirection: 'DESC',
        query: { statusList: [2], userId }
      }),
      new Promise((r) => setTimeout(r, MIN_LOADING_MS))
    ])
    const nextList = (data.list || [])
    orders.value = orders.value.concat(nextList)
    pageNum.value += 1
    hasMore.value = (nextList.length >= pageSize.value)
  } finally {
    loadingMore.value = false
  }
}

/**
 * 页面滚动触发：当滚动接近底部时，二次滑动触发加载下一页
 */
function handleScroll() {
  const { scrollTop, clientHeight, scrollHeight } = document.documentElement
  if (scrollTop + clientHeight >= scrollHeight - 50) {
    loadNextPage()
  }
}

onMounted(async () => {
  await loadOrders()
  window.addEventListener('scroll', handleScroll)
})
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

/**
 * 打开订单详情页
 * @param {Object} o 订单对象
 */
function openDetail(o) {
  if (!o || !o.orderNo) return
  sessionStorage.setItem('orderDetail', JSON.stringify(o))
  router.push({ name: 'order-detail', params: { orderNo: o.orderNo } })
}
</script>

<template>
  <div class="page">
    <van-nav-bar title="已完成" left-text="返回" left-arrow @click-left="goBack" />
    <div
      class="list"
      v-loading="loading"
      
    >
      <div v-for="(o,i) in orders" :key="o.orderNo" @click="openDetail(o)">
        <OrderCard :order="o" :show-times="['paymentTime','usedTime']" :inline-times="true" />
      </div>
      <div v-if="loadingMore" class="loading-more">
        <van-loading type="spinner" size="18" />
        <span>加载中...</span>
      </div>
      <div v-if="!orders.length && !loading" class="empty">暂无数据</div>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f5f6f7; }
.list { padding: 12px; display: grid; gap: 12px; }
.empty { text-align: center; color: #90a4ae; padding: 24px 0; }
.loading-more { display: flex; align-items: center; gap: 8px; justify-content: center; padding: 10px 0; color: #607d8b; }
</style>
