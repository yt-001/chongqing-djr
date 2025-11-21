<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { fetchAdminAttractionById as fetchAttractionById } from '@/api'
import { useUserStore } from '@/store/user.js'
import { processImageData } from '@/utils/imageUtils.js'

// 景点详情数据
const route = useRoute()
const router = useRouter()
const scenic = ref(null)
const loading = ref(true)

/**
 * 加载景点详情数据（按路由参数 id）
 */
async function loadDetail() {
  const id = route.params.id
  if (!id) {
    showToast('无效的景点ID')
    loading.value = false
    return
  }
  try {
    loading.value = true
    const data = await fetchAttractionById(id)
    scenic.value = data
  } catch (e) {
    showToast('获取景点详情失败')
  } finally {
    loading.value = false
  }
}

/**
 * 解析图片/封面为可用URL（使用 /images 前缀）
 * @returns {{coverUrl:string,imageUrls:string[]}}
 */
const imageView = computed(() => {
  return processImageData({
    coverImage: scenic.value?.coverImage || '',
    images: scenic.value?.images || '[]'
  })
})

/**
 * 将票价格式化为友好字符串
 * @param {number|string} price
 * @returns {string}
 */
function formatPrice(price) {
  const n = Number(price || 0)
  return n > 0 ? `¥ ${n.toFixed(2)}` : '免费'
}

/**
 * 拨打联系电话
 */
function callPhone() {
  const tel = scenic.value?.contactPhone
  if (!tel) return showToast('无联系电话')
  location.href = `tel:${tel}`
}

/**
 * 打开地图（基于经纬度）
 */
function openMap() {
  const lat = scenic.value?.latitude
  const lng = scenic.value?.longitude
  if (!lat || !lng) return showToast('暂无地理位置')
  const url = `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(scenic.value?.name || '景点')}`
  window.open(url, '_blank')
}

onMounted(loadDetail)

/**
 * 评论示例数据（无需接口）
 * 生成30条示例数据用于滚动与分页
 */
const allComments = ref(Array.from({ length: 30 }, (_, i) => {
  const base = [
    { user: '小李', avatar: '/images/99690364-15d9-4d57-9230-45b1773a0710.png', rating: 5, content: '风景很美，值得一去！', time: '2025-10-01' },
    { user: '阿强', avatar: '/images/cf566d3f-f756-4f3f-bf83-401aff4af440.png', rating: 4, content: '交通方便，人也不算多。', time: '2025-10-03' },
    { user: 'Zoe', avatar: '/images/de7b1565-a06f-434c-92b3-f4a6da39a14f.png', rating: 5, content: '服务很好，拍照出片！', time: '2025-10-06' }
  ][i % 3]
  return { id: i + 1, ...base }
}))

// 可视评论切片与滚动逻辑
const comments = ref([])
const pageIndex = ref(1)
const pageSize = 10
const hasMore = computed(() => comments.value.length < allComments.value.length)
const loadingMore = ref(false)
const pulling = ref(false)
const commentListRef = ref(null)
const showScrollbarHint = ref(false)
const touchStartY = ref(0)
const lastY = ref(0)
const touching = ref(false)

/**
 * 初始化评论列表为首屏10条
 */
function initComments() {
  comments.value = allComments.value.slice(0, pageSize)
  pageIndex.value = 1
}

/**
 * 追加下一页评论（每次10条），带600ms加载模拟
 */
async function loadNextPage() {
  if (!hasMore.value || loadingMore.value) return
  loadingMore.value = true
  await new Promise(res => setTimeout(res, 600))
  const nextCount = Math.min((pageIndex.value + 1) * pageSize, allComments.value.length)
  comments.value = allComments.value.slice(0, nextCount)
  pageIndex.value += 1
  loadingMore.value = false
  // 保持当前阅读位置不变：不主动改变 scrollTop
}

/**
 * 底部继续滑动触发拉距抖动并加载下一页
 * @param {WheelEvent} e
 */
function onCommentWheel(e) {
  const el = commentListRef.value
  if (!el) return
  const atBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight
  if (atBottom && e.deltaY > 0 && hasMore.value) {
    if (pulling.value || loadingMore.value) return
    pulling.value = true
    showScrollbarHint.value = true
    setTimeout(() => { showScrollbarHint.value = false }, 800)
    setTimeout(() => { pulling.value = false }, 280)
    loadNextPage()
  }
}

/**
 * 触屏：开始滑动记录起点
 * @param {TouchEvent} e
 */
function onCommentTouchStart(e) {
  touching.value = true
  const y = e.touches[0]?.clientY || 0
  touchStartY.value = y
  lastY.value = y
}

/**
 * 触屏：在底部继续向上滑时触发抖动与加载
 * @param {TouchEvent} e
 */
