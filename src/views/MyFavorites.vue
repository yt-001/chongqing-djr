<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { 
  fetchFavoriteAttractionsPage, removeFavoriteAttraction,
  fetchFavoriteRestaurantsPage, removeFavoriteRestaurant,
  fetchFavoriteAccommodationsPage, removeFavoriteAccommodation
} from '@/api'
import { processImageData } from '@/utils/imageUtils.js'
import { useUserStore } from '@/store/user.js'

const router = useRouter()
const userStore = useUserStore()

// Tab 状态：0=景点, 1=美食, 2=住宿
const activeTab = ref(0)

// 为每个 Tab 维护独立的状态
const tabs = ref([
  { id: 0, name: '景点', list: [], loading: false, finished: false, pageNum: 1 },
  { id: 1, name: '美食', list: [], loading: false, finished: false, pageNum: 1 },
  { id: 2, name: '住宿', list: [], loading: false, finished: false, pageNum: 1 }
])

const pageSize = 10

// 切换 Tab 时，如果该 Tab 为空且未完成，触发加载
watch(activeTab, (newVal) => {
  const tab = tabs.value[newVal]
  if (tab.list.length === 0 && !tab.finished && !tab.loading) {
    onLoad()
  }
})

// 首次进入页面，主动加载当前 Tab 数据
onMounted(() => {
  const tab = tabs.value[activeTab.value]
  if (tab.list.length === 0 && !tab.finished && !tab.loading) {
    onLoad()
  }
})

/**
 * 加载数据（需登录，分页查询收藏）
 */
async function onLoad() {
  const tabIndex = activeTab.value
  const tab = tabs.value[tabIndex]
  
  // 登录拦截：未登录不发起请求
  if (!userStore.isLoggedIn) {
    tab.loading = false
    tab.finished = true
    return
  }
  
  if (tab.finished || tab.loading) return
  tab.loading = true
  
  try {
    let res
    const params = { 
      pageNum: tab.pageNum, 
      pageSize, 
      query: { userId: userStore.user?.id } // 显式传递用户ID以兼容后端
    }
    
    if (tabIndex === 0) {
      res = await fetchFavoriteAttractionsPage(params)
    } else if (tabIndex === 1) {
      res = await fetchFavoriteRestaurantsPage(params)
    } else {
      res = await fetchFavoriteAccommodationsPage(params)
    }
    
    // 兼容后端返回结构
    const newData = res.list || res.records || res.data?.list || []
    
    if (tab.pageNum === 1) {
      tab.list = newData
    } else {
      tab.list.push(...newData)
    }
    
    if (newData.length < pageSize) {
      tab.finished = true
    } else {
      tab.pageNum++
    }
  } catch (e) {
    tab.finished = true
    console.error(e)
    showToast(e?.message || '加载失败')
  } finally {
    tab.loading = false
  }
}

/**
 * 统一获取对象数据
 */
function getTarget(item) {
  // 根据不同 Tab 返回对应实体
  if (activeTab.value === 0) return item.attraction || item
  if (activeTab.value === 1) return item.restaurant || item
  if (activeTab.value === 2) return item.accommodation || item
  return item
}

/**
 * 获取封面图
 */
function getCover(item) {
  const target = getTarget(item)
  const { coverUrl } = processImageData({ coverImage: target.coverImage, images: target.images || '[]' })
  return coverUrl
}

/**
 * 跳转详情
 */
function goDetail(item) {
  /**
   * 获取当前卡片对应实体的真实ID
   * 优先取嵌套实体ID；否则取平铺的 {attractionId|restaurantId|accommodationId}；再兜底 targetId
   * @param {any} it
   * @returns {number|string|undefined}
   */
  function getTargetId(it) {
    if (activeTab.value === 0) {
      return (it.attraction && it.attraction.id) || it.attractionId || it.targetId || (it.id && it.entityType === 'attraction' ? it.id : undefined)
    }
    if (activeTab.value === 1) {
      return (it.restaurant && it.restaurant.id) || it.restaurantId || it.targetId || (it.id && it.entityType === 'restaurant' ? it.id : undefined)
    }
    if (activeTab.value === 2) {
      return (it.accommodation && it.accommodation.id) || it.accommodationId || it.targetId || (it.id && it.entityType === 'accommodation' ? it.id : undefined)
    }
    return it.targetId || it.id
  }

  const id = getTargetId(item)
  if (!id) return

  if (activeTab.value === 0) {
    router.push({ name: 'scenic-detail', params: { id } })
  } else if (activeTab.value === 1) {
    router.push({ name: 'food-detail', params: { id } })
  } else if (activeTab.value === 2) {
    router.push({ name: 'accommodation-detail', params: { id } })
  }
}

/**
 * 移除收藏
 */
