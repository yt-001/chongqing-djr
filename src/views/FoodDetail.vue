<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { fetchRestaurantById } from '../api/index.js'
import { processImageData } from '@/utils/imageUtils.js'

const route = useRoute()
const router = useRouter()
const restaurant = ref(null)
const loading = ref(true)

/**
 * 解析封面与图集（统一 /images 前缀）
 * @returns {{coverUrl:string,imageUrls:string[]}}
 */
const imageView = computed(() => {
  return processImageData({
    coverImage: restaurant.value?.coverImage || '',
    images: restaurant.value?.images || '[]'
  })
})

/**
 * 特色菜品（后端提供菜品名称、价格、图片）
 * 兼容多种返回结构：字符串JSON或对象数组，字段名的差异
 * @returns {{id:number,name:string,price:string|number,img:string}[]}
 */
const specialDishes = computed(() => {
  const raw = restaurant.value?.dishes || restaurant.value?.specialDishes || restaurant.value?.signatureDishes || []
  let arr
  try {
    arr = Array.isArray(raw) ? raw : JSON.parse(raw)
  } catch (_) {
    arr = []
  }
  if (!Array.isArray(arr)) return []
  return arr
    .filter(Boolean)
    .map((item, idx) => {
      const name = item.name || item.title || `菜品 ${idx + 1}`
      const price = item.price ?? item.cost ?? item.priceYuan ?? ''
      const cover = item.image || item.img || item.coverImage || ''
      const url = processImageData({ coverImage: cover, images: '[]' }).coverUrl || ''
      return { id: idx, name, price, img: url }
    })
})

const currentSlide = ref(0)

/**
 * 加载美食详情（按路由参数 id）
 */
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
    // 若后端暂未提供特色菜品，注入示例数据用于预览效果
    if (!restaurant.value?.dishes && !restaurant.value?.specialDishes && !restaurant.value?.signatureDishes) {
      restaurant.value.dishes = JSON.stringify(buildDemoDishes())
    }
  } catch (e) {
    showToast('获取美食详情失败')
  } finally {
    loading.value = false
  }
})

/**
 * 快捷操作占位
 * @param {string} name
 */
const onQuickAction = (name) => {
  showToast({ message: `${name} 开发中`, position: 'top' })
}
/**
 * 查看菜品详情占位
 * @param {number} id
 */
const onViewDetail = (id) => {
  showToast({ message: `菜品 ${id} 详情开发中`, position: 'top' })
}

/**
 * 构建特色菜品示例数据（文件名来自 public/images/）
 * @returns {{name:string,price:number,image:string}[]}
 */
function buildDemoDishes() {
  return [
    { name: '招牌鲜牛肉', price: 58, image: 'e3f52c00-0122-438b-8fa1-59d03ea1a848.png' },
    { name: '番茄土豆片', price: 26, image: 'cf566d3f-f756-4f3f-bf83-401aff4af440.png' },
    { name: '手打虾滑', price: 38, image: '99690364-15d9-4d57-9230-45b1773a0710.png' },
    { name: '麻辣鹅肠', price: 32, image: 'de7b1565-a06f-434c-92b3-f4a6da39a14f.png' }
  ]
}
</script>

<template>
  <div v-if="loading" class="food-page">
    <van-skeleton title :row="5" />
    <van-skeleton title :row="5" style="margin-top: 20px" />
  </div>
  <div v-else-if="restaurant" class="food-page">
    <!-- 返回导航条 -->
    <van-nav-bar left-text="返回" left-arrow @click-left="router.back()" />

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
        <van-image :src="imageView.coverUrl" width="64" height="64" round fit="cover" />
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
      <div class="pager">{{ currentSlide + 1 }}/{{ imageView.imageUrls.length }}</div>
    </div>

    <van-swipe class="dish-swipe" :autoplay="4000" :show-indicators="false" @change="(i)=> currentSlide = i">
      <van-swipe-item v-for="(img, idx) in imageView.imageUrls" :key="idx">
        <div class="dish-card">
          <van-image :src="img" width="100%" height="100%" fit="cover" />
        </div>
      </van-swipe-item>
    </van-swipe>

    
    <!-- 特色菜品 -->
    <div class="section-head">
      <div class="title">特色菜品</div>
      <div class="pager">共 {{ specialDishes.length }} 道</div>
    </div>

    <!-- 特色菜品网格（图+名+价） -->
    <div class="dish-grid" v-if="specialDishes.length > 0">
      <div class="grid-item" v-for="dish in specialDishes" :key="`g-`+dish.id" @click="onViewDetail(dish.id)">
        <van-image :src="dish.img" width="100%" height="120" fit="cover" />
        <div class="grid-info">
          <div class="name">{{ dish.name }}</div>
          <div class="price" v-if="dish.price !== ''">¥ {{ Number(dish.price).toFixed(2) }}</div>
        </div>
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
.dish-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 12px; }
.grid-item { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 6px 14px rgba(0,0,0,0.06); }
.grid-info { display: flex; align-items: center; justify-content: space-between; padding: 8px; }
.grid-info .name { font-size: 14px; font-weight: 600; color: #333; }
.grid-info .price { font-size: 13px; color: #12b981; font-weight: 700; }
</style>