function onCommentTouchMove(e) {
  const el = commentListRef.value
  if (!el) return
  const y = e.touches[0]?.clientY || 0
  const delta = lastY.value - y // 上滑为正值
  lastY.value = y
  const atBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight
  if (atBottom && delta > 0 && hasMore.value) {
    if (pulling.value || loadingMore.value) return
    pulling.value = true
    showScrollbarHint.value = true
    setTimeout(() => { showScrollbarHint.value = false }, 800)
    setTimeout(() => { pulling.value = false }, 280)
    loadNextPage()
    // 防止过度滚动产生空白回弹
    e.preventDefault()
  }
}

/**
 * 触屏：结束滑动
 */
function onCommentTouchEnd() {
  touching.value = false
}

onMounted(() => {
  initComments()
})

// 支付相关状态
const paySheetVisible = ref(false)
const payMethod = ref('wechat')
const paying = ref(false)
const ticketCount = ref(1)

/**
 * 打开支付方式选择弹层
 */
function openPaySheet() {
  paySheetVisible.value = true
}

/**
 * 开始模拟支付流程（1秒后进入“模拟支付”页面，并保存订单草稿）
 */
async function startPay() {
  if (paying.value) return
  paying.value = true
  try {
    await new Promise((res) => setTimeout(res, 1000))
    paySheetVisible.value = false
    const userStore = useUserStore()
    const userId = userStore?.user?.id
    if (!userId) {
      showToast({ message: '请先登录', position: 'top' })
      return router.push({ name: 'login' })
    }
    const unitPrice = Number(scenic.value?.ticketPrice || 0)
    const totalAmount = Number((unitPrice * ticketCount.value).toFixed(2))
    const draft = {
      userId,
      productType: 1,
      productId: Number(route.params.id),
      productName: scenic.value?.name || '景点',
      description: scenic.value?.description || '',
      quantity: ticketCount.value,
      unitPrice,
      totalAmount,
      method: payMethod.value,
      status: null,
    }
    sessionStorage.setItem('orderDraft', JSON.stringify(draft))
    const params = { id: route.params.id }
    const query = { name: scenic.value?.name || '', count: ticketCount.value, method: payMethod.value }
    router.push({ name: 'pay-mock', params, query })
  } finally {
    paying.value = false
  }
}
</script>

<template>
  <div class="scenic-detail" v-loading="loading">
    <!-- 顶部封面与基本信息 -->
    <div class="cover" :style="{ backgroundImage: imageView.coverUrl ? `url(${imageView.coverUrl})` : 'none' }">
      <van-nav-bar left-text="返回" left-arrow @click-left="router.back()" />
      <div class="hero-card">
        <div class="hero-title">{{ scenic?.name || '景点' }}</div>
        <div class="hero-sub">{{ scenic?.location || '未知位置' }}</div>
        <div class="hero-tags">
          <van-tag type="primary" plain>开放时间 {{ scenic?.openHours || '未知' }}</van-tag>
          <van-tag type="warning" plain>票价 {{ formatPrice(scenic?.ticketPrice) }}</van-tag>
        </div>
      </div>
    </div>

    <!-- 内容卡片 -->
    <div class="content-card">
      <div class="intro">
        <div class="intro-title">景点简介</div>
        <div class="intro-text">{{ scenic?.description || '暂无简介' }}</div>
      </div>

      <van-cell-group inset>
        <van-cell title="地理位置" :value="scenic?.location || '未知'" @click="openMap" is-link />
        <van-cell title="开放时间" :value="scenic?.openHours || '未知'" />
        <van-cell title="门票价格" :value="formatPrice(scenic?.ticketPrice)" />
        <van-cell title="联系电话" :value="scenic?.contactPhone || '暂无'" @click="callPhone" is-link />
      </van-cell-group>

      <!-- 图集轮播 -->
      <div v-if="imageView.imageUrls.length" class="gallery">
        <van-swipe :autoplay="3000" lazy-render :show-indicators="true" class="gallery-swipe">
          <van-swipe-item v-for="(img, idx) in imageView.imageUrls" :key="idx">
            <img class="gallery-img" :src="img" alt="image" />
          </van-swipe-item>
        </van-swipe>
      </div>

      <!-- 底部操作 -->
      <div class="actions">
        <van-button type="primary" round block @click="openMap">导航到此</van-button>
        <van-button type="success" round block plain @click="callPhone">咨询电话</van-button>
        <van-button type="danger" round block @click="openPaySheet">购买门票</van-button>
      </div>

      <!-- 评论模块 -->
      <div class="section-head">
        <div class="intro-title">评论</div>
        <div class="pager">共 {{ allComments.length }} 条</div>
      </div>
      <div
        class="comment-list"
        :class="{ scrollable: comments.length > 5, 'pull-bounce': pulling }"
        ref="commentListRef"
        @wheel="onCommentWheel"
        @touchstart.passive="onCommentTouchStart"
        @touchmove="onCommentTouchMove"
        @touchend.passive="onCommentTouchEnd"
      >
        <div v-if="showScrollbarHint" class="scrollbar-hint"></div>
        <div class="comment-item" v-for="c in comments" :key="c.id">
          <van-image round width="40" height="40" :src="c.avatar" />
          <div class="comment-content">
            <div class="row">
              <span class="user">{{ c.user }}</span>
              <van-rate :model-value="c.rating" readonly size="14" gutter="2" />
            </div>
            <div class="text">{{ c.content }}</div>
            <div class="time">{{ c.time }}</div>
          </div>
        </div>
        <div v-if="loadingMore" class="loading-more">
          <van-loading type="spinner" size="18" />
          <span>加载中...</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 支付弹层 -->
  <van-popup v-model:show="paySheetVisible" position="bottom" round :style="{ padding: '16px' }">
    <div class="pay-title">选择支付方式</div>
    <van-radio-group v-model="payMethod">
      <van-cell-group>
        <van-cell clickable @click="payMethod='wechat'">
          <template #title>
            <div class="pay-item">
              <img class="pay-icon" src="/public/images/e3f52c00-0122-438b-8fa1-59d03ea1a848.png" alt="wechat" />
              <span>微信支付</span>
            </div>
          </template>
          <template #right-icon>
            <van-radio name="wechat" />
          </template>
        </van-cell>
        <van-cell clickable @click="payMethod='alipay'">
          <template #title>
            <div class="pay-item">
              <img class="pay-icon" src="/public/images/99690364-15d9-4d57-9230-45b1773a0710.png" alt="alipay" />
              <span>支付宝</span>
            </div>
          </template>
          <template #right-icon>
            <van-radio name="alipay" />
          </template>
        </van-cell>
      </van-cell-group>
    </van-radio-group>
    <div class="pay-qty">
      <span>数量</span>
      <van-stepper v-model="ticketCount" integer min="1" max="9" />
    </div>
    <van-button type="primary" round block :loading="paying" loading-text="正在支付..." @click="startPay">立即支付</van-button>
  </van-popup>
