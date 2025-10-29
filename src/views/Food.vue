<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { fetchRestaurantsPage } from '../api/modules/restaurants.js'

const router = useRouter()
const searchValue = ref('')

// 轮播图数据
const swipeItems = ref([
  { id: 1, img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800' },
  { id: 2, img: 'https://images.unsplash.com/photo-1556761175-129418cb2dfe?w=800' },
  { id: 3, img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800' },
])

// 美食分类
const foodCategories = ref([
  { name: '热门推荐', icon: 'fire-o', color: '#ff9f43' },
  { name: '新品尝鲜', icon: 'gem-o', color: '#1dd1a1' },
  { name: '超值套餐', icon: 'gold-coin-o', color: '#ff6b6b' },
  { name: '清淡素食', icon: 'leaf-o', color: '#54a0ff' },
])

// 列表状态
const foodList = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(true)
const pageNum = ref(1)

const onSearch = (val) => {
  showToast(`搜索：${val}`)
}

const onCategoryClick = (name) => {
  showToast({ message: `${name} 开发中`, position: 'top' })
}

const onCardClick = (id) => {
  router.push(`/food/${id}`)
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
    foodList.value = []
  }

  try {
    const payload = {
      pageNum: pageNum.value,
      pageSize: 10,
      query: {} // 可根据搜索或分类调整
    }
    const start = Date.now()
    const res = await fetchRestaurantsPage(payload)
    const list = res?.list || res?.records || res?.data?.list || []
    const newData = Array.isArray(list) ? list : []

    // 保证至少 1 秒加载动画
    const elapsed = Date.now() - start
    if (elapsed < 1000 && !isLoadMore) {
      await new Promise(r => setTimeout(r, 1000 - elapsed))
    }

    foodList.value = isLoadMore ? [...foodList.value, ...newData] : newData

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
  <div class="food-list-page">
    <van-search v-model="searchValue" placeholder="搜索校园美食" @search="onSearch" />

    <van-swipe class="food-swipe" :autoplay="3000" indicator-color="white">
      <van-swipe-item v-for="item in swipeItems" :key="item.id">
        <van-image :src="item.img" width="100%" height="150" fit="fill" />
      </van-swipe-item>
    </van-swipe>

    <!-- 美食分类 -->
    <div class="cat-grid">
      <div
        v-for="cat in foodCategories"
        :key="cat.name"
        class="cat-item"
        :style="{ background: cat.color }"
        @click="onCategoryClick(cat.name)"
      >
        <van-icon :name="cat.icon" size="20" />
        <span class="name">{{ cat.name }}</span>
      </div>
    </div>

    <!-- 骨架屏 -->
    <div class="food-list" v-if="loading">
      <div class="food-card" v-for="n in 4" :key="n">
        <van-skeleton :row="3" :avatar="true" avatar-shape="square" avatar-size="100%" />
      </div>
    </div>

    <!-- 美食列表 -->
    <div class="food-list" v-else>
      <div class="food-card" v-for="food in foodList" :key="food.id" @click="onCardClick(food.id)">
        <van-image class="food-image" :src="food.coverImage" width="100%" height="180" fit="cover" />
        <div class="food-info">
          <div class="title">{{ food.name }}</div>
          <div class="rating-author">
            <van-rate :model-value="food.rating" :size="16" color="#ffd21e" void-icon="star" void-color="#eee" readonly allow-half />
          </div>
          <div class="meta">
            <div class="meta-item">
              <van-icon name="clock-o" />
              <span>{{ food.openHours }}</span>
            </div>
            <div class="meta-item">
              <van-icon name="gold-coin-o" />
              <span>{{ food.priceRange }}</span>
            </div>
          </div>
          <div class="meta-item phone">
            <van-icon name="phone-o" />
            <span>{{ food.contactPhone }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载更多提示 -->
    <div class="load-more-tip">
      <van-loading v-if="loadingMore" size="20px">加载中...</van-loading>
      <span v-else-if="!hasMore && foodList.length > 0">--- 我是有底线的 ---</span>
    </div>
  </div>
</template>

<style scoped>
.food-list-page {
  background: #f5f6f7;
  min-height: 100vh;
  padding-bottom: 20px;
}
.food-swipe {
  margin: 12px;
  border-radius: 12px;
  overflow: hidden;
}

/* 美食分类网格 */
.cat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin: 12px;
}
.cat-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #fff;
  border-radius: 10px;
  height: 48px;
  box-shadow: 0 6px 14px rgba(0,0,0,0.08);
}
.cat-item .name {
  font-size: 12px;
}

.food-list {
  padding: 0 12px;
}
.food-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.08);
  transition: transform 0.2s ease-in-out;
}
.food-card:active {
  transform: scale(0.98);
}
.food-info {
  padding: 12px 16px;
}
.food-info .title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rating-author {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #666;
}
.meta {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
  flex-wrap: wrap;
  gap: 8px;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}
.meta-item.phone {
  width: 100%;
}

/* 加载更多 */
.load-more-tip {
  padding: 16px 0 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  color: #969799;
}

/* 骨架屏样式调整 */
:deep(.van-skeleton) {
  padding: 0;
}
:deep(.van-skeleton__avatar) {
  width: 100%;
  height: 180px;
  border-radius: 0;
  margin-bottom: 12px;
}
:deep(.van-skeleton__content) {
  padding: 0 16px 12px;
}
</style>
