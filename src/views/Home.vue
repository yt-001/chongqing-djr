<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { showToast } from 'vant'

// 当前激活的拼接页面索引
const active = ref(0)

// 观测器实例
let observer = null

/**
 * 初始化页面可见性观测：控制出场动画与激活索引
 */
function initObserver() {
  const sections = document.querySelectorAll('.snap-section')
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target
      const idx = Number(el.getAttribute('data-index'))
      if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
        el.classList.add('visible')
        active.value = idx
      }
    })
  }, { threshold: [0.2, 0.6, 0.9] })
  sections.forEach((el) => observer.observe(el))
}

/**
 * 滑动到下一个拼接页面
 */
function scrollNext() {
  const wrap = document.querySelector('.snap-wrap')
  const next = Math.min(active.value + 1, 4)
  const nextEl = document.querySelector(`.snap-section[data-index="${next}"]`)
  nextEl && wrap?.scrollTo({ top: nextEl.offsetTop, behavior: 'smooth' })
}

/**
 * CTA 点击事件：预留交互
 */
function onCTA(name) {
  showToast({ message: `${name} 开发中`, position: 'top' })
}

onMounted(() => {
  initObserver()
})

onBeforeUnmount(() => {
  observer && observer.disconnect()
})
</script>

<template>
  <div class="snap-wrap">
    <!-- 页 1：重庆夜景英雄横幅 -->
    <section class="snap-section page-hero" data-index="0">
      <div class="hero-inner">
        <h1 class="title">重庆 · 山城夜景</h1>
        <p class="sub">两江交汇 · 立体交通 · 火锅之都</p>
        <div class="cta">
          <van-button type="primary" round @click="onCTA('立即探索')">立即探索</van-button>
          <van-button round plain type="success" @click="scrollNext">下滑下一页</van-button>
        </div>
      </div>
    </section>

    <!-- 页 2：热门景点拼接 -->
    <section class="snap-section page-scenic" data-index="1">
      <div class="header">
        <h2 class="title">热门景点</h2>
        <p class="sub">洪崖洞 · 长江索道 · 磁器口 · 南山一棵树</p>
      </div>
      <van-grid column-num="2" gutter="12" class="cards">
        <van-grid-item>
          <div class="card"><div class="icon">🏮</div><div class="name">洪崖洞</div><div class="desc">夜景与美食集市</div></div>
        </van-grid-item>
        <van-grid-item>
          <div class="card"><div class="icon">🚡</div><div class="name">长江索道</div><div class="desc">空中穿越两岸</div></div>
        </van-grid-item>
        <van-grid-item>
          <div class="card"><div class="icon">🏘️</div><div class="name">磁器口</div><div class="desc">古镇与市井风情</div></div>
        </van-grid-item>
        <van-grid-item>
          <div class="card"><div class="icon">🌲</div><div class="name">南山一棵树</div><div class="desc">俯瞰城市夜景</div></div>
        </van-grid-item>
      </van-grid>
    </section>

    <!-- 页 3：美食拼接 -->
    <section class="snap-section page-food" data-index="2">
      <div class="header">
        <h2 class="title">重庆味道</h2>
        <p class="sub">火锅 · 小面 · 甜水面 · 串串</p>
      </div>
      <van-cell-group inset class="menu">
        <van-cell title="重庆火锅" label="九宫格 · 牛油锅" icon="fire">
          <template #value><van-tag type="danger" plain size="small">人气</van-tag></template>
        </van-cell>
        <van-cell title="重庆小面" label="麻辣鲜香 · 极速出餐" icon="like">
          <template #value><van-tag type="warning" plain size="small">必吃</van-tag></template>
        </van-cell>
        <van-cell title="麻辣串串" label="烟火气 · 深夜食堂" icon="smile">
          <template #value><van-tag type="primary" plain size="small">夜市</van-tag></template>
        </van-cell>
      </van-cell-group>
    </section>

    <!-- 页 4：交通与玩法 -->
    <section class="snap-section page-play" data-index="3">
      <div class="header">
        <h2 class="title">立体交通 · 城市玩法</h2>
        <p class="sub">轻轨穿楼 · 山城步行 · 两江夜游</p>
      </div>
      <van-grid column-num="3" gutter="8" class="features">
        <van-grid-item>
          <div class="feat"><span class="icon">🚈</span><span class="text">李子坝穿楼</span></div>
        </van-grid-item>
        <van-grid-item>
          <div class="feat"><span class="icon">🚶</span><span class="text">山城步行</span></div>
        </van-grid-item>
        <van-grid-item>
          <div class="feat"><span class="icon">⛴️</span><span class="text">两江夜游</span></div>
        </van-grid-item>
      </van-grid>
    </section>

    <!-- 页 5：行动召唤 -->
    <section class="snap-section page-cta" data-index="4">
      <div class="header">
        <h2 class="title">开始你的重庆之旅</h2>
        <p class="sub">精选路线 · 人气美食 · 必打卡清单</p>
      </div>
      <div class="actions">
        <van-button type="primary" round @click="onCTA('预约两江夜游')">预约两江夜游</van-button>
        <van-button type="warning" round plain @click="onCTA('获取美食推荐')">获取美食推荐</van-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 滚动拼接：整屏吸附 */