</template>

<style scoped>
.scenic-detail { background: #f5f6f7; min-height: 100vh; }
.cover { position: relative; height: 240px; background: #eaeef3; background-size: cover; background-position: center; }
.hero-card { position: absolute; left: 12px; right: 12px; bottom: -36px; background: #fff; border-radius: 18px; box-shadow: 0 10px 24px rgba(0,0,0,0.10); padding: 12px 14px; }
.hero-title { font-weight: 800; font-size: 18px; color: #143a72; }
.hero-sub { color: #607d8b; font-size: 13px; margin-top: 4px; }
.hero-tags { display: flex; gap: 8px; margin-top: 8px; }

.content-card { margin: 48px 12px 16px; background: #fff; border-radius: 14px; box-shadow: 0 6px 16px rgba(0,0,0,0.06); overflow: hidden; }
.intro { padding: 14px; }
.intro-title { font-weight: 700; font-size: 16px; }
.intro-text { color: #555; font-size: 13px; line-height: 1.6; margin-top: 6px; }

.gallery { margin: 12px; border-radius: 12px; overflow: hidden; }
.gallery-swipe { height: 180px; border-radius: 12px; }
.gallery-img { width: 100%; height: 100%; object-fit: cover; }

.actions { display: grid; gap: 10px; padding: 12px; }
.section-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px 8px; }
.comment-list { margin: 0 16px 16px; background: #fff; border-radius: 12px; padding: 8px 12px; overflow: hidden; position: relative; --item-h: 68px; }
.comment-list.scrollable { max-height: calc(5 * var(--item-h)); overflow: auto; }
.comment-list.scrollable::-webkit-scrollbar { width: 6px; }
.comment-list.scrollable::-webkit-scrollbar-track { background: #f1f3f5; border-radius: 6px; }
.comment-list.scrollable::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #c5d8f7, #90caf9); border-radius: 6px; }
.comment-item { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid #f0f2f5; min-height: var(--item-h); }
.comment-item:last-child { border-bottom: none; }
.comment-content { flex: 1; }
.comment-content .row { display: flex; align-items: center; justify-content: space-between; }
.comment-content .user { font-weight: 600; }
.comment-content .text { font-size: 13px; color: #444; margin-top: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.comment-content .time { font-size: 12px; color: #999; margin-top: 4px; }
.loading-more { display: flex; align-items: center; gap: 8px; justify-content: center; padding: 10px 0; color: #607d8b; }
@keyframes pullBounce { 0% { transform: translateY(0); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0); } }
.pull-bounce { animation: pullBounce 280ms ease-out; }
@keyframes hintFade { 0% { opacity: 0; } 30% { opacity: 1; } 100% { opacity: 0; } }
.scrollbar-hint { position: absolute; top: 8px; right: 3px; width: 4px; height: 40%; background: linear-gradient(180deg, #c5d8f7, #90caf9); border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.12); opacity: 0; animation: hintFade 800ms ease; }
.pay-title { font-weight: 700; font-size: 16px; margin-bottom: 8px; }
.pay-item { display: flex; align-items: center; gap: 8px; }
.pay-icon { width: 22px; height: 22px; border-radius: 6px; object-fit: cover; }
.pay-qty { display: flex; align-items: center; justify-content: space-between; margin: 12px 4px; }
</style>