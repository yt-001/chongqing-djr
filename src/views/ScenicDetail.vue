<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { fetchAdminAttractionById as fetchAttractionById, checkFavoriteAttraction, addFavoriteAttraction, removeFavoriteAttraction, fetchAttractionCommentsPage, addAttractionComment, deleteAttractionComment } from '@/api'
import { useUserStore } from '@/store/user.js'
import { processImageData } from '@/utils/imageUtils.js'

// 景点详情数据
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const scenic = ref(null)
const loading = ref(true)

// 收藏状态
const isFav = ref(false)

// 监听景点数据加载，检查收藏状态
watch(scenic, async (newVal) => {
  if (newVal?.id) {
    // 加载评论（独立于收藏状态）
    initComments()
    
    // 如果已登录，检查收藏状态
    if (userStore.isLoggedIn) {
      try {
        const res = await checkFavoriteAttraction({ 
          attractionId: newVal.id,
          userId: userStore.user.id 
        })
        isFav.value = !!res
      } catch (e) {
        isFav.value = false
      }
    } else {
      isFav.value = false
    }
  }
})

// 切换收藏
async function toggleFav() {
  if (!scenic.value) return
  if (!userStore.isLoggedIn) return showToast('请先登录')
  
  try {
    if (isFav.value) {
      await removeFavoriteAttraction({ 
        attractionId: scenic.value.id,
        userId: userStore.user.id
      })
      showToast('已取消收藏')
      isFav.value = false
    } else {
      await addFavoriteAttraction({ 
        attractionId: scenic.value.id,
        userId: userStore.user.id
      })
      showToast('已添加到收藏')
      isFav.value = true
    }
  } catch (e) {
    showToast(e.message || '操作失败')
  }
}

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
 * 打开地图（跳转到MapNavigation并带参）
 */
function openMap() {
  const lat = scenic.value?.latitude
  const lng = scenic.value?.longitude
  if (!lat || !lng) return showToast('暂无地理位置')
  
  // 跳转到地图导航页，并传递参数
  router.push({
    name: 'map-navigation',
    query: {
      lat,
      lng,
      name: scenic.value?.name,
      address: scenic.value?.location
    }
  })
}

onMounted(loadDetail)

// 评论相关状态
const comments = ref([])
const pageIndex = ref(1)
const pageSize = 10
const hasMore = ref(true)
const loadingMore = ref(false)
const pulling = ref(false)
const commentListRef = ref(null)
const showScrollbarHint = ref(false)
const touchStartY = ref(0)
const lastY = ref(0)
const touching = ref(false)
const totalComments = ref(0)

// 评论输入
const newComment = ref('')

/**
 * 初始化评论列表
 */
async function initComments() {
  if (!route.params.id) return
  pageIndex.value = 1
  hasMore.value = true
  comments.value = []
  await loadNextPage()
}

/**
 * 加载下一页评论
 */
async function loadNextPage() {
  if (!hasMore.value || loadingMore.value) return
  loadingMore.value = true
  
  try {
    const res = await fetchAttractionCommentsPage({
      pageNum: pageIndex.value,
      pageSize: pageSize,
      query: { attractionId: Number(route.params.id) }
    })
    
    const list = res.list || res.records || []
    totalComments.value = res.total || 0
    
    if (pageIndex.value === 1) {
      comments.value = list
    } else {
      comments.value.push(...list)
    }
    
    if (list.length < pageSize) {
      hasMore.value = false
    } else {
      pageIndex.value++
    }
  } catch (e) {
    showToast('加载评论失败')
  } finally {
    loadingMore.value = false
  }
}

/**
 * 提交评论
 */
async function submitComment() {
  if (!userStore.isLoggedIn) return showToast('请先登录')
  if (!newComment.value.trim()) return showToast('请输入评论内容')
  
  try {
    await addAttractionComment({
      userId: userStore.user.id,
      attractionId: Number(route.params.id),
      content: newComment.value,
      rating: 5 // 默认好评
    })
    showToast('评论成功')
    newComment.value = ''
    // 刷新列表
    initComments()
  } catch (e) {
    showToast(e.message || '评论失败')
  }
}

/**
 * 删除评论
 */
function deleteComment(item) {
  showConfirmDialog({
    title: '删除评论',
    message: '确定要删除这条评论吗？',
  })
    .then(async () => {
      try {
        await deleteAttractionComment(item.id, userStore.user.id)
        showToast('删除成功')
        // 从列表中移除
        const idx = comments.value.findIndex(c => c.id === item.id)
        if (idx > -1) {
          comments.value.splice(idx, 1)
          totalComments.value--
        }
      } catch (e) {
        showToast(e.message || '删除失败')
      }
    })
    .catch(() => {})
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
        <div class="hero-header">
          <div class="hero-title">{{ scenic?.name || '景点' }}</div>
          <div class="fav-btn" :class="{ active: isFav }" @click.stop="toggleFav">
            <van-icon :name="isFav ? 'star' : 'star-o'" />
          </div>
        </div>
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
        <div class="pager">共 {{ totalComments }} 条</div>
      </div>
      
      <!-- 评论输入 -->
      <div class="comment-input-box">
        <van-field
          v-model="newComment"
          rows="1"
          autosize
          type="textarea"
          placeholder="发表你的看法..."
          border
          class="comment-field"
        >
          <template #button>
            <van-button size="small" type="primary" :disabled="!newComment.trim()" @click="submitComment">发布</van-button>
          </template>
        </van-field>
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
          <van-image round width="40" height="40" :src="c.avatar || 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'" />
          <div class="comment-content">
            <div class="row">
              <span class="user">{{ c.userName || c.user || '用户' }}</span>
              <van-rate :model-value="c.rating" readonly size="14" gutter="2" />
            </div>
            <div class="text">{{ c.content }}</div>
            <div class="time">{{ c.createTime || c.time }}</div>
          </div>
          <van-icon 
            v-if="userStore.isLoggedIn && (c.userId === userStore.user.id)" 
            name="delete-o" 
            class="delete-btn" 
            @click.stop="deleteComment(c)" 
          />
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
.hero-header { display: flex; justify-content: space-between; align-items: flex-start; }
.hero-title { font-weight: 800; font-size: 18px; color: #143a72; flex: 1; }
.fav-btn { width: 36px; height: 36px; border: 2px solid #ddd; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #999; transition: all 0.3s; flex-shrink: 0; margin-left: 12px; }
.fav-btn.active { border-color: #ff9800; color: #ff9800; background: #fff7e0; }
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
.comment-input-box { margin: 0 16px 8px; border: 1px solid #eee; border-radius: 8px; overflow: hidden; }
.comment-field { padding: 8px 12px; background: #fafafa; }
.comment-list { margin: 0 16px 16px; background: #fff; border-radius: 12px; padding: 8px 12px; overflow: hidden; position: relative; --item-h: 68px; }
.comment-list.scrollable { max-height: calc(5 * var(--item-h)); overflow: auto; }
.comment-list.scrollable::-webkit-scrollbar { width: 6px; }
.comment-list.scrollable::-webkit-scrollbar-track { background: #f1f3f5; border-radius: 6px; }
.comment-list.scrollable::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #c5d8f7, #90caf9); border-radius: 6px; }
.comment-item { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid #f0f2f5; min-height: var(--item-h); }
.comment-item:last-child { border-bottom: none; }
.comment-content { flex: 1; }
.delete-btn { color: #999; padding: 4px 0 4px 8px; font-size: 16px; cursor: pointer; }
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
