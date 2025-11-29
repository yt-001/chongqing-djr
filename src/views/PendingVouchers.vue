<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user.js'
import OrderCard from '@/components/OrderCard.vue'
import { fetchExpiredPaidOrdersPage, fetchPendingValidOrdersPage } from '@/api'

const router = useRouter()

/**
 * 返回上一页
 */
function goBack() { router.back() }

const validOrders = ref([])
const expiredOrders = ref([])
const loading = ref(false)
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)
const loadingMore = ref(false)
const active = ref('valid')
/**
 * 加载指示器的最小展示时长（毫秒）
 */
const MIN_LOADING_MS = 600

/**
 * 加载当前选中 Tab 的订单列表（待使用或已过期）
 * 排序：按 `createTime` 降序
 */
async function loadOrders() {
  loading.value = true
  try {
    const userId = useUserStore().user?.id
    if (active.value === 'valid') {
      const data = await fetchPendingValidOrdersPage({
        pageNum: pageNum.value,
        pageSize: pageSize.value,
        sortField: 'createTime',
        sortDirection: 'DESC',
        query: { userId }
      })
      const list = (data.list || [])
      validOrders.value = list
      total.value = data.total || 0
      hasMore.value = (list.length >= pageSize.value)
    } else {
      const data = await fetchExpiredPaidOrdersPage({
        pageNum: pageNum.value,
        pageSize: pageSize.value,
        sortField: 'createTime',
        sortDirection: 'DESC',
        query: { userId }
      })
      const list = (data.list || [])
      expiredOrders.value = list
      total.value = data.total || 0
      hasMore.value = (list.length >= pageSize.value)
    }
  } finally {
    loading.value = false
  }
}

/**
 * 追加加载当前选中 Tab 的下一页（按 `createTime` 降序）
 */
async function loadNextPage() {
  if (!hasMore.value || loadingMore.value) return
  loadingMore.value = true
  try {
    const userId = useUserStore().user?.id
    if (active.value === 'valid') {
      const [data] = await Promise.all([
        fetchPendingValidOrdersPage({
          pageNum: pageNum.value + 1,
          pageSize: pageSize.value,
          sortField: 'createTime',
          sortDirection: 'DESC',
          query: { userId }
        }),
        new Promise((r) => setTimeout(r, MIN_LOADING_MS))
      ])
      const list = (data.list || [])
      validOrders.value = validOrders.value.concat(list)
      pageNum.value += 1
      hasMore.value = (list.length >= pageSize.value)
    } else {
      const [data] = await Promise.all([
        fetchExpiredPaidOrdersPage({
          pageNum: pageNum.value + 1,
          pageSize: pageSize.value,
          sortField: 'createTime',
          sortDirection: 'DESC',
          query: { userId }
        }),
        new Promise((r) => setTimeout(r, MIN_LOADING_MS))
      ])
      const list = (data.list || [])
      expiredOrders.value = expiredOrders.value.concat(list)
      pageNum.value += 1
      hasMore.value = (list.length >= pageSize.value)
    }
  } finally {
    loadingMore.value = false
  }
}

/**
 * 全局滚动：接近页面底部时加载下一页
 */
function handleScroll() {
  const { scrollTop, clientHeight, scrollHeight } = document.documentElement
  if (scrollTop + clientHeight >= scrollHeight - 50) {
    loadNextPage()
  }
}

/**
 * 监听 Tab 切换：重置分页并加载对应数据
 */
watch(active, async () => {
  pageNum.value = 1
  hasMore.value = true
  if (active.value === 'valid') {
    validOrders.value = []
  } else {
    expiredOrders.value = []
  }
  await loadOrders()
})

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
    <van-nav-bar title="待消费卷" left-text="返回" left-arrow @click-left="goBack" />
    <div class="list" v-loading="loading">
      <van-tabs class="seg-tabs" v-model:active="active" swipeable animated :border="false">
      <van-tab title="待使用" name="valid">
          <div class="section">
            <div v-for="o in validOrders" :key="o.orderNo" @click="openDetail(o)">
              <OrderCard
                :order="o"
                :show-times="['paymentTime','expireTime']"
                :inline-times="true"
              />
            </div>
            <div v-if="!validOrders.length && !loading" class="empty">暂无数据</div>
          </div>
        </van-tab>
        <van-tab title="已过期" name="expired">
          <div class="section">
            <div v-for="o in expiredOrders" :key="o.orderNo" @click="openDetail(o)">
              <OrderCard
                :order="o"
                :show-times="['paymentTime','expireTime']"
                :inline-times="true"
              />
            </div>
            <div v-if="!expiredOrders.length && !loading" class="empty">暂无数据</div>
          </div>
        </van-tab>
      </van-tabs>

      <div v-if="loadingMore" class="loading-more">
        <van-loading type="spinner" size="18" />
        <span>加载中...</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f5f6f7; }
.list { padding: 12px; display: block; }
.section { display: grid; gap: 12px; }
.section-title { font-weight: 700; color: #143a72; padding: 4px 2px; }
.section-title.muted { color: #90a4ae; }
.empty { text-align: center; color: #90a4ae; padding: 24px 0; min-height: 40vh; display: flex; align-items: center; justify-content: center; }
.loading-more { display: flex; align-items: center; gap: 8px; justify-content: center; padding: 10px 0; color: #607d8b; }
/* 移动端胶囊式 Tabs 样式（参考登录页） */
.seg-tabs :deep(.van-tabs__wrap) { margin: 4px 0 12px; background: rgba(255,255,255,0.95); border-radius: 14px; padding: 4px; box-shadow: 0 6px 18px rgba(0,0,0,0.08); }
.seg-tabs :deep(.van-tabs__line) { display: none; }
.seg-tabs :deep(.van-tabs__nav) { background: transparent; }
.seg-tabs :deep(.van-tab) { border-radius: 10px; }
.seg-tabs :deep(.van-tab--active) { background: #eef5ff; }
.seg-tabs :deep(.van-tabs__content) { min-height: 60vh; }
</style>
