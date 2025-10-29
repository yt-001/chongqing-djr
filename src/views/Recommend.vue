<script setup>
// 推荐页面（去除分页与加载逻辑）
// 仅保留：顶部彩色分类网格、第二排分类、主题横幅、卡片列表结构
import { ref, onMounted, onUnmounted } from 'vue'
import { showToast } from 'vant'
import { fetchAttractionsPage } from '../api/modules/attractions.js'

// 分类点击事件（示例）
const onCategoryClick = (name) => {
  showToast({ message: `${name} 开发中`, position: 'top' })
}

// 顶部彩色分类（第一排）
const categoriesTop = ref([
  { name: '亲子游', icon: 'smile-o', color: '#26c6da' },
  { name: '文化游', icon: 'balance-o', color: '#42a5f5' },
  { name: '温泉游', icon: 'fire-o', color: '#ef6c00' },
  { name: '周边游', icon: 'location-o', color: '#8e24aa' },
])

// 第二排分类
const categoriesBottom = ref([
  { name: '旅游地图', icon: 'map-marked', color: '#29b6f6' },
  { name: '酒店民宿', icon: 'hotel-o', color: '#66bb6a' },
  { name: '汽车票', icon: 'guide-o', color: '#ab47bc' },
  { name: '飞机票', icon: 'share', color: '#ffa726' },
])

// 主题横幅（示例）
const banner = ref({
  title: '冬日温泉',
  sub: '暖/冬/旅/游 · 一起/冰/泡/泉/吧',
  image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200'
})

// 加载状态
const loading = ref(true) // 初始加载
const loadingMore = ref(false) // 滚动加载
const hasMore = ref(true) // 是否还有更多数据

// 卡片列表数据
const feed = ref([])
const pageNum = ref(1)

const onOpenItem = (id) => {
  showToast({ message: `推荐内容 ${id} 开发中`, position: 'top' })
}

// 加载更多数据
const loadMore = async () => {
  // 如果正在加载或没有更多数据，则不执行
  if (loadingMore.value || !hasMore.value) return

  loadingMore.value = true
  pageNum.value++

  try {
    const payload = {
      pageNum: pageNum.value,
      pageSize: 10,
      sortDirection: 'ASC',
      query: { name: '', location: '' }
    }
    const start = Date.now()
    const res = await fetchAttractionsPage(payload)
    const list = res?.list || res?.records || res?.data?.list || []
    const newData = Array.isArray(list) ? list : []

    // 保证至少 1 秒加载动画
    const elapsed = Date.now() - start
    if (elapsed < 1000) {
      await new Promise(r => setTimeout(r, 1000 - elapsed))
    }

    // 追加新数据
    feed.value.push(...newData)

    // 如果返回的数据少于请求数量，说明没有更多了
    if (newData.length < payload.pageSize) {
      hasMore.value = false
    }
  } catch (e) {
    showToast({ message: '加载更多失败', position: 'top' })
    pageNum.value-- // 失败时回滚页码
  } finally {
    loadingMore.value = false
  }
}

// 滚动事件处理
const handleScroll = () => {
  // 接近底部时加载更多
  const { scrollTop, clientHeight, scrollHeight } = document.documentElement
  if (scrollTop + clientHeight >= scrollHeight - 50) {
    loadMore()
  }
}

// 进入页面后主动请求固定参数的接口，至少等待一秒后再更新数据
onMounted(async () => {
  try {
    // 固定的分页与查询参数，仅请求十条
    const payload = {
      pageNum: pageNum.value,
      pageSize: 10,
      sortDirection: 'ASC',
      query: { name: '', location: '' }
    }
    loading.value = true

    // 开始计时，保证至少 1 秒加载态
    const start = Date.now()

    // 调用后端分页接口
    const res = await fetchAttractionsPage(payload)
    // 兼容后端返回结构：优先取 res.list 或 res.records，其次取 res.data?.list
    const list = res?.list || res?.records || res?.data?.list || []

    // 计算耗时，若不足一秒则补足
    const elapsed = Date.now() - start
    if (elapsed < 1000) {
      await new Promise(r => setTimeout(r, 1000 - elapsed))
    }

    // 更新列表与加载状态
    const data = Array.isArray(list) ? list : []
    feed.value = data
    if (data.length < payload.pageSize) {
      hasMore.value = false
    }
  } catch (e) {
    showToast({ message: '数据加载失败', position: 'top' })
  } finally {
    loading.value = false
  }

  // 监听滚动事件
  window.addEventListener('scroll', handleScroll)
})

// 组件卸载时移除监听器
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="recommend-page">
    <!-- 彩色分类网格（第一排） -->
    <div class="cat-grid">
      <div
        v-for="cat in categoriesTop"
        :key="cat.name"
        class="cat-item"
        :style="{ background: cat.color }"
        @click="onCategoryClick(cat.name)"
      >
        <van-icon :name="cat.icon" size="20" />
        <span class="name">{{ cat.name }}</span>
      </div>
    </div>

    <!-- 第二排分类 -->
    <div class="cat-grid second">
      <div
        v-for="cat in categoriesBottom"
        :key="cat.name"
        class="cat-item"
        :style="{ background: cat.color }"
        @click="onCategoryClick(cat.name)"
      >
        <van-icon :name="cat.icon" size="20" />
        <span class="name">{{ cat.name }}</span>
      </div>
    </div>

    <!-- 主题横幅 -->
    <div class="theme-banner">
      <van-image :src="banner.image" width="100%" height="110" fit="cover" />
      <div class="theme-text">
        <div class="title">{{ banner.title }}</div>
        <div class="sub">{{ banner.sub }}</div>
      </div>
    </div>

    <!-- 列表区域：显示加载占位，至少一秒后再展示数据 -->
    <div class="feed-list">
      <!-- 加载占位骨架（使用 Vant Skeleton 组件） -->
      <template v-if="loading">
        <div class="feed-item" v-for="n in 6" :key="n">
          <van-skeleton :title="true" :row="2" :avatar="true" avatar-shape="square" avatar-size="120" />
        </div>
      </template>

      <!-- 数据卡片 -->
      <template v-else>
        <div class="feed-item" v-for="item in feed" :key="item.id" @click="onOpenItem(item.id)">
          <van-image :src="item.coverImage" width="100%" height="120" fit="cover" />
          <div class="feed-info">
            <div class="title">{{ item.name }}</div>
            <div class="desc">{{ item.description }}</div>
            <div class="meta">
              <span class="hours">营业时间：{{ item.openHours }}</span>
              <span class="price">票价：{{ Number(item.ticketPrice).toFixed(2) }} 元</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.recommend-page {
  min-height: 100vh;
  background: #f5f6f7;
}

/* 彩色分类网格 */
.cat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin: 12px;
}
.cat-grid.second { margin-top: 0; }
.cat-item {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  color: #fff; border-radius: 10px; height: 48px;
  box-shadow: 0 6px 14px rgba(0,0,0,0.08);
}
.cat-item .name { font-size: 12px; }

/* 主题横幅 */
.theme-banner { position: relative; margin: 12px; border-radius: 12px; overflow: hidden; }
.theme-text { position: absolute; left: 12px; bottom: 10px; color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,0.25); }
.theme-text .title { font-weight: 700; font-size: 18px; }
.theme-text .sub { font-size: 12px; opacity: 0.95; }

/* 卡片列表（两列流式） */
.feed-list { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 12px; }
.feed-item { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 6px 14px rgba(0,0,0,0.06); }
.feed-info { padding: 8px 10px; }
.feed-info .title { font-size: 14px; font-weight: 700; line-height: 1.5; }
.feed-info .desc { font-size: 12px; color: #666; margin-top: 4px; }
.feed-info .meta { display: flex; justify-content: space-between; color: #888; font-size: 12px; margin-top: 6px; }
.feed-info .price { color: #12b981; font-weight: 600; }

/* 加载更多 */
.load-more-tip {
  padding: 16px 0 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  color: #969799;
}
</style>
