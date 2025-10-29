<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'
import { fetchRestaurantById } from '../api/index.js'

const route = useRoute()
const restaurant = ref(null)
const loading = ref(true)

// API返回的图片是JSON字符串，这里进行解析
const galleryImages = computed(() => {
  if (restaurant.value?.images) {
    try {
      const parsed = JSON.parse(restaurant.value.images)
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      return []
    }
  }
  return []
})

// 商家相册（复用galleryImages）
const dishes = computed(() => {
  return galleryImages.value.map((img, index) => ({
    id: index,
    title: `菜品 ${index + 1}`,
    img: img
  }))
})

const currentSlide = ref(0)

onMounted(async () => {
  const id = route.params.id
  if (!id) {
    showToast('无效的美食ID')
    loading.value = false
    return
  }
  try {
    loading.value = true
    const data = await fetchRestaurantById(id)
    restaurant.value = data
  } catch (e) {
    showToast('获取美食详情失败')
  } finally {
    loading.value = false
  }
})

// 保留原有的占位函数
const onQuickAction = (name) => {
  showToast({ message: `${name} 开发中`, position: 'top' })
}
const onViewDetail = (id) => {
  showToast({ message: `菜品 ${id} 详情开发中`, position: 'top' })
}
</script>

<template>
  <div v-if="loading" class="food-page">
    <van-skeleton title :row="5" />
    <van-skeleton title :row="5" style="margin-top: 20px" />
  </div>
  <div v-else-if="restaurant" class="food-page">
    <!-- 顶部横幅 -->
    <div class="banner">
      <div class="brand">
        <div class="title">{{ restaurant.name }}</div>
        <div class="sub">{{ restaurant.specialty }}</div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <van-cell-group inset class="quick-card">
      <van-grid :column-num="2" clickable>
        <van-grid-item icon="phone-o" :text="restaurant.contactPhone || '暂无'" @click="onQuickAction('联系商家')" />
        <van-grid-item icon="location-o" :text="restaurant.location || '暂无'" @click="onQuickAction('导航')" />
      </van-grid>
    </van-cell-group>

    <!-- 商家信息卡片 -->
    <div class="merchant-card">
      <div class="left">
        <van-image :src="restaurant.coverImage" width="64" height="64" round fit="cover" />
      </div>
      <div class="mid">
        <div class="row">
          <span class="name">{{ restaurant.name }}</span>
          <van-rate :model-value="restaurant.rating" :size="16" color="#ffd21e" readonly allow-half />
        </div>
        <div class="meta">营业时间：<strong>{{ restaurant.openHours }}</strong></div>
        <div class="meta">价格范围：{{ restaurant.priceRange }}</div>
      </div>
      <div class="right">
        <van-button type="primary" size="small" round @click="onQuickAction('查看商家')">详情</van-button>
      </div>
    </div>

    <!-- 商家介绍 -->
    <div class="intro-card">
      <div class="intro-title">商家介绍</div>
      <div class="intro-text">{{ restaurant.description }}</div>
    </div>

    <!-- 商家相册 -->
    <div class="section-head">
      <div class="title">商家相册</div>
      <div class="pager">{{ currentSlide + 1 }}/{{ galleryImages.length }}</div>
    </div>

    <van-swipe class="dish-swipe" :autoplay="4000" :show-indicators="false" @change="(i)=> currentSlide = i">
      <van-swipe-item v-for="(img, idx) in galleryImages" :key="idx">
        <div class="dish-card">
          <van-image :src="img" width="100%" height="100%" fit="cover" />
        </div>
      </van-swipe-item>
    </van-swipe>

    <div class="swipe-caption">
      <div class="caption-inner">
        <div class="title"></div>
        <div class="dots">
          <span v-for="(d, di) in galleryImages" :key="`dot-`+di" class="dot" :class="{ active: di === currentSlide }"></span>
        </div>
      </div>
    </div>

    <!-- 相册网格 -->
    <div class="dish-grid" v-if="dishes.length > 0">
      <div class="grid-item" v-for="dish in dishes" :key="`g-`+dish.id" @click="onViewDetail(dish.id)">
        <van-image :src="dish.img" width="100%" height="110" fit="cover" />
        <div class="grid-title">{{ dish.title }}</div>
      </div>
    </div>
  </div>
  <div v-else class="food-page">
     <van-empty description="美食信息不存在" />
  </div>
</template>

<style scoped>
/* 样式与之前保持一致，仅作数据填充 */
.food-page { min-height: 100vh; background: #f5f6f7; padding-bottom: 20px; }
.banner { height: 140px; background: linear-gradient(135deg, #1f6fff 0%, #12b981 100%); border-bottom-left-radius: 18px; border-bottom-right-radius: 18px; position: relative; overflow: hidden; }
.brand { position: absolute; left: 16px; bottom: 14px; color: #fff; }
.brand .title { font-size: 20px; font-weight: 700; }
.brand .sub { font-size: 12px; opacity: 0.9; }
.quick-card { margin: 10px 12px; border-radius: 12px; overflow: hidden; }
:deep(.van-grid-item__text) { font-size: 13px; }
.merchant-card { margin: 10px 12px; background: #fff; border-radius: 12px; box-shadow: 0 8px 18px rgba(0,0,0,0.06); display: grid; grid-template-columns: 68px 1fr auto; gap: 10px; align-items: center; padding: 12px; }
.merchant-card .row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.merchant-card .name { font-weight: 600; font-size: 15px; }
.merchant-card .meta { color: #666; font-size: 12px; margin-top: 4px; }
.intro-card { margin: 10px 12px; background: #fff; border-radius: 12px; box-shadow: 0 8px 18px rgba(0,0,0,0.06); padding: 12px; }
.intro-title { font-weight: 700; margin-bottom: 6px; }
.intro-text { color: #555; font-size: 13px; line-height: 1.6; }
.section-head { display: flex; align-items: center; justify-content: space-between; margin: 10px 12px; }
.section-head .title { font-weight: 700; }
.section-head .pager { font-size: 12px; color: #888; }
.dish-swipe { height: 160px; margin: 0 12px; border-radius: 12px 12px 0 0; overflow: hidden; }
.dish-card { position: relative; height: 100%; }
.swipe-caption { margin: 0 12px 0; }
.caption-inner { height: 32px; border-radius: 0 0 12px 12px; background: linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.10)); display: flex; align-items: center; justify-content: space-between; padding: 0 12px; }
.caption-inner .title { font-weight: 700; font-size: 14px; color: #333; }
.caption-inner .dots { display: flex; gap: 6px; }
.caption-inner .dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(0,0,0,0.2); }
.caption-inner .dot.active { background: #12b981; }
.dish-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 12px; }
.grid-item { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 6px 14px rgba(0,0,0,0.06); }
.grid-title { padding: 8px; font-size: 14px; font-weight: 600; }
</style>
