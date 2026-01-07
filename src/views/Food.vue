<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { processImageData } from '@/utils/imageUtils.js'
import { fetchRestaurantsPage, fetchRestaurantCategoriesPage } from '../api/modules/restaurants.js'
import { fetchFavoriteRestaurantsPage, checkFavoriteRestaurant, addFavoriteRestaurant, removeFavoriteRestaurant, fetchRecommendedDishCards } from '@/api'
import { useUserStore } from '@/store/user.js'

const router = useRouter()
const userStore = useUserStore()
const searchValue = ref('')

// 轮播图数据
const swipeItems = ref([
  { id: 1, img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800' },
  { id: 2, img: 'https://images.unsplash.com/photo-1556761175-129418cb2dfe?w=800' },
  { id: 3, img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800' },
])

const restaurantCategories = ref([])
const categoriesLoading = ref(false)
const recommendedDishes = ref([])
const recLoading = ref(false)
const recHasMore = ref(true)
const recPageNum = ref(1)
const recSentinelRef = ref(null)
const REC_PAGE_SIZE = 10
const areaLoading = ref(false)
const MIN_AREA_LOADING_MS = 600
let areaLoadingSeq = 0
const contentAreaRef = ref(null)
const contentOverlayRect = ref({ top: 0, left: 0, width: 0 })
const contentOverlayStyle = computed(() => {
  const r = contentOverlayRect.value
  if (!r || !Number.isFinite(r.width) || r.width <= 0) return { top: '0px', left: '0px', right: '0px' }
  return { top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px` }
})

function toRateValue(input) {
  if (input === null || input === undefined || input === '') return 0
  const n = typeof input === 'number' ? input : Number(input)
  if (Number.isFinite(n)) return Math.max(0, Math.min(5, n))
  const str = String(input)
  const m = str.match(/(\d+(\.\d+)?)/)
  const f = m ? Number(m[1]) : NaN
  if (!Number.isFinite(f)) return 0
  return Math.max(0, Math.min(5, f))
}

function updateContentOverlayRect() {
  const el = contentAreaRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  contentOverlayRect.value = {
    top: Math.max(0, rect.top),
    left: rect.left,
    width: rect.width,
  }
}

// 列表状态
const foodList = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(true)
const pageNum = ref(1)
const activeView = ref('all') // all | fav | cat:<id>
const favList = ref([])
const favLoading = ref(false)
const favFinished = ref(false)
const favPageNum = ref(1)
const FAV_PAGE_SIZE = 10
const favStateMap = ref(new Map())

const searchMode = ref(false)
const searchResults = ref([])

function normalizeDishCardRows(res) {
  if (Array.isArray(res)) return res
  return res?.list || res?.records || res?.data?.list || res?.data?.records || []
}

async function searchDishCards(keyword) {
  const kw = String(keyword || '').trim()
  if (!kw) {
    searchResults.value = []
    return
  }
  const kwLower = kw.toLowerCase()
  const pageSize = 50
  const maxPages = 6
  let pageNum = 1
  let all = []
  for (let i = 0; i < maxPages; i++) {
    const res = await fetchRecommendedDishCards({ pageNum, pageSize })
    const rows = normalizeDishCardRows(res)
    const hits = (rows || []).filter(r => {
      const dn = String(r?.dishName || '').toLowerCase()
      const desc = String(r?.dishDescription || '').toLowerCase()
      const rn = String(r?.restaurantName || '').toLowerCase()
      return dn.includes(kwLower) || desc.includes(kwLower) || rn.includes(kwLower)
    })
    all = all.concat(hits)
    if (!Array.isArray(rows) || rows.length < pageSize) break
    pageNum += 1
  }
  searchResults.value = dedupeByDishId(all)
}

const onSearch = async () => {
  const kw = String(searchValue.value || '').trim()
  if (!kw) {
    searchMode.value = false
    searchResults.value = []
    return
  }
  activeView.value = 'all'
  searchMode.value = true
  loading.value = true
  await runWithAreaLoading(async () => {
    await searchDishCards(kw)
  }).finally(() => {
    loading.value = false
  })
}

const onClearSearch = () => {
  searchMode.value = false
  searchResults.value = []
}

const onCardClick = (id) => {
  router.push(`/food/${id}`)
}

function isAllView() {
  return String(activeView.value || '') === 'all'
}

function isFavView() {
  return String(activeView.value || '') === 'fav'
}

function isCategoryView() {
  return String(activeView.value || '').startsWith('cat:')
}

const showCategorySkeleton = computed(() => isCategoryView() && loading.value)

function getActiveCategoryId() {
  const name = String(activeView.value || '')
  if (!name.startsWith('cat:')) return null
  const id = Number(name.slice(4))
  return Number.isFinite(id) ? id : null
}

function getRestaurantIdFromFavItem(item) {
  return (item.restaurant && item.restaurant.id) || item.restaurantId || item.targetId || item.id
}

function isFavRestaurant(restaurantId) {
  const id = Number(restaurantId)
  if (!Number.isFinite(id)) return false
  return favStateMap.value.get(id) === true
}

async function ensureFavState(restaurantId) {
  const id = Number(restaurantId)
  if (!Number.isFinite(id)) return false
  if (favStateMap.value.has(id)) return favStateMap.value.get(id) === true
  if (!userStore.isLoggedIn) {
    favStateMap.value.set(id, false)
    return false
  }
  try {
    const res = await checkFavoriteRestaurant({ restaurantId: id, userId: userStore.user?.id })
    const yes = !!res
    favStateMap.value.set(id, yes)
    return yes
  } catch {
    favStateMap.value.set(id, false)
    return false
  }
}

async function toggleFavRestaurantById(restaurantId) {
  const id = Number(restaurantId)
  if (!Number.isFinite(id)) return
  if (!userStore.isLoggedIn) {
    showToast('请先登录')
    return
  }
  const current = await ensureFavState(id)
  try {
    if (current) {
      await removeFavoriteRestaurant({ restaurantId: id, userId: userStore.user?.id })
      favStateMap.value.set(id, false)
      showToast('已取消收藏')
      favList.value = favList.value.filter(it => Number(getRestaurantIdFromFavItem(it)) !== id)
    } else {
      await addFavoriteRestaurant({ restaurantId: id, userId: userStore.user?.id })
      favStateMap.value.set(id, true)
      showToast('已添加到收藏')
    }
  } catch (e) {
    if (e?.status === 403) {
      showToast('请先登录')
      return
    }
    showToast(e?.message || '操作失败')
  }
}

async function hydrateFavStatesFromRestaurants(restaurants) {
  if (!userStore.isLoggedIn) return
  const ids = (Array.isArray(restaurants) ? restaurants : [])
    .map(r => Number(r?.id))
    .filter(n => Number.isFinite(n))
    .filter(n => !favStateMap.value.has(n))
  if (ids.length === 0) return
  await Promise.all(ids.map(id => ensureFavState(id)))
}

/**
 * 解析封面文件名为可访问URL（/images 前缀）
 * @param {string} cover
 * @returns {string}
 */
function resolveImageUrl(cover) {
  return processImageData({ coverImage: cover, images: '[]' }).coverUrl || ''
}

function tagStyle(name) {
  const gradients = [
    'linear-gradient(135deg, #ff3b30 0%, #ff9500 100%)',
    'linear-gradient(135deg, #34c759 0%, #12b981 100%)',
    'linear-gradient(135deg, #007aff 0%, #5856d6 100%)',
    'linear-gradient(135deg, #af52de 0%, #ff2d55 100%)',
    'linear-gradient(135deg, #ffcc00 0%, #ff9500 100%)',
  ]
  const s = String(name || '').trim()
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  const bg = gradients[h % gradients.length]
  return { background: bg }
}

function dedupeByDishId(list) {
  const seen = new Set()
  const out = []
  for (const it of Array.isArray(list) ? list : []) {
    const id = it?.dishId
    if (id == null) continue
    if (seen.has(id)) continue
    seen.add(id)
    out.push(it)
  }
  return out
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function runWithAreaLoading(fn) {
  const seq = ++areaLoadingSeq
  areaLoading.value = true
  const start = Date.now()
  try {
    return await fn()
  } finally {
    const elapsed = Date.now() - start
    const wait = Math.max(0, MIN_AREA_LOADING_MS - elapsed)
    if (wait) await sleep(wait)
    if (seq === areaLoadingSeq) areaLoading.value = false
  }
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
    hasMore.value = true
  }

  try {
    const categoryId = getActiveCategoryId()
    const payload = {
      pageNum: pageNum.value,
      pageSize: 10,
      query: {
        name: searchValue.value || undefined,
        categoryId: categoryId ?? undefined,
      }
    }
    const res = await fetchRestaurantsPage(payload)
    const list = res?.list || res?.records || res?.data?.list || []
    const newData = Array.isArray(list) ? list : []

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
  updateContentOverlayRect()
  const { scrollTop, clientHeight, scrollHeight } = document.documentElement
  if (scrollTop + clientHeight >= scrollHeight - 50) {
    if (isFavView()) {
      if (!favFinished.value && !favLoading.value) loadFavorites(false)
      return
    }
    if (isCategoryView()) {
      loadData(true)
      return
    }
  }

  if (!searchMode.value && isAllView() && recHasMore.value && !recLoading.value && recSentinelRef.value) {
    const rect = recSentinelRef.value.getBoundingClientRect()
    if (rect.top <= window.innerHeight + 80) {
      loadRecommendedDishes(false)
    }
  }
}

onMounted(() => {
  loading.value = true
  runWithAreaLoading(async () => {
    await Promise.allSettled([loadCategories(), loadRecommendedDishes(true)])
  }).finally(() => {
    loading.value = false
  })
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('resize', updateContentOverlayRect)
  nextTick(() => {
    updateContentOverlayRect()
    requestAnimationFrame(updateContentOverlayRect)
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', updateContentOverlayRect)
})

/**
 * 加载收藏的美食列表（需登录，仅查询）
 */
async function loadFavorites(reset = false) {
  if (!userStore.isLoggedIn) {
    favLoading.value = false
    favFinished.value = true
    return
  }
  if (reset) { favPageNum.value = 1; favFinished.value = false; favList.value = [] }
  if (favFinished.value || favLoading.value) return
  favLoading.value = true
  try {
    const res = await fetchFavoriteRestaurantsPage({
      pageNum: favPageNum.value,
      pageSize: FAV_PAGE_SIZE,
      query: { userId: userStore.user?.id }
    })
    const newData = res.list || res.records || res.data?.list || []
    const mapped = newData.map(it => {
      if (it && !it.restaurant) {
        return {
          ...it,
          restaurant: {
            id: it.restaurantId ?? it.id,
            name: it.name,
            coverImage: it.coverImage,
            openHours: it.openHours,
            priceRange: it.priceRange,
            contactPhone: it.contactPhone,
            rating: it.rating,
          },
        }
      }
      return it
    })
    if (favPageNum.value === 1) favList.value = mapped
    else favList.value.push(...mapped)
    for (const it of mapped) {
      const rid = Number(getRestaurantIdFromFavItem(it))
      if (Number.isFinite(rid)) favStateMap.value.set(rid, true)
    }
    if (newData.length < FAV_PAGE_SIZE) favFinished.value = true
    else favPageNum.value++
  } catch (e) {
    if (e?.status === 403) {
      showToast('请先登录')
    }
    favFinished.value = true
  } finally {
    favLoading.value = false
  }
}

/**
 * 切换视图（全部/收藏）
 * @param {'all'|'fav'} name
 */
async function onViewChange(name) {
  activeView.value = name
  if (String(name) !== 'all') {
    searchMode.value = false
  }
  loading.value = true
  if (String(name) === 'fav') {
    await runWithAreaLoading(async () => {
      await loadFavorites(true)
    }).finally(() => {
      loading.value = false
    })
    return
  }
  if (String(name) === 'all') {
    await runWithAreaLoading(async () => {
      await loadRecommendedDishes(true)
    }).finally(() => {
      loading.value = false
    })
    return
  }
  searchMode.value = false
  searchResults.value = []
  await runWithAreaLoading(async () => {
    await loadData(false)
  }).finally(() => {
    loading.value = false
  })
}

async function loadCategories() {
  if (categoriesLoading.value) return
  categoriesLoading.value = true
  try {
    const data = await fetchRestaurantCategoriesPage({
      pageNum: 1,
      pageSize: 50,
      sortField: 'sortOrder',
      sortDirection: 'ASC',
      query: { isEnabled: 1 },
    })
    restaurantCategories.value = data?.list || data?.records || []
  } catch (e) {
    restaurantCategories.value = []
  } finally {
    categoriesLoading.value = false
  }
}

async function loadRecommendedDishes(reset = false) {
  if (recLoading.value) return
  if (reset) {
    recPageNum.value = 1
    recHasMore.value = true
    recommendedDishes.value = []
  }
  if (!recHasMore.value) return

  recLoading.value = true
  try {
    const list = await fetchRecommendedDishCards({
      pageNum: recPageNum.value,
      pageSize: REC_PAGE_SIZE,
    })
    const rows = Array.isArray(list) ? list : []
    const merged = reset ? rows : [...recommendedDishes.value, ...rows]
    recommendedDishes.value = dedupeByDishId(merged)
    if (rows.length < REC_PAGE_SIZE) {
      recHasMore.value = false
    } else {
      recPageNum.value += 1
    }
  } catch {
    if (reset) recommendedDishes.value = []
    recHasMore.value = false
  } finally {
    recLoading.value = false
  }
}
</script>

<template>
  <div class="food-list-page">
    <van-search v-model="searchValue" placeholder="搜索校园美食" @search="onSearch" @clear="onClearSearch" />

    <van-swipe class="food-swipe" :autoplay="3000" indicator-color="white">
      <van-swipe-item v-for="item in swipeItems" :key="item.id">
        <van-image :src="item.img" width="100%" height="150" fit="fill" />
      </van-swipe-item>
    </van-swipe>

    <!-- 视图切换：全部 / 收藏 / 分类 -->
    <div style="padding: 0 12px 8px">
      <van-tabs :active="activeView" @change="onViewChange" swipeable animated :border="false" :ellipsis="false">
        <van-tab title="全部" name="all" />
        <van-tab title="收藏" name="fav" />
        <van-tab v-for="cat in restaurantCategories" :key="cat.id" :title="cat.name" :name="`cat:${cat.id}`" />
      </van-tabs>
    </div>

    <div class="content-area" ref="contentAreaRef">
      <div class="content-loading" v-if="areaLoading" :style="contentOverlayStyle">
        <div class="loading-container">
          <van-loading size="24px" color="#007aff">加载中...</van-loading>
        </div>
      </div>

      <div v-if="!loading && searchMode" class="recommend-section">
        <div class="recommend-title">搜索结果</div>
        <div class="recommend-scroll" v-if="searchResults.length">
          <div
            v-for="card in searchResults"
            :key="card.dishId"
            class="recommend-card"
            @click="onCardClick(card.restaurantId)"
          >
            <div class="card-cover">
              <van-image :src="resolveImageUrl(card.dishImageUrl)" width="100%" height="100%" fit="cover" />
            </div>
            <div class="card-body">
              <div class="dish-name">{{ card.dishName }}</div>
              <div class="dish-desc" v-if="card.dishDescription">{{ card.dishDescription }}</div>
              <div class="dish-meta">
                <div class="dish-price" v-if="card.dishPrice != null">¥ {{ Number(card.dishPrice).toFixed(2) }}</div>
                <div class="dish-tag" v-if="card.dishCategoryName" :style="tagStyle(card.dishCategoryName)">{{ card.dishCategoryName }}</div>
              </div>
              <div class="merchant-name">{{ card.restaurantName }}</div>
              <div class="merchant-sub">
                <span class="loc" v-if="card.restaurantLocation">{{ card.restaurantLocation }}</span>
                <span class="rate" v-if="card.restaurantRating != null">评分 {{ Number(card.restaurantRating).toFixed(1) }}</span>
              </div>
            </div>
          </div>
        </div>
        <van-empty v-else description="未找到相关美食" />
      </div>

      <div class="food-list" v-else-if="showCategorySkeleton">
        <div class="food-card" v-for="n in 4" :key="n">
          <van-skeleton :row="3" :avatar="true" avatar-shape="square" avatar-size="100%" />
        </div>
      </div>

      <div v-else-if="!loading && isAllView() && recommendedDishes.length" class="recommend-section">
        <div class="recommend-title">推荐菜品</div>
        <div class="recommend-scroll">
          <div
            v-for="card in recommendedDishes"
            :key="card.dishId"
            class="recommend-card"
            @click="onCardClick(card.restaurantId)"
          >
            <div class="card-cover">
              <van-image :src="resolveImageUrl(card.dishImageUrl)" width="100%" height="100%" fit="cover" />
            </div>
            <div class="card-body">
              <div class="dish-name">{{ card.dishName }}</div>
              <div class="dish-desc" v-if="card.dishDescription">{{ card.dishDescription }}</div>
              <div class="dish-meta">
                <div class="dish-price" v-if="card.dishPrice != null">¥ {{ Number(card.dishPrice).toFixed(2) }}</div>
                <div class="dish-tag" v-if="card.dishCategoryName" :style="tagStyle(card.dishCategoryName)">{{ card.dishCategoryName }}</div>
              </div>
              <div class="merchant-name">{{ card.restaurantName }}</div>
              <div class="merchant-sub">
                <span class="loc" v-if="card.restaurantLocation">{{ card.restaurantLocation }}</span>
                <span class="rate" v-if="card.restaurantRating != null">评分 {{ Number(card.restaurantRating).toFixed(1) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div ref="recSentinelRef" class="rec-sentinel"></div>
        <div class="rec-loading" v-if="recLoading">
          <van-loading size="20px">加载中...</van-loading>
        </div>
        <div class="rec-done" v-else-if="!recHasMore">
          <span>--- 我是有底线的 ---</span>
        </div>
      </div>

      <div class="food-list" v-else-if="!loading && isCategoryView()">
        <div class="food-card" v-for="food in foodList" :key="food.id" @click="onCardClick(food.id)">
          <div class="food-cover">
            <van-image class="food-image" :src="resolveImageUrl(food.coverImage)" width="100%" height="180" fit="cover" />
            <div class="fav-btn" @click.stop="toggleFavRestaurantById(food.id)">
              <van-icon :name="isFavRestaurant(food.id) ? 'like' : 'like-o'" :color="isFavRestaurant(food.id) ? '#ee0a24' : '#fff'" size="20" />
            </div>
          </div>
          <div class="food-info">
            <div class="title">{{ food.name }}</div>
            <div class="rating-author">
              <van-rate :model-value="toRateValue(food.rating)" :size="16" color="#ffd21e" void-icon="star" void-color="#eee" readonly allow-half />
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

      <div class="food-list" v-else-if="!loading && isFavView()">
        <div v-if="!userStore.isLoggedIn" class="food-card" style="padding: 16px; text-align: center;">
          <span>请先登录查看收藏</span>
        </div>
        <div class="food-card" v-for="item in favList" :key="item.id || item.restaurant?.id || item.targetId" @click="onCardClick((item.restaurant?.id) || item.id || item.targetId)">
          <div class="food-cover">
            <van-image class="food-image" :src="resolveImageUrl((item.restaurant?.coverImage) || item.coverImage)" width="100%" height="180" fit="cover" />
            <div class="fav-btn" @click.stop="toggleFavRestaurantById(getRestaurantIdFromFavItem(item))">
              <van-icon name="like" color="#ee0a24" size="20" />
            </div>
          </div>
          <div class="food-info">
            <div class="title">{{ (item.restaurant?.name) || item.name }}</div>
            <div class="rating-author">
              <van-rate :model-value="toRateValue((item.restaurant?.rating) ?? item.rating ?? item.restaurantRating)" :size="16" color="#ffd21e" void-icon="star" void-color="#eee" readonly allow-half />
            </div>
            <div class="meta">
              <div class="meta-item">
                <van-icon name="clock-o" />
                <span>{{ (item.restaurant?.openHours) || item.openHours }}</span>
              </div>
              <div class="meta-item">
                <van-icon name="gold-coin-o" />
                <span>{{ (item.restaurant?.priceRange) || item.priceRange }}</span>
              </div>
            </div>
            <div class="meta-item phone">
              <van-icon name="phone-o" />
              <span>{{ (item.restaurant?.contactPhone) || item.contactPhone }}</span>
            </div>
          </div>
        </div>
        <div class="load-more-tip">
          <van-loading v-if="favLoading" size="20px">加载中...</van-loading>
          <span v-else-if="favFinished && favList.length > 0">--- 我是有底线的 ---</span>
        </div>
      </div>

      <div class="load-more-tip" v-if="isCategoryView()">
        <van-loading v-if="loadingMore" size="20px">加载中...</van-loading>
        <span v-else-if="!hasMore && foodList.length > 0">--- 我是有底线的 ---</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.food-list-page {
  background: #f5f6f7;
  min-height: 100vh;
  padding-bottom: 20px;
}
.content-area {
  position: relative;
  min-height: 60vh;
}
.content-loading {
  position: fixed;
  bottom: 0;
  background: rgba(255,255,255,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  box-sizing: border-box;
}
.loading-container {
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(255,255,255,0.9);
  box-shadow: 0 8px 18px rgba(0,0,0,0.08);
}
.food-swipe {
  margin: 12px;
  border-radius: 12px;
  overflow: hidden;
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
.food-cover {
  position: relative;
}
.fav-btn {
  position: absolute;
  right: 10px;
  top: 10px;
  width: 34px;
  height: 34px;
  border-radius: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(6px);
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

.recommend-section {
  padding: 0 12px 8px;
}
.recommend-title {
  font-size: 16px;
  font-weight: 600;
  margin: 8px 0 10px;
}
.recommend-scroll {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.recommend-card {
  width: 100%;
  max-width: 100%;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 6px 14px rgba(0,0,0,0.08);
  display: flex;
  height: 112px;
}
.card-cover {
  height: 100%;
  aspect-ratio: 1.3 / 1;
  flex: 0 0 auto;
}
.card-cover :deep(.van-image) {
  width: 100%;
  height: 100%;
}
.card-body {
  padding: 10px 10px 10px;
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.card-body .dish-name {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.card-body .dish-desc {
  font-size: 12px;
  color: #666;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-body .dish-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.card-body .dish-price {
  color: #ee0a24;
  font-size: 13px;
  font-weight: 700;
}
.card-body .dish-tag {
  font-size: 12px;
  color: #fff;
  padding: 2px 8px;
  border-radius: 999px;
  max-width: 55%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  box-shadow: 0 4px 10px rgba(0,0,0,0.12);
}
.card-body .merchant-name {
  font-size: 12px;
  color: #666;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.card-body .merchant-sub {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  color: #969799;
}
.card-body .merchant-sub .loc {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.card-body .merchant-sub .rate {
  flex: 0 0 auto;
  color: #ff9500;
}
.rec-sentinel {
  height: 1px;
}
.rec-loading,
.rec-done {
  padding: 12px 0 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  color: #969799;
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