function remove(item) {
  const target = getTarget(item)
  const id = target.id
  
  showConfirmDialog({
    title: '取消收藏',
    message: `确定要取消收藏该${tabs.value[activeTab.value].name}吗？`,
  })
    .then(async () => {
      try {
        const userId = userStore.user?.id
        if (activeTab.value === 0) {
          await removeFavoriteAttraction({ attractionId: id, userId })
        } else if (activeTab.value === 1) {
          await removeFavoriteRestaurant({ restaurantId: id, userId })
        } else {
          await removeFavoriteAccommodation({ accommodationId: id, userId })
        }
        
        // 移除成功后从本地列表删除
        const tab = tabs.value[activeTab.value]
        const idx = tab.list.indexOf(item)
        if (idx > -1) tab.list.splice(idx, 1)
        showToast('已移除')
      } catch (e) {
        showToast(e.message || '操作失败')
      }
    })
    .catch(() => {})
}
</script>

<template>
  <div class="favorites-page">
    <van-nav-bar title="我的收藏" left-text="返回" left-arrow @click-left="router.back()" fixed placeholder z-index="10" />
    
    <van-tabs v-model:active="activeTab" sticky offset-top="46px" animated swipeable>
      <van-tab v-for="tab in tabs" :key="tab.id" :title="tab.name">
        <van-list
          v-model:loading="tab.loading"
          :finished="tab.finished"
          finished-text="没有更多了"
          @load="onLoad"
          class="tab-content"
        >
          <div v-if="tab.list.length === 0 && tab.finished" class="empty-state">
            <van-empty :description="`暂无${tab.name}收藏`" />
          </div>

          <div class="fav-list" v-else>
            <div 
              v-for="(item, index) in tab.list" 
              :key="index" 
              class="fav-card" 
              @click="goDetail(item)"
            >
              <!-- 左侧图片 -->
              <van-image 
                :src="getCover(item) || 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'" 
                class="fav-img" 
                fit="cover" 
                radius="8px" 
              />
              
              <!-- 右侧信息 -->
              <div class="fav-info">
                <!-- 顶部：名称 -->
                <div class="fav-row-top">
                  <div class="fav-name">{{ getTarget(item).name }}</div>
                </div>
                
                <!-- 中部：不同类型展示不同信息 -->
                <div class="fav-meta">
                  <!-- 景点：位置 -->
                  <div v-if="activeTab === 0 && getTarget(item).location" class="meta-item">
                    <van-icon name="location-o" /> {{ getTarget(item).location }}
                  </div>
                  
                  <!-- 美食：人均 + 口味 -->
                  <template v-if="activeTab === 1">
                    <div class="meta-item price" v-if="getTarget(item).averagePrice">
                      ¥{{ getTarget(item).averagePrice }}/人
                    </div>
                    <div class="meta-item rating" v-if="getTarget(item).rating">
                      <van-icon name="star" color="#ff9800" /> {{ getTarget(item).rating }}分
                    </div>
                  </template>
                  
                  <!-- 住宿：价格 + 类型 -->
                  <template v-if="activeTab === 2">
                    <div class="meta-item price" v-if="getTarget(item).price">
                      ¥{{ getTarget(item).price }} <span class="unit">起</span>
                    </div>
                    <div class="meta-item tag" v-if="getTarget(item).type">
                      {{ getTarget(item).type }}
                    </div>
                  </template>
                </div>
                
                <!-- 底部：描述/地址 + 删除按钮 -->
                <div class="fav-row-btm">
                  <div class="fav-desc line-1">{{ getTarget(item).description || getTarget(item).address || '暂无介绍' }}</div>
                  <div class="fav-action" @click.stop="remove(item)">
                    <van-icon name="delete-o" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </van-list>
      </van-tab>
    </van-tabs>
  </div>
</template>

<style scoped>
.favorites-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.tab-content {
  min-height: calc(100vh - 90px);
}

.fav-list {
  padding: 12px;
}

.fav-card {
  display: flex;
  background: #fff;
  border-radius: 12px;
  padding: 10px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.fav-img {
  width: 90px;
  height: 90px;
  flex-shrink: 0;
  margin-right: 12px;
  border: 1px solid #f0f0f0;
}

.fav-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2px 0;
}

.fav-name {
  font-weight: 600;
  font-size: 16px;
  color: #333;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fav-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #666;
  margin: 4px 0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 2px;
}

.meta-item.price {
  color: #ff5722;
  font-weight: 500;
  font-size: 14px;
}

.meta-item.price .unit {
  font-size: 12px;
  color: #999;
  font-weight: normal;
}

.meta-item.rating {
  color: #ff9800;
}

.meta-item.tag {
  background: #f0f9eb;
  color: #67c23a;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.fav-row-btm {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.fav-desc {
  font-size: 12px;
  color: #999;
  flex: 1;
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fav-action {
  color: #999;
  font-size: 18px;
  padding: 4px;
}

.empty-state {
  padding-top: 60px;
}
</style>
