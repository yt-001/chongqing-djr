<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { fetchAccommodationById } from '@/api/modules/accommodations.js'
import { mapFacilitiesToItems } from '@/utils/facilityIcons.js'
import { processImageData } from '@/utils/imageUtils.js'
import { useUserStore } from '@/store/user.js'
import { checkFavoriteAccommodation, addFavoriteAccommodation, removeFavoriteAccommodation } from '@/api/modules/favorites.js'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const detail = ref(null)
const loading = ref(true)
const payVisible = ref(false)
const quantity = ref(1)
const isFav = ref(false)
const favLoading = ref(false)

// 模拟房东信息（如果后端没有返回的话）
const hostInfo = ref({
  name: '梁平导游',
  avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
  tags: ['热情好客', '本地通', '回复超快'],
  message: '欢迎来到我的小屋！这里每一处角落都是我精心布置的，希望您能感受到梁平的热情与温暖。如果有任何游玩问题，随时问我哦！'
})

/**
 * 加载住宿详情（包含设施列表）
 * @returns {Promise<void>}
 */

onMounted(() => {
  loadData()
  checkFavorite()
})

async function checkFavorite() {
  if (!userStore.isLoggedIn) return
  const id = route.params.id
  try {
    const res = await checkFavoriteAccommodation(id)
    isFav.value = !!res.data
  } catch (e) {
    console.error('检查收藏状态失败', e)
  }
}

