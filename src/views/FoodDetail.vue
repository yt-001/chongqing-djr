<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { fetchRestaurantById, fetchRestaurantDishesByRestaurantId, checkFavoriteRestaurant, addFavoriteRestaurant, removeFavoriteRestaurant } from '@/api'
import { processImageData } from '@/utils/imageUtils.js'
import { useUserStore } from '@/store/user.js'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const restaurant = ref(null)
const dishes = ref([])
const loading = ref(true)
const isFav = ref(false)
const favBusy = ref(false)
const dishesLoading = ref(false)
let dishesSeq = 0

/**
 * 解析封面与图集
 * @returns {{coverUrl:string,imageUrls:string[]}}
 */
const imageView = computed(() => {
  return processImageData({
    coverImage: restaurant.value?.coverImage || '',
    images: restaurant.value?.images || '[]'
  })
})

const merchantImages = computed(() => {
  const cover = imageView.value?.coverUrl || ''
  const list = Array.isArray(imageView.value?.imageUrls) ? imageView.value.imageUrls : []
  const all = [cover, ...list].filter(Boolean)
  return [...new Set(all)]
})

/**
 * 特色菜品（按商家ID从接口加载）
 * @returns {{id:number,name:string,price:string|number,img:string,isRecommended:boolean}[]}
 */
const specialDishes = computed(() => {
  const arr = Array.isArray(dishes.value) ? dishes.value : []
  return arr
    .filter(Boolean)
    .map((item, idx) => {
      const name = item.name || item.title || `菜品 ${idx + 1}`
      const price = item.price ?? item.cost ?? item.priceYuan ?? ''
      const url = item.imageUrl || item.image || item.img || item.coverImage || ''
      const rawRec = item.isRecommended ?? item.recommended ?? item.is_recommended ?? item.isHot ?? item.hot ?? 0
      const isRecommended = Number(rawRec) === 1 || rawRec === true
      const id = item.id ?? item.dishId ?? idx
      return { id, name, price, img: url, isRecommended }
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
    await loadDishes()
    if (userStore.isLoggedIn && restaurant.value?.id != null) {
      try {
        const res = await checkFavoriteRestaurant({ restaurantId: restaurant.value.id, userId: userStore.user?.id })
        isFav.value = !!res
      } catch {
        isFav.value = false
      }
    } else {
      isFav.value = false
    }
  } catch (e) {
    showToast('获取美食详情失败')
  } finally {
    loading.value = false
  }
})

async function loadDishes() {
  const restaurantId = restaurant.value?.id
  if (!restaurantId) {
    dishes.value = []
    return
  }

  const seq = ++dishesSeq
  dishesLoading.value = true
  try {
    const data = await fetchRestaurantDishesByRestaurantId(restaurantId)
    if (seq !== dishesSeq) return
    dishes.value = Array.isArray(data) ? data : (data?.list || data?.records || [])
  } catch (e) {
    if (seq !== dishesSeq) return
    dishes.value = []
    showToast(e?.message || '加载菜品失败')
  } finally {
    if (seq === dishesSeq) dishesLoading.value = false
  }
}

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

async function toggleFav() {
  const id = restaurant.value?.id
  if (!id) return
  if (!userStore.isLoggedIn) {
    showToast('请先登录')
    return
  }
  if (favBusy.value) return
  favBusy.value = true
  try {
    if (isFav.value) {
      await removeFavoriteRestaurant({ restaurantId: id, userId: userStore.user?.id })
      isFav.value = false
      showToast('已取消收藏')
    } else {
      await addFavoriteRestaurant({ restaurantId: id, userId: userStore.user?.id })
      isFav.value = true
      showToast('已添加到收藏')
    }
  } catch (e) {
    if (e?.status === 403) {
      showToast('请先登录')
      return
    }
    showToast(e?.message || '操作失败')
  } finally {
    favBusy.value = false
  }
}

</script>

<template>
  <div v-if="loading" class="food-page">
    <van-skeleton title :row="5" />
    <van-skeleton title :row="5" style="margin-top: 20px" />
  </div>
  <div v-else-if="restaurant" class="food-page">
    <!-- 返回导航条 -->
    <van-nav-bar left-text="返回" left-arrow :right-text="isFav ? '已收藏' : '收藏'" @click-left="router.back()" @click-right="toggleFav" />

    <!-- 顶部横幅 -->
    <div class="banner">
      <div class="brand">
        <div class="title">{{ restaurant.name }}</div>
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

    <!-- 商家图片 -->
    <div class="section-head">
      <div class="title">商家图片</div>
      <div class="pager">{{ merchantImages.length > 0 ? `${currentSlide + 1}/${merchantImages.length}` : '0/0' }}</div>
    </div>

    <van-swipe v-if="merchantImages.length > 0" class="dish-swipe" :autoplay="4000" :show-indicators="false" @change="(i)=> currentSlide = i">
      <van-swipe-item v-for="(img, idx) in merchantImages" :key="idx">
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
        <div class="dish-cover">
          <van-image :src="dish.img" width="100%" height="120" fit="cover" />
          <div v-if="dish.isRecommended" class="recommend-badge">推荐</div>
        </div>
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
.dish-cover { position: relative; }
.recommend-badge {
  position: absolute;
  left: 8px;
  top: 8px;
  padding: 2px 8px;
  font-size: 12px;
  color: #fff;
  border-radius: 10px;
  background: linear-gradient(135deg, #ff3b30 0%, #ff9500 100%);
}
.grid-info { display: flex; align-items: center; justify-content: space-between; padding: 8px; }
.grid-info .name { font-size: 14px; font-weight: 600; color: #333; }
.grid-info .price { font-size: 13px; color: #12b981; font-weight: 700; }
</style>
