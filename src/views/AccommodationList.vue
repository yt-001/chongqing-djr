<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { processImageData } from '@/utils/imageUtils.js'
import { fetchAccommodationsPage } from '../api/modules/accommodations.js'

const router = useRouter()
const searchValue = ref('')

// 轮播图数据
const swipeItems = ref([
  { id: 1, img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800' },
  { id: 2, img: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800' },
  { id: 3, img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800' },
])

// 住宿分类
const categories = ref([
  { name: '高端酒店', icon: 'hotel-o', color: '#ff9f43' },
  { name: '特色民宿', icon: 'shop-o', color: '#1dd1a1' },
  { name: '青年旅舍', icon: 'friends-o', color: '#ff6b6b' },
  { name: '客栈公寓', icon: 'home-o', color: '#54a0ff' },
])

// 列表状态
const list = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(true)
const pageNum = ref(1)

const onSearch = (val) => {
  showToast(`搜索：${val}`)
  loadData(false)
}

const onCategoryClick = (name) => {
  showToast({ message: `${name} 分类开发中`, position: 'top' })
}

/**
 * 返回上一页（无历史时回到推荐页）
 */
function onBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push({ name: 'recommend' })
  }
}

const onCardClick = (id) => {
  /**
   * 跳转到民宿详情（使用 path 兜底，避免命名路由失效）
   */
  if (!id && id !== 0) {
    return showToast({ message: '数据异常：缺少ID', position: 'top' })
  }
  const path = `/accommodations/${id}`
  router.push({ path }).catch(() => {
    // 兜底：路由失败时使用浏览器跳转
    window.location.assign(path)
  })
}

/**
 * 解析封面文件名为可访问URL（/images 前缀）
 * @param {string} cover
 * @returns {string}
 */
function resolveImageUrl(cover) {
  return processImageData({ coverImage: cover, images: '[]' }).coverUrl || ''
}

// 加载数据
const loadData = async (isLoadMore = false) => {
  if (isLoadMore) {
    if (loadingMore.value || !hasMore.value) return
    loadingMore.value = true
    pageNum.value++
  } else {
    loading.value = true
    pageNum.value = 1
    list.value = []
  }

  try {
    const payload = {
      pageNum: pageNum.value,
      pageSize: 10,
      query: searchValue.value ? { name: searchValue.value } : {}
    }
    const start = Date.now()
    const res = await fetchAccommodationsPage(payload)
    const data = res?.list || res?.records || res?.data?.list || []
    const newData = Array.isArray(data) ? data : []

    // 保证至少 1 秒加载动画
    const elapsed = Date.now() - start
    if (elapsed < 1000 && !isLoadMore) {
      await new Promise(r => setTimeout(r, 1000 - elapsed))
    }

    list.value = isLoadMore ? [...list.value, ...newData] : newData

    if (newData.length < payload.pageSize) {
      hasMore.value = false
    }
  } catch (e) {
    showToast({ message: '数据加载失败', position: 'top' })
    if (isLoadMore) pageNum.value--
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 滚动事件处理
const handleScroll = () => {
  const { scrollTop, clientHeight, scrollHeight } = document.documentElement
  if (scrollTop + clientHeight >= scrollHeight - 50) {
    loadData(true)
  }
}

onMounted(() => {
  loadData()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="accommodation-page">
    <!-- 顶部搜索 -->
    <van-sticky>
      <div class="header">
        <van-nav-bar
          title="住宿列表"
          left-text="返回"
          left-arrow
          @click-left="onBack"
        />
        <van-search
          v-model="searchValue"
          shape="round"
          background="transparent"
          placeholder="搜索酒店/民宿"
          @search="onSearch"
        />
      </div>
    </van-sticky>

    <!-- 轮播图 -->
    <div class="banner-area">
      <van-swipe :autoplay="3000" indicator-color="white" class="my-swipe">
        <van-swipe-item v-for="item in swipeItems" :key="item.id">
          <img :src="item.img" alt="banner" />
        </van-swipe-item>
      </van-swipe>
    </div>

    <!-- 分类导航 -->
    <div class="category-grid">
      <div
        v-for="cat in categories"
        :key="cat.name"
        class="cat-item"
        @click="onCategoryClick(cat.name)"
      >
        <div class="icon-box" :style="{ background: cat.color }">
          <van-icon :name="cat.icon" size="24" color="#fff" />
        </div>
        <span class="name">{{ cat.name }}</span>
      </div>
    </div>

    <!-- 列表标题 -->
    <div class="section-title">
      <span class="main">精选宿所</span>
      <span class="sub">舒适·特色·安心</span>
    </div>

    <!-- 骨架屏 -->
    <div v-if="loading" class="skeleton-list">
      <div v-for="i in 3" :key="i" class="skeleton-card">
        <van-skeleton title avatar :row="3" />
      </div>
    </div>

    <!-- 住宿列表 -->
    <div v-else class="list-container">
      <div
        v-for="item in list"
        :key="item.id"
        class="card"
        @click="onCardClick(item.id)"
      >
        <div class="card-img">
          <img :src="resolveImageUrl(item.coverImage)" alt="cover" />
          <div class="price-tag">
            <span class="currency">¥</span>
            <span class="amount">{{ item.pricePerNight }}</span>
            <span class="unit">起</span>
          </div>
        </div>
        <div class="card-content">
          <div class="title">{{ item.name }}</div>
          <div class="tags">
            <span class="tag type">{{ item.type === 0 ? '酒店' : (item.type === 1 ? '民宿' : '客栈') }}</span>
            <span class="tag location">{{ item.location }}</span>
          </div>
          <div class="desc">{{ item.description }}</div>
          <div class="bottom">
            <div class="rating">
              <van-icon name="star" color="#ff9f43" />
              <span>{{ item.rating || 4.8 }}分</span>
            </div>
            <van-button size="mini" type="primary" round @click.stop="onCardClick(item.id)">查看详情</van-button>
          </div>
        </div>
      </div>
      
      <!-- 加载更多/到底提示 -->
      <div class="loading-more" v-if="loadingMore">
        <van-loading size="24px">加载中...</van-loading>
      </div>
      <div class="no-more" v-if="!hasMore && list.length > 0">
        没有更多了
      </div>
      <van-empty v-if="!loading && list.length === 0" description="暂无相关住宿" />
    </div>
    
    <!-- 底部占位 -->
    <div style="height: 60px;"></div>
  </div>
</template>

<style scoped>
.accommodation-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 50px;
}

.header {
  background: #fff;
  padding: 0 8px;
}

.banner-area {
  margin: 12px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.my-swipe .van-swipe-item {
  height: 160px;
}
.my-swipe img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-grid {
  display: flex;
  justify-content: space-around;
  padding: 16px 12px;
  background: #fff;
  margin: 0 12px 12px;
  border-radius: 12px;
}
.cat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.icon-box {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
.cat-item .name {
  font-size: 12px;
  color: #333;
}

.section-title {
  padding: 12px 16px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.section-title .main {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}
.section-title .sub {
  font-size: 12px;
  color: #999;
}

.skeleton-list {
  padding: 0 12px;
}
.skeleton-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.list-container {
  padding: 0 12px;
}
.card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
}
.card-img {
  width: 100%;
  height: 160px;
  position: relative;
}
.card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.price-tag {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: rgba(0,0,0,0.7);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  display: flex;
  align-items: baseline;
}
.price-tag .currency { font-size: 12px; }
.price-tag .amount { font-size: 18px; font-weight: bold; margin: 0 2px; }
.price-tag .unit { font-size: 12px; color: #ddd; }

.card-content {
  padding: 12px;
}
.title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tags {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}
.tag.type {
  background: #e6f7ff;
  color: #1890ff;
}
.tag.location {
  background: #f6ffed;
  color: #52c41a;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #ff9f43;
  font-weight: bold;
}

.loading-more, .no-more {
  text-align: center;
  padding: 16px;
  color: #999;
  font-size: 12px;
}
</style>
/**
 * 返回上一页（无历史时回到推荐页）
 */
function onBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push({ name: 'recommend' })
  }
}
