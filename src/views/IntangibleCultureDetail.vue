<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { fetchIntangibleCultureById } from '@/api/modules/intangibleCulture'

const route = useRoute()
const router = useRouter()

// 非遗文化详情数据
const culture = ref(null)
const loading = ref(true)

// 处理图片数据
const imageView = computed(() => {
  if (!culture.value) return { coverUrl: '', imageUrls: [] }
  const cover = culture.value.coverImage || ''
  const imagesStr = culture.value.images || '[]'
  let imageUrls = []
  try {
    imageUrls = typeof imagesStr === 'string' ? JSON.parse(imagesStr) : imagesStr
  } catch (e) {
    imageUrls = []
  }
  return { coverUrl: cover, imageUrls: imageUrls }
})

// 轮播图列表
const swiperImages = computed(() => {
  const cover = imageView.value.coverUrl
  const list = imageView.value.imageUrls || []
  const all = [cover, ...list].filter(Boolean)
  return [...new Set(all)]
})

// 加载非遗文化详情
onMounted(async () => {
  const id = route.params.id
  if (!id) {
    showToast('无效的非遗文化 ID')
    loading.value = false
    return
  }
  
  try {
    loading.value = true
    const data = await fetchIntangibleCultureById(id)
    console.log('非遗文化详情数据:', data)
    culture.value = data
  } catch (error) {
    console.error('获取非遗文化详情失败:', error)
    showToast(error.message || '获取非遗文化详情失败')
  } finally {
    loading.value = false
  }
})

// 返回上一页
const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="intangible-culture-detail-page">
    <!-- 头部 -->
    <div class="page-header">
      <div class="back-button" @click="goBack">
        <van-icon name="arrow-left" size="20" />
      </div>
      <h1>非遗文化详情</h1>
    </div>

    <!-- 加载状态 -->
    <template v-if="loading">
      <div class="loading-container">
        <van-skeleton :title="true" :row="3" :avatar="true" avatar-size="200" />
      </div>
    </template>

    <!-- 详情内容 -->
    <template v-else-if="culture">
      <div class="culture-detail">
        <!-- 图片轮播 -->
        <van-swipe
          v-if="swiperImages.length > 0"
          class="my-swipe"
          :autoplay="3000"
          indicator-color="#8B4513"
        >
          <van-swipe-item v-for="(img, index) in swiperImages" :key="index">
            <van-image :src="img" width="100%" height="300" fit="cover" />
          </van-swipe-item>
        </van-swipe>

        <!-- 基本信息 -->
        <div class="info-section">
          <h2 class="culture-name">{{ culture.name }}</h2>
          <div class="tags">
            <van-tag v-if="culture.type" type="primary" color="#8B4513" size="large">
              {{ culture.type }}
            </van-tag>
          </div>
          <div class="inheritor" v-if="culture.inheritor">
            <van-icon name="manager-o" />
            <span>传承人：{{ culture.inheritor }}</span>
          </div>
        </div>

        <!-- 简介 -->
        <div class="section">
          <h3 class="section-title">简介</h3>
          <p class="section-content">{{ culture.description }}</p>
        </div>
      </div>
    </template>

    <!-- 无数据 -->
    <template v-else>
      <van-empty description="未找到该非遗文化信息" />
    </template>
  </div>
</template>

<style scoped>
.intangible-culture-detail-page {
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
  font-size: 20px;
  font-weight: bold;
  margin: 0;
}

.loading-container {
  padding: 15px;
}

.culture-detail {
  background: white;
}

.my-swipe {
  width: 100%;
  height: 300px;
}

.info-section {
  padding: 20px 15px;
  border-bottom: 1px solid #eee;
}

.culture-name {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 0 0 10px 0;
}

.tags {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.inheritor {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-size: 14px;
}

.section {
  padding: 20px 15px;
  border-bottom: 1px solid #eee;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #8B4513;
  margin: 0 0 10px 0;
  display: flex;
  align-items: center;
  gap: 5px;
}

.section-content {
  font-size: 14px;
  line-height: 1.8;
  color: #666;
  margin: 0;
  white-space: pre-wrap;
}
</style>
