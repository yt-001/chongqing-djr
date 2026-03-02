<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { fetchOrdersPage } from '@/api'
import { processImageData } from '@/utils/imageUtils.js'
import { useUserStore } from '@/store/user.js'

const router = useRouter()
const userStore = useUserStore()

const list = ref([])
const loading = ref(false)
const finished = ref(false)
const pageNum = ref(1)
const pageSize = 10

/**
 * 加载预定列表
 * 排序：按 `createTime` 降序
 */
async function onLoad() {
  // 检查登录
  if (!userStore.isLoggedIn) {
    showToast('请先登录')
    loading.value = false
    finished.value = true
    return
  }

  if (loading.value) return
  loading.value = true

  try {
    const payload = {
      pageNum: pageNum.value,
      pageSize,
      sortField: 'createTime',
      sortDirection: 'DESC',
      query: {
        userId: userStore.user.id,
        productType: 3 // 仅查询住宿订单
      }
    }
    const res = await fetchOrdersPage(payload)
    const newData = res.list || res.records || res.data?.list || []

    if (pageNum.value === 1) {
      list.value = newData
    } else {
      list.value.push(...newData)
    }

    if (newData.length < pageSize) {
      finished.value = true
    } else {
      pageNum.value++
    }
  } catch (e) {
    finished.value = true
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

/**
 * 获取订单状态文本
 */
function getStatusText(status) {
  const map = {
    0: '待支付',
    1: '待使用', // 已支付
    2: '已完成',
    3: '已取消',
    4: '已退款'
  }
  return map[status] || '未知'
}

/**
 * 获取状态颜色
 */
function getStatusColor(status) {
  const map = {
    0: '#ff9f43',
    1: '#1dd1a1',
    2: '#54a0ff',
    3: '#999',
    4: '#ff6b6b'
  }
  return map[status] || '#999'
}

/**
 * 获取封面图
 */
function getCover(item) {
  // 假设订单中包含 snapshot 或需关联查询，此处简化处理
  // 如果后端订单接口返回了 product 快照信息最好，否则可能需要根据 productId 再查一次
  // 假设 item.productName, item.productImage 存在
  // 根据 mock_data，order 表没有直接存图片，通常需要关联查询。
  // 这里的 list 如果是单表查询可能没有图片。
  // 暂时使用默认图或尝试解析 item.productImage (如果后端做了关联)
  if (item.productImage) {
      return processImageData({ coverImage: item.productImage, images: '[]' }).coverUrl
  }
  return 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg' // 默认图
}

/**
 * 进入订单详情（写入会话缓存，避免读取到旧订单）
 * @param {Object} item 订单对象
 */
function goToDetail(item) {
    if (!item) return
    try {
        const safe = {
            ...item,
            orderNo: item.orderNo || item.id
        }
        sessionStorage.setItem('orderDetail', JSON.stringify(safe))
    } catch {}
    router.push({ name: 'order-detail', params: { orderNo: item.orderNo || item.id } })
}

onMounted(() => {
    if (userStore.isLoggedIn) {
        onLoad()
    }
})

</script>

<template>
  <div class="booking-page">
    <van-nav-bar title="我的预定" />
    
    <div v-if="!userStore.isLoggedIn" class="login-tip">
      <van-empty description="请先登录查看预定">
        <van-button round type="primary" @click="router.push('/login')">去登录</van-button>
      </van-empty>
    </div>

    <van-list
      v-else
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="onLoad"
      class="order-list"
    >
      <div
        v-for="item in list"
        :key="item.id"
        class="order-card"
        @click="goToDetail(item)"
      >
        <div class="card-header">
          <span class="order-no">订单号：{{ item.orderNo || item.id }}</span>
          <span class="status" :style="{ color: getStatusColor(item.status) }">
            {{ getStatusText(item.status) }}
          </span>
        </div>
        
        <div class="card-body">
          <div class="info">
            <div class="title">{{ item.productName || '未知住宿' }}</div>
            <div class="time">下单时间：{{ item.createTime }}</div>
            <div class="count">数量：{{ item.quantity }} 间</div>
            <div class="price">
              合计：<span>¥{{ item.totalAmount }}</span>
            </div>
          </div>
        </div>
        
        <div class="card-footer">
            <van-button size="small" round v-if="item.status === 0">去支付</van-button>
            <van-button size="small" round v-if="item.status === 1">查看券码</van-button>
            <van-button size="small" round plain type="primary">查看详情</van-button>
        </div>
      </div>
    </van-list>
  </div>
</template>

<style scoped>
.booking-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 50px;
}

.login-tip {
  padding-top: 40px;
}

.order-list {
  padding: 12px;
}

.order-card {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f5f5f5;
  margin-bottom: 8px;
}
.order-no {
  color: #999;
}
.status {
  font-weight: bold;
}

.card-body {
  display: flex;
  gap: 12px;
}
.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}
.time, .count {
  font-size: 12px;
  color: #999;
  margin-bottom: 2px;
}
.price {
  font-size: 14px;
  color: #333;
  text-align: right;
  margin-top: auto;
}
.price span {
  font-size: 16px;
  font-weight: bold;
  color: #ff4d4f;
}

.card-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid #f5f5f5;
}
</style>
