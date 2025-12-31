<template>
  <div class="guide-map-gallery">
    <!-- 顶部搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="请输入向导图名称搜索..."
        clearable
        class="search-input"
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button @click="handleSearch">
            <el-icon><Search /></el-icon>
          </el-button>
        </template>
      </el-input>

      <!-- 草稿箱按钮 -->
      <el-button 
        type="warning" 
        plain 
        class="draft-btn" 
        @click="loadDraft"
      >
        <el-icon><Document /></el-icon>
        加载草稿
      </el-button>
    </div>

    <!-- 图库列表区域 -->
    <div class="gallery-container" v-loading="loading">
      <el-row :gutter="20">
        <el-col
          v-for="item in guideMaps"
          :key="item.id"
          :span="4"
          :xs="12"
          :sm="8"
          :md="6"
          :lg="4.8"
          class="gallery-col"
        >
          <!-- 自定义每行5个，Element Plus 默认24分栏，24/5 = 4.8，这里直接用css grid可能更方便，或者用 flex -->
          <!-- 为了严格实现一排5个，推荐使用 Flex 布局或者 CSS Grid，而不是 el-col span -->
          <div class="gallery-card" @click="viewGuideMap(item)">
            <div class="card-cover">
              <!-- 占位图或实际封面 -->
              <el-image :src="item.coverUrl || defaultCover" fit="cover" class="cover-image">
                <template #error>
                  <div class="image-slot">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
            </div>
            <div class="card-info">
              <h3 class="map-name" :title="item.name">{{ item.name }}</h3>
              <div class="map-meta">
                <span class="node-count">{{ item.nodeCount }}个节点</span>
                <span class="create-time">{{ item.createTime }}</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
      
      <!-- 如果使用 Grid 布局实现严格的 5 列 -->
      <div class="grid-layout">
        <div 
          v-for="item in guideMaps" 
          :key="'grid-' + item.id" 
          class="gallery-card"
          @click="viewGuideMap(item)"
        >
          <div class="card-cover">
             <el-image :src="item.coverUrl || defaultCover" fit="cover" class="cover-image" />
          </div>
          <div class="card-info">
             <h3 class="map-name">{{ item.name }}</h3>
             <div class="map-meta">
                <span>{{ item.nodeCount }}个点位</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Picture, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { fetchGuideRouteCards, fetchGuideRouteDraftCards } from '@/api'

const router = useRouter()
const searchKeyword = ref('')
const defaultCover = '/images/guide-map-default.jpg'
const guideMapsRaw = ref([])
const loading = ref(false)
const currentMode = ref('published')

const guideMaps = computed(() => {
  const keyword = searchKeyword.value.trim()
  if (!keyword) {
    return guideMapsRaw.value
  }
  return guideMapsRaw.value.filter(item =>
    item.name && item.name.toLowerCase().includes(keyword.toLowerCase())
  )
})

const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    return
  }
  if (!guideMaps.value.length) {
    ElMessage.info('暂无匹配的向导图')
  }
}

const viewGuideMap = (item) => {
  if (!item || !item.id) {
    return
  }
  router.push({ name: 'admin-guide-map-workflow', query: { routeId: item.id } })
}

const loadDraft = async () => {
  await loadGuideMaps('draft')
  if (!guideMapsRaw.value.length) {
    ElMessage.warning('当前没有草稿记录')
    await loadGuideMaps('published')
    return
  }
  ElMessage.success('已切换到草稿列表，请点击卡片继续编辑')
}

async function loadGuideMaps(mode = 'published') {
  currentMode.value = mode
  loading.value = true
  try {
    const data = mode === 'draft'
      ? await fetchGuideRouteDraftCards()
      : await fetchGuideRouteCards()
    guideMapsRaw.value = (data || []).map(item => {
      let coverUrl = ''
      if (item.coverImage) {
        if (item.coverImage.startsWith('http')) {
          coverUrl = item.coverImage
        } else {
          coverUrl = `/images/${item.coverImage}`
        }
      }
      return {
        id: item.id,
        name: item.name,
        nodeCount: item.pointCount || 0,
        createTime: item.createTime || '',
        coverUrl
      }
    })
  } catch (error) {
    ElMessage.error(error.message || '加载向导图库失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadGuideMaps()
})
</script>

<style scoped>
.guide-map-gallery {
  padding: 20px;
  background-color: #fff;
  min-height: 100%;
}

.search-bar {
  margin-bottom: 24px;
  display: flex;
  justify-content: flex-start;
  gap: 16px;
}

.search-input {
  width: 300px;
}

/* 隐藏上面的 el-row 实现，使用下面的 Grid 实现更精准的 5 列 */
.el-row {
  display: none; 
}

.grid-layout {
  display: grid;
  grid-template-columns: repeat(5, 1fr); /* 强制5列 */
  gap: 20px;
}

.gallery-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #fff;
}

.gallery-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-cover {
  height: 160px;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-image {
  width: 100%;
  height: 100%;
  display: block;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #909399;
  font-size: 24px;
}

.card-info {
  padding: 12px;
}

.map-name {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.map-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

/* 响应式适配：屏幕较小时自动调整列数 */
@media screen and (max-width: 1400px) {
  .grid-layout {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media screen and (max-width: 1100px) {
  .grid-layout {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
