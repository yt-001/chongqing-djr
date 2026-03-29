<script setup>
// 非遗文化页面
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, Icon as VanIcon } from 'vant'
import { useUserStore } from '@/store/user'
import { fetchIntangibleCulturesPage } from '@/api/modules/intangibleCulture'
import { processImageData } from '@/utils/imageUtils'

const userStore = useUserStore()
const router = useRouter()

// 搜索相关
const searchValue = ref('')
const isSearching = ref(false)

// 加载状态
const loading = ref(true)
const loadingMore = ref(false)

// 非遗文化列表数据
const cultureList = ref([])

// 分页相关
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const hasMore = ref(true)

// 加载非遗文化数据
const loadCultures = async (isLoadMore = false) => {
  if (isLoadMore) {
    if (loadingMore.value || !hasMore.value) return
    loadingMore.value = true
    pageNum.value++
  } else {
    loading.value = true
    pageNum.value = 1
    cultureList.value = []
    hasMore.value = true
  }
  
  try {
    // 构建请求参数
    const payload = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      query: {}
    }
    
    // 如果有搜索关键词，添加到查询条件
    if (searchValue.value.trim()) {
      payload.query.keyword = searchValue.value.trim()
    }
    
    // 调用 API 接口
    const response = await fetchIntangibleCulturesPage(payload)
    
    // 处理响应数据 - request 函数已经处理了 code 检查，成功时直接返回 data
    // response 是 PageBean 对象，包含 list 和 total 等字段
    if (response) {
      const newList = response.list || []
      cultureList.value = isLoadMore ? [...cultureList.value, ...newList] : newList
      total.value = response.total || 0
      
      // 判断是否还有更多数据
      if (newList.length < pageSize.value || cultureList.value.length >= total.value) {
        hasMore.value = false
      }
    } else {
      showToast({ message: '加载失败', position: 'top' })
    }
  } catch (error) {
    console.error('加载非遗文化数据失败:', error)
    showToast({ message: error.message || '网络错误', position: 'top' })
    if (isLoadMore) pageNum.value--
  } finally {
    loading.value = false
    loadingMore.value = false
    isSearching.value = false
  }
}

// 搜索处理
const onSearch = () => {
  isSearching.value = true
  loadCultures(false)
}

// 清除搜索
const onClearSearch = () => {
  searchValue.value = ''
  isSearching.value = true
  loadCultures(false)
}

// 滚动事件处理
const handleScroll = () => {
  const { scrollTop, clientHeight, scrollHeight } = document.documentElement
  if (scrollTop + clientHeight >= scrollHeight - 50) {
    loadCultures(true)
  }
}

// 打开非遗文化详情页
const onOpenCulture = (id) => {
  if (!userStore.isLoggedIn) {
    showToast({ message: '请先登录以查看详情', position: 'top' })
    return
  }
  // 跳转到详情页
  router.push(`/intangible-culture/${id}`)
}

// 返回上一页
const goBack = () => {
  router.back()
}

const resolveImageUrl = (coverImage) => {
  return processImageData({ coverImage, images: '[]' }).coverUrl || ''
}

// 页面加载时获取数据
onMounted(() => {
  loadCultures()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="intangible-culture-page">
    <div class="page-header">
      <div class="back-button" @click="goBack">
        <van-icon name="arrow-left" size="20" />
      </div>
      <h1>非遗文化</h1>
      <p>探索重庆梁平的非物质文化遗产</p>
    </div>

    <!-- 搜索框 -->
    <div class="search-box">
      <van-search
        v-model="searchValue"
        shape="round"
        background="transparent"
        placeholder="搜索非遗名称、类型、传承人"
        @search="onSearch"
        @clear="onClearSearch"
        show-action
      >
        <template #action>
          <div class="search-btn" @click="onSearch">搜索</div>
        </template>
      </van-search>
    </div>

    <!-- 加载占位 -->
    <template v-if="loading">
      <div class="loading-container">
        <van-skeleton :title="true" :row="3" :avatar="true" avatar-size="180" />
        <van-skeleton :title="true" :row="3" :avatar="true" avatar-size="180" />
        <van-skeleton :title="true" :row="3" :avatar="true" avatar-size="180" />
      </div>
    </template>

    <!-- 非遗文化列表 -->
    <template v-else>
      <div class="culture-list">
        <div 
          v-for="culture in cultureList" 
          :key="culture.id" 
          class="culture-item"
          @click="onOpenCulture(culture.id)"
        >
          <van-image 
            :src="resolveImageUrl(culture.coverImage)" 
            width="100%" 
            height="180" 
            fit="cover" 
          />
          <div class="culture-info">
            <div class="name">{{ culture.name }}</div>
            <div class="status">{{ culture.type }}</div>
            <div class="description">{{ culture.description }}</div>
          </div>
        </div>
        
        <!-- 加载更多提示 -->
        <div v-if="loadingMore" class="loading-more">
          <van-loading size="20px">加载中...</van-loading>
        </div>
        
        <!-- 没有更多数据提示 -->
        <div v-if="!hasMore && cultureList.length > 0" class="no-more">
          没有更多了
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.intangible-culture-page {
  min-height: 100vh;
  background: #f5f6f7;
}

.page-header {
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  color: white;
  padding: 20px 15px;
  text-align: center;
  position: relative;
}

.back-button {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  padding: 5px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
  margin-left: 30px;
}

.page-header p {
  font-size: 14px;
  opacity: 0.9;
}

.search-box {
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  padding: 0 12px 12px;
}

.search-box :deep(.van-search__content) {
  background: rgba(255, 255, 255, 0.95);
}

.search-btn {
  color: #fff;
  font-size: 14px;
  padding: 0 8px;
}

.loading-container {
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.culture-list {
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.culture-item {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.culture-item:hover {
  transform: translateY(-2px);
}

.loading-more {
  display: flex;
  justify-content: center;
  padding: 15px 0;
  color: #999;
}

.no-more {
  text-align: center;
  padding: 15px 0;
  color: #999;
  font-size: 14px;
}

.culture-info {
  padding: 15px;
}

.culture-info .name {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
}

.culture-info .status {
  display: inline-block;
  background: #8B4513;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  margin-bottom: 10px;
}

.culture-info .description {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}
</style>