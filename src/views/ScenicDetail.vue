<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { fetchAdminAttractionById as fetchAttractionById } from '@/api'
import { processImageData } from '@/utils/imageUtils.js'

// 景点详情数据
const route = useRoute()
const router = useRouter()
const scenic = ref(null)
const loading = ref(true)

/**
 * 加载景点详情数据（按路由参数 id）
 */
async function loadDetail() {
  const id = route.params.id
  if (!id) {
    showToast('无效的景点ID')
    loading.value = false
    return
  }
  try {
    loading.value = true
    const data = await fetchAttractionById(id)
    scenic.value = data
  } catch (e) {
    showToast('获取景点详情失败')
  } finally {
    loading.value = false
  }
}

/**
 * 解析图片/封面为可用URL（使用 /images 前缀）
 * @returns {{coverUrl:string,imageUrls:string[]}}
 */
const imageView = computed(() => {
  return processImageData({
    coverImage: scenic.value?.coverImage || '',
    images: scenic.value?.images || '[]'
  })
})

/**
 * 将票价格式化为友好字符串
 * @param {number|string} price
 * @returns {string}
 */
function formatPrice(price) {
  const n = Number(price || 0)
  return n > 0 ? `¥ ${n.toFixed(2)}` : '免费'
}

/**
 * 拨打联系电话
 */
function callPhone() {
  const tel = scenic.value?.contactPhone
  if (!tel) return showToast('无联系电话')
  location.href = `tel:${tel}`
}

/**
 * 打开地图（基于经纬度）
 */
function openMap() {
  const lat = scenic.value?.latitude
  const lng = scenic.value?.longitude
  if (!lat || !lng) return showToast('暂无地理位置')
  const url = `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(scenic.value?.name || '景点')}`
  window.open(url, '_blank')
}

onMounted(loadDetail)
</script>

<template>
  <div class="scenic-detail" v-loading="loading">
    <!-- 顶部封面与基本信息 -->
    <div class="cover" :style="{ backgroundImage: imageView.coverUrl ? `url(${imageView.coverUrl})` : 'none' }">
      <van-nav-bar left-text="返回" left-arrow @click-left="router.back()" />
      <div class="hero-card">
        <div class="hero-title">{{ scenic?.name || '景点' }}</div>
        <div class="hero-sub">{{ scenic?.location || '未知位置' }}</div>
        <div class="hero-tags">
          <van-tag type="primary" plain>开放时间 {{ scenic?.openHours || '未知' }}</van-tag>
          <van-tag type="warning" plain>票价 {{ formatPrice(scenic?.ticketPrice) }}</van-tag>
        </div>
      </div>
    </div>

    <!-- 内容卡片 -->
    <div class="content-card">
      <div class="intro">
        <div class="intro-title">景点简介</div>
        <div class="intro-text">{{ scenic?.description || '暂无简介' }}</div>
      </div>

      <van-cell-group inset>
        <van-cell title="地理位置" :value="scenic?.location || '未知'" @click="openMap" is-link />
        <van-cell title="开放时间" :value="scenic?.openHours || '未知'" />
        <van-cell title="门票价格" :value="formatPrice(scenic?.ticketPrice)" />
        <van-cell title="联系电话" :value="scenic?.contactPhone || '暂无'" @click="callPhone" is-link />
      </van-cell-group>

      <!-- 图集轮播 -->
      <div v-if="imageView.imageUrls.length" class="gallery">
        <van-swipe :autoplay="3000" lazy-render :show-indicators="true" class="gallery-swipe">
          <van-swipe-item v-for="(img, idx) in imageView.imageUrls" :key="idx">
            <img class="gallery-img" :src="img" alt="image" />
          </van-swipe-item>
        </van-swipe>
      </div>

      <!-- 底部操作 -->
      <div class="actions">
        <van-button type="primary" round block @click="openMap">导航到此</van-button>
        <van-button type="success" round block plain @click="callPhone">咨询电话</van-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scenic-detail { background: #f5f6f7; min-height: 100vh; }
.cover { position: relative; height: 240px; background: #eaeef3; background-size: cover; background-position: center; }
.hero-card { position: absolute; left: 12px; right: 12px; bottom: -36px; background: #fff; border-radius: 18px; box-shadow: 0 10px 24px rgba(0,0,0,0.10); padding: 12px 14px; }
.hero-title { font-weight: 800; font-size: 18px; color: #143a72; }
.hero-sub { color: #607d8b; font-size: 13px; margin-top: 4px; }
.hero-tags { display: flex; gap: 8px; margin-top: 8px; }

.content-card { margin: 48px 12px 16px; background: #fff; border-radius: 14px; box-shadow: 0 6px 16px rgba(0,0,0,0.06); overflow: hidden; }
.intro { padding: 14px; }
.intro-title { font-weight: 700; font-size: 16px; }
.intro-text { color: #555; font-size: 13px; line-height: 1.6; margin-top: 6px; }

.gallery { margin: 12px; border-radius: 12px; overflow: hidden; }
.gallery-swipe { height: 180px; border-radius: 12px; }
.gallery-img { width: 100%; height: 100%; object-fit: cover; }

.actions { display: grid; gap: 10px; padding: 12px; }
</style>