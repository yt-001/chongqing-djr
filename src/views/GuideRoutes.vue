<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchGuideRouteCards } from '@/api/modules/guideRoutes.js'
import { processImageData } from '@/utils/imageUtils.js'
import { showToast } from 'vant'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const routes = ref([])
const loading = ref(true)

const loadData = async () => {
  loading.value = true
  try {
    const data = await fetchGuideRouteCards()
    routes.value = data || []
  } catch (error) {
    console.error(error)
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => router.back()

const goToDetail = (routeId) => {
  if (!userStore.isLoggedIn) {
    showToast({ message: '请先登录后再查看路线详情', position: 'top' })
    return
  }
  router.push({ name: 'route-map-navigation', query: { routeId } })
}

const getCoverUrl = (img) => {
  // 仅使用数据库真实数据转换后的结果，不再使用前端兜底图
  return processImageData({ coverImage: img }).coverUrl
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="guide-routes-page">
    <van-nav-bar
      title="路线推荐"
      left-text="返回"
      left-arrow
      fixed
      placeholder
      @click-left="goBack"
    />

    <div class="content">
      <div v-if="loading" class="loading-state">
        <div class="skeleton-list">
          <div class="skeleton-card" v-for="n in 2" :key="n">
            <div class="skeleton-cover"></div>
            <div class="skeleton-info">
              <van-skeleton title :row="2" />
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="routes.length" class="route-list">
        <div 
          v-for="(item, idx) in routes" 
          :key="item.id ?? idx" 
          class="route-card"
          @click="item.id && goToDetail(item.id)"
        >
          <div class="card-cover">
            <img :src="getCoverUrl(item.coverImage)" alt="cover" loading="lazy" />
            <div class="card-overlay">
              <div class="card-stats">
                <span class="stat-tag" v-if="item.pointCount">
                  <van-icon name="location-o" /> {{ item.pointCount }}个打卡点
                </span>
              </div>
            </div>
          </div>
          <div class="card-info">
            <h3 class="card-title">{{ item.name || '未命名路线' }}</h3>
            <p class="card-desc">{{ item.description || '暂无描述' }}</p>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <van-empty description="暂无推荐路线" image="search" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.guide-routes-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.content {
  padding: 16px;
}

.loading-state { width: 100%; }
.skeleton-list { display: flex; flex-direction: column; gap: 16px; }
.skeleton-card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06); }
.skeleton-cover { height: 180px; background: linear-gradient(90deg, #eaeef3 25%, #f5f6f7 50%, #eaeef3 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite; }
.skeleton-info { padding: 16px; }
@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.route-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.route-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  position: relative;
}

.route-card:active {
  transform: scale(0.98);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.card-cover {
  position: relative;
  height: 180px;
  background-color: #f0f2f5;
  overflow: hidden;
}

.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.route-card:active .card-cover img {
  transform: scale(1.05);
}

.card-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 40px 12px 12px;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;
}

.stat-tag {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  color: #fff;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.card-info {
  padding: 16px;
  background: #fff;
}

.card-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: #323233;
  line-height: 1.4;
}

.card-desc {
  margin: 0;
  font-size: 14px;
  color: #969799;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.loading-state {
  padding-top: 120px;
  display: flex;
  justify-content: center;
}

.empty-state {
  padding-top: 60px;
}
</style>
