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
    </div>

    <!-- 图库列表区域 -->
    <div class="gallery-container">
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
import { ref } from 'vue'
import { Search, Picture } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const searchKeyword = ref('')
const defaultCover = 'https://via.placeholder.com/300x200?text=Guide+Map'

// 模拟数据
const guideMaps = ref([
  { id: 1, name: '重庆一日游经典路线', nodeCount: 5, createTime: '2023-12-01', coverUrl: '' },
  { id: 2, name: '洪崖洞周边美食打卡', nodeCount: 8, createTime: '2023-12-05', coverUrl: '' },
  { id: 3, name: '解放碑历史文化游', nodeCount: 4, createTime: '2023-12-10', coverUrl: '' },
  { id: 4, name: '江北嘴夜景最佳观赏点', nodeCount: 3, createTime: '2023-12-12', coverUrl: '' },
  { id: 5, name: '轻轨穿楼体验路线', nodeCount: 6, createTime: '2023-12-15', coverUrl: '' },
  { id: 6, name: '南山一棵树观景路线', nodeCount: 2, createTime: '2023-12-20', coverUrl: '' },
])

const handleSearch = () => {
  ElMessage.success(`正在搜索：${searchKeyword.value}`)
  // TODO: 调用后端接口搜索
}

const viewGuideMap = (item) => {
  ElMessage.info(`查看向导图：${item.name}`)
  // TODO: 跳转详情或打开弹窗
}
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