.snap-wrap { position: relative; height: 100vh; overflow-y: auto; scroll-snap-type: y mandatory; background: url('/home-bg.png') center/cover no-repeat; -ms-overflow-style: none; scrollbar-width: none; overscroll-behavior-y: contain; }
.snap-wrap::before { content: ''; position: fixed; inset: 0; background: rgba(255,255,255,0.3); pointer-events: none; z-index: 0; }
.snap-wrap::-webkit-scrollbar { width: 0; height: 0; display: none; }
.snap-section { position: relative; z-index: 1; scroll-snap-align: start; height: 100vh; display: grid; place-items: center; padding: 16px; }

/* 出场动画通用：初始状态 */
.snap-section .title, .snap-section .sub, .snap-section .card, .snap-section .dish, .snap-section .feat, .hero-inner, .art {
  opacity: 0; transform: translateY(12px);
}
.snap-section.visible .title { animation: fadeUp .6s ease .05s forwards; }
.snap-section.visible .sub { animation: fadeUp .6s ease .15s forwards; }
.snap-section.visible .card { animation: zoomIn .5s ease forwards; }
.snap-section.visible .dish { animation: slideIn .5s ease forwards; }
.snap-section.visible .feat { animation: slideIn .5s ease forwards; }
.snap-section.visible .hero-inner { animation: fadeUp .6s ease .05s forwards; }
.snap-section.visible .art { animation: rise .7s ease .1s forwards; }

@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes zoomIn { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: scale(1); } }
@keyframes slideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
@keyframes rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

/* 页 1：夜景英雄横幅 */
.page-hero { position: relative; display: grid; grid-template-columns: 1fr; align-items: center; }
.hero-inner { display: grid; gap: 10px; }
.hero-inner .title { font-weight: 800; font-size: 30px; letter-spacing: 1.2px; font-family: 'KaiTi','STKaiti','Noto Serif SC', serif; background: linear-gradient(90deg, #143a72, #1e88e5); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.hero-inner .sub { color: #284e7a; font-size: 16px; font-family: 'KaiTi','STKaiti','Noto Serif SC', serif; }
.cta { display: flex; gap: 8px; }
@keyframes bgSlide { from { opacity: 0; } to { opacity: 1; } }

/* 页 2：热门景点 */
.page-scenic { background: transparent; }
.page-scenic .header { text-align: center; margin-bottom: 10px; }
.page-scenic .title { font-weight: 700; font-size: 20px; color: #1565C0; }
.page-scenic .sub { color: #607d8b; }
.cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; width: 100%; max-width: 640px; }
.card { background: rgba(247,251,255,0.92); border: 1px solid #e6f0fb; border-radius: 12px; padding: 12px; display: grid; gap: 6px; place-items: center; }
.card .icon { font-size: 24px; }
.card .name { font-weight: 700; font-size: 16px; }
.card .desc { color: #607d8b; font-size: 13px; }

/* 页 3：美食 */
.page-food { background: transparent; }
.page-food .header { text-align: center; margin-bottom: 10px; }
.page-food .title { font-weight: 700; color: #b71c1c; }
.menu { display: grid; gap: 10px; width: 100%; max-width: 520px; }
.dish { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.94); border-radius: 12px; padding: 12px; box-shadow: 0 8px 20px rgba(183,28,28,0.08); }
.dish .icon { font-size: 22px; }
.dish.hotpot { border: 1px solid #ffcdd2; }
.dish.noodle { border: 1px solid #ffe082; }
.dish.skewer { border: 1px solid #ffab91; }

/* 页 4：玩法 */
.page-play { background: transparent; }
.features { display: grid; gap: 10px; width: 100%; max-width: 520px; }
.feat { display: flex; align-items: center; gap: 10px; background: #f7fbff; border: 1px solid #e6f0fb; border-radius: 12px; padding: 12px; }
.feat .icon { font-size: 22px; }

/* 页 5：CTA */
.page-cta { background: transparent; }
.page-cta .header { text-align: center; margin-bottom: 10px; }
.page-cta .title { font-weight: 800; color: #0D47A1; }
.actions { display: flex; gap: 12px; justify-content: center; }

/* 移动端适配 */
@media (max-width: 420px) {
  .page-hero { grid-template-columns: 1fr; }
}
</style>
.menu :deep(.van-cell) { border-radius: 12px; }
.menu :deep(.van-cell__title) { font-size: 16px; font-weight: 700; }
.menu :deep(.van-cell__label) { font-size: 13px; }