async function onToggleFavorite() {
  if (!userStore.isLoggedIn) {
    showToast('请先登录')
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  
  if (favLoading.value) return
  favLoading.value = true
  
  const id = route.params.id
  try {
    if (isFav.value) {
      await removeFavoriteAccommodation(id)
      isFav.value = false
      showToast('已取消收藏')
    } else {
      await addFavoriteAccommodation(id)
      isFav.value = true
      showToast('收藏成功')
    }
  } catch (e) {
    showToast(e.message || '操作失败')
  } finally {
    favLoading.value = false
  }
}

async function loadData() {
  const id = route.params.id
  if (!id) return
  
  try {
    loading.value = true
    const res = await fetchAccommodationById(id)
    detail.value = res.data || res
  } catch (e) {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

const images = computed(() => {
  if (!detail.value) return []
  const { imageUrls } = processImageData({
    coverImage: detail.value.coverImage,
    images: detail.value.images
  })
  // 如果没有图片，放一张默认图
  return imageUrls.length ? imageUrls : ['https://img.yzcdn.cn/vant/apple-1.jpg']
})

/**
 * 住宿类型显示（兼容后端字段变化）
 * @returns {string}
 */
const typeText = computed(() => {
  const name = detail.value?.typeName || detail.value?.type?.name || detail.value?.type?.label
  if (name) return name
  const id = detail.value?.typeId ?? detail.value?.type_id
  const map = { 1: '酒店', 2: '民宿', 3: '客栈' }
  return map[id] || '住宿'
})

/**
 * 设施列表（优先使用后端返回的设施数据）
 * @returns {{icon:string,name:string}[]}
 */
const facilityItems = computed(() => {
  const list = detail.value?.facilities || detail.value?.facilityList || []
  return mapFacilitiesToItems(list)
})

/**
 * 拨打电话
 * @param {string} phone
 */
function onCall(phone) {
  if (!phone) return showToast('暂无联系电话')
  window.location.href = `tel:${phone}`
}

// 图标匹配逻辑已抽取到 '@/utils/facilityIcons.js'

function onBack() {
  router.back()
}

function onBook() { payVisible.value = true }

/**
 * 构建订单草稿并跳转到模拟支付页
 * @returns {Promise<void>}
 */
async function onConfirmPay() {
  if (!detail.value) return showToast('缺少房源信息')
  const unit = Number(detail.value.pricePerNight || 0)
  const qty = Math.max(1, Number(quantity.value || 1))
  const total = Number((unit * qty).toFixed(2))
  const draft = {
    productType: 3,
    productId: detail.value.id,
    productName: detail.value.name,
    description: detail.value.description || typeText.value,
    quantity: qty,
    unitPrice: unit,
    totalAmount: total,
    status: 0
  }
  sessionStorage.setItem('orderDraft', JSON.stringify(draft))
  payVisible.value = false
  router.push({ name: 'pay-mock' })
}
</script>

<template>
  <div class="accommodation-detail">
    <!-- 顶部导航栏（常显） -->
    <div class="nav-bar">
      <div class="nav-left" @click="onBack">
        <van-icon name="arrow-left" size="20" color="#333" />
      </div>
      <div class="nav-title">
        {{ detail?.name || '民宿详情' }}
      </div>
      <div class="nav-right" @click="onToggleFavorite">
        <van-icon :name="isFav ? 'star' : 'star-o'" size="20" :color="isFav ? '#ff5000' : '#333'" />
      </div>
    </div>

    <div v-if="loading" class="loading-box">
      <div class="skeleton-wrapper">
        <div class="skeleton-swipe"></div>
        <div class="skeleton-content">
          <van-skeleton title :row="2" />
          <van-skeleton title :row="3" style="margin-top: 16px" />
          <van-skeleton title :row="4" style="margin-top: 16px" />
        </div>
      </div>
    </div>

    <template v-else>
      <!-- 顶部轮播图 -->
      <van-swipe class="detail-swipe" :autoplay="3000" indicator-color="white">
        <van-swipe-item v-for="(img, index) in images" :key="index">
          <img :src="img" alt="room" />
        </van-swipe-item>
      </van-swipe>

      <!-- 内容容器 (上浮圆角) -->
      <div class="content-wrapper">
        <!-- 核心信息卡片 -->
        <div class="card info-card">
          <div class="header">
            <div class="title">{{ detail?.name }}</div>
            <div class="price">
              <span class="symbol">¥</span>
              <span class="num">{{ detail?.pricePerNight }}</span>
              <span class="unit">/晚</span>
            </div>
          </div>
          
          <div class="tags-row">
            <span class="tag type-tag">{{ typeText }}</span>
            <div class="rating" v-if="detail?.rating !== undefined && detail?.rating !== null">
              <van-icon name="star" color="#ff9f43" />
              <span class="score">{{ detail?.rating }}</span>
            </div>
          </div>

          <div class="location-row">
            <van-icon name="location" color="#3f51b5" />
            <span class="address">{{ detail?.location || '重庆市梁平区' }}</span>
            <span class="map-link">地图 ></span>
          </div>
          <div class="meta-row">
            <span class="capacity">宜住{{ detail?.capacity || 2 }}人</span>
            <span class="phone" @click="onCall(detail?.contactPhone)">
              <van-icon name="phone" /> {{ detail?.contactPhone || '暂无电话' }}
            </span>
          </div>
        </div>

        <!-- 房东寄语 (亲民特色) -->
        <div class="card host-card">
          <div class="host-header">
            <img :src="hostInfo.avatar" class="avatar" />
            <div class="host-text">
              <div class="name">{{ hostInfo.name }}</div>
              <div class="host-tags">
                <span v-for="tag in hostInfo.tags" :key="tag">{{ tag }}</span>
              </div>
            </div>
            <van-button round size="small" color="#ff9f43" plain>联系房东</van-button>
          </div>
          <div class="speech-bubble">
            {{ hostInfo.message }}
          </div>
        </div>

        <!-- 设施服务 -->
        <div class="card facilities-card">
          <div class="card-title">设施服务</div>
          <div class="facilities-grid">
            <div class="facility-item" v-for="(item, i) in facilityItems" :key="i">
              <van-icon :name="item.icon" size="24" color="#666" />
              <span>{{ item.name }}</span>
            </div>
          </div>
        </div>

        <!-- 详细介绍 -->
        <div class="card desc-card">
          <div class="card-title">关于此房源</div>
          <div class="desc-content">
            {{ detail?.description || '暂无描述' }}
          </div>
          <div class="time-info" v-if="detail?.createTime">
            <div class="time-item">创建于：{{ detail.createTime }}</div>
            <div class="time-item" v-if="detail.updateTime">最后更新：{{ detail.updateTime }}</div>
          </div>
        </div>
        
        <!-- 占位，防遮挡 -->
        <div style="height: 80px;"></div>
      </div>

      <!-- 底部操作栏 -->
      <van-action-bar>
        <van-action-bar-icon icon="chat-o" text="客服" color="#ee0a24" />
        <van-action-bar-icon :icon="isFav ? 'star' : 'star-o'" text="收藏" :color="isFav ? '#ff5000' : '#333'" @click="onToggleFavorite" />
        <van-action-bar-button type="warning" text="加入行程" />
        <van-action-bar-button type="primary" text="联系前台" @click="onCall(detail?.contactPhone)" />
        <van-action-bar-button type="danger" text="立即预定" @click="onBook" />
      </van-action-bar>
      <van-popup v-model:show="payVisible" round position="bottom">
        <div style="padding:16px 16px 24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div style="font-weight:600;">确认订单</div>
            <van-icon name="cross" @click="payVisible=false" />
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin:12px 0;">
            <div>数量</div>
            <van-stepper v-model="quantity" min="1" />
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin:12px 0;">
            <div>单价</div>
            <div>¥{{ detail?.pricePerNight || 0 }}</div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin:12px 0; font-weight:700;">
            <div>合计</div>
            <div>¥{{ ((Number(detail?.pricePerNight||0))*Math.max(1,Number(quantity||1))).toFixed(2) }}</div>
          </div>
          <van-button block type="primary" round @click="onConfirmPay">去支付</van-button>
        </div>
      </van-popup>
    </template>
  </div>
</template>

<style scoped>
.accommodation-detail {
  min-height: 100vh;
  background-color: #f7f8fa;
  position: relative;
  padding-top: 56px;
}

.loading-box { min-height: calc(100vh - 56px); }
.skeleton-wrapper { width: 100%; }
.skeleton-swipe { height: 220px; background: linear-gradient(90deg, #eaeef3 25%, #f5f6f7 50%, #eaeef3 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite; }
.skeleton-content { padding: 16px; background: #fff; border-radius: 16px 16px 0 0; margin-top: -16px; position: relative; }
@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 100;
  background-color: #fff;
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
}
.nav-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* 轮播图 */
.detail-swipe {
  height: 280px;
}
.detail-swipe img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 内容上浮容器 */
.content-wrapper {
  position: relative;
  top: -20px;
  border-radius: 20px 20px 0 0;
  background-color: #f7f8fa;
  overflow: hidden;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 通用卡片样式 */
.card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

/* 核心信息卡片 */
.info-card .header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}
.info-card .title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  line-height: 1.3;
  flex: 1;
  margin-right: 12px;
}
.info-card .price {
  color: #ff5000;
  flex-shrink: 0;
}
.info-card .symbol {
  font-size: 14px;
}
.info-card .num {
  font-size: 24px;
  font-weight: bold;
}
.info-card .unit {
  font-size: 12px;
  color: #999;
}

.tags-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.type-tag {
  background: #e8f3ff;
  color: #1989fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  margin-right: 10px;
}
.rating {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #666;
}
.rating .score {
  font-weight: bold;
  color: #333;
  margin: 0 4px;
}

.location-row {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #666;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}
.meta-row { display: flex; gap: 16px; margin-top: 8px; align-items: center; }
.meta-row .phone { color: #1890ff; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
.location-row .address {
  flex: 1;
  margin: 0 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.location-row .map-link {
  color: #1989fa;
}

/* 房东卡片 - 亲民感 */
.host-card {
  background: linear-gradient(135deg, #fff9f0 0%, #fff 100%);
  border: 1px solid #ffeace;
}
.host-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.host-header .avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 12px;
  border: 2px solid #fff;
}
.host-text {
  flex: 1;
}
.host-text .name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}
.host-tags span {
  font-size: 10px;
  color: #ff976a;
  background: #fff0e6;
  padding: 1px 4px;
  border-radius: 4px;
  margin-right: 4px;
}
.speech-bubble {
  position: relative;
  background: #fff;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: #555;
  line-height: 1.5;
  font-style: italic;
}
.speech-bubble::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 20px;
  width: 10px;
  height: 10px;
  background: #fff;
  transform: rotate(45deg);
}

/* 设施表格 */
.facilities-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.facility-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 12px;
  color: #666;
  gap: 6px;
}

/* 描述 */
.desc-content {
  font-size: 14px;
  color: #444;
  line-height: 1.6;
  white-space: pre-wrap;
}

.time-info {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed #eee;
  font-size: 12px;
  color: #999;
}
.time-item { margin-bottom: 4px; }

.loading-box {
  display: flex;
  justify-content: center;
  padding-top: 100px;
}
</style>
