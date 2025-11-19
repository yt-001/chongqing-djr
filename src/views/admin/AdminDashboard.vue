<template>
  <div class="dashboard-page">
    <div class="grid">
      <!-- 顶部欢迎横幅（占两列） -->
      <el-card class="item hero" shadow="never">
        <div class="hero-banner">
          <div class="hero-content">
            <div class="text">
              <div class="title">欢迎来到重庆文旅·管理端</div>
              <div class="sub">游客同比增长 28.4%，请查看最新徽章</div>
              <div class="chips">
                <span class="chip" v-for="t in heroTags" :key="t">{{ t }}</span>
              </div>
              <el-button type="primary" size="small" @click="goBadges">查看徽章</el-button>
            </div>
            <div class="art" aria-hidden="true">
              <svg viewBox="0 0 160 110" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#A5D8FF"/>
                    <stop offset="100%" stop-color="#1976D2"/>
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#E3F2FD"/>
                    <stop offset="100%" stop-color="#B3E5FC"/>
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="160" height="110" rx="12" fill="url(#g2)" />
                <!-- 山体 -->
                <path d="M10 80 L40 40 L70 78 L90 50 L120 82 L150 70 L160 110 L0 110 Z" fill="url(#g1)" opacity="0.9"/>
                <!-- 两江波形 -->
                <path d="M0 88 C30 96 60 92 90 96 C120 100 140 98 160 102 L160 110 L0 110 Z" fill="#64B5F6" opacity="0.8"/>
                <!-- 索道车厢 -->
                <line x1="30" y1="22" x2="120" y2="36" stroke="#1976D2" stroke-width="2"/>
                <rect x="62" y="30" width="18" height="12" rx="2" fill="#2196F3" stroke="#0D47A1" stroke-width="1"/>
                <rect x="65" y="33" width="12" height="8" rx="1" fill="#E3F2FD"/>
              </svg>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 今日订单（右侧小卡） -->
      <el-card class="item order" header="今日订单" shadow="never">
        <div class="card-kpi">
          <div class="value">276k</div>
          <div class="trend up">+12.6%</div>
        </div>
        <div ref="refMiniSales" class="mini-chart"></div>
      </el-card>

      <!-- 营收趋势（占两列） -->
      <el-card class="item total" header="营收近12个月趋势" shadow="never">
        <div ref="refTouristLine" class="chart"></div>
      </el-card>

      <!-- 游客来源分析（右下，含标签页） -->
      <el-card class="item traffic" header="游客来源分析" shadow="never">
        <el-tabs v-model="activeTab" class="traffic-tabs">
          <el-tab-pane label="本地" name="local">
            <div class="traffic-table">
              <div class="tr head">
                <div class="td no">NO</div>
                <div class="td name">区名</div>
                <div class="td visits">人数</div>
              </div>
              <div class="tr" v-for="(item, idx) in localData" :key="item.name">
                <div class="td no">{{ idx + 1 }}</div>
                <div class="td name">{{ item.name }}</div>
                <div class="td visits">{{ formatK(item.visits) }}</div>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="外地" name="nonlocal">
            <div class="traffic-table">
              <div class="tr head">
                <div class="td no">NO</div>
                <div class="td name">省名</div>
                <div class="td visits">人数</div>
              </div>
              <div class="tr" v-for="(item, idx) in nonlocalData" :key="item.name">
                <div class="td no">{{ idx + 1 }}</div>
                <div class="td name">{{ item.name }}</div>
                <div class="td visits">{{ formatK(item.visits) }}</div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>

      <!-- 热门景点TOP10（占两列） -->
      <el-card class="item bar" header="热门景点TOP10" shadow="never">
        <div ref="refAttractionBar" class="chart"></div>
      </el-card>

      <!-- 周营收（右侧小卡） -->
      <el-card class="item revenue" header="周营收" shadow="never">
        <div class="card-kpi">
          <div class="value">425k</div>
          <div class="trend up">+8.2%</div>
        </div>
        <div ref="refMiniRevenue" class="mini-chart"></div>
      </el-card>

      <!-- 美食分类占比（左下） -->
      <el-card class="item food" header="美食分类占比" shadow="never">
        <div ref="refFoodPie" class="chart"></div>
      </el-card>

      <!-- 支付概览（中下） -->
      <el-card class="item payments" header="支付概览" shadow="never">
        <div class="card-kpi col">
          <div class="value">$ 2,456</div>
          <div class="trend down">-14.82%</div>
        </div>
        <div class="muted">最近7天成功率 99.2%</div>
      </el-card>

      <!-- 入住率仪表盘（右侧） -->
      <el-card class="item gauge" header="住宿平均入住率" shadow="never">
        <div ref="refAccommodationGauge" class="chart"></div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

// 图表容器
const refTouristLine = ref(null)
const refAttractionBar = ref(null)
const refAccommodationGauge = ref(null)
const refFoodPie = ref(null)
const refMiniSales = ref(null)
const refMiniRevenue = ref(null)
const activeTab = ref('local')

// 实例句柄
let chartLine = null
let chartBar = null
let chartGauge = null
let chartPie = null
let chartMiniSales = null
let chartMiniRevenue = null

// 主题配色（蓝色渐变系，参考提供的配色建议）
const palette = ['#E3F2FD','#BBDEFB','#90CAF9','#64B5F6','#42A5F5','#2196F3','#1E88E5','#1976D2','#1565C0','#0D47A1']
const primary = '#1976D2'
const accent = '#67C23A'
const warn = '#F56C6C'
const info = '#909399'

/**
 * 初始化游客趋势折线图
 */
function initTouristLine() {
  if (!refTouristLine.value) return
  chartLine = echarts.init(refTouristLine.value)
  const months = ['01','02','03','04','05','06','07','08','09','10','11','12']
  const values = [320, 380, 420, 510, 560, 820, 1260, 1380, 1150, 980, 860, 940]
  chartLine.setOption({
    tooltip: { trigger: 'axis', valueFormatter: (v) => `¥ ${Number(v).toLocaleString()} 万` },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: months },
    yAxis: { type: 'value', axisLabel: { formatter: '{value} 万' } },
    series: [{
      name: '营收(万元)', type: 'line', smooth: true,
      areaStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{ offset:0, color: palette[4] },{ offset:1, color: palette[1] }]) },
      data: values,
      color: primary
    }]
  })
}

/**
 * 初始化景点热度柱状图
 */
function initAttractionBar() {
  if (!refAttractionBar.value) return
  chartBar = echarts.init(refAttractionBar.value)
  const names = ['洪崖洞','解放碑','长江索道','磁器口','白公馆','南山一棵树','大足石刻','仙女山','武隆天生三桥','三峡博物馆']
  const hot = [98,95,92,90,87,85,82,79,76,72]
  chartBar.setOption({
    tooltip: { trigger: 'item' },
    grid: { left: 60, right: 20, top: 20, bottom: 50 },
    xAxis: { type: 'category', data: names, axisLabel: { interval: 0, rotate: 20 } },
    yAxis: { type: 'value', name: '热度指数' },
    series: [{ type: 'bar', data: hot, itemStyle: { color: palette[5], borderRadius: [6,6,0,0] } }]
  })
}

/**
 * 初始化住宿入住率仪表盘
 */
function initAccommodationGauge() {
  if (!refAccommodationGauge.value) return
  chartGauge = echarts.init(refAccommodationGauge.value)
  const percent = 86
  chartGauge.setOption({
    tooltip: { trigger: 'item', formatter: ({ value }) => `入住率：${value}%` },
    series: [{
      name: '入住率', type: 'pie', radius: ['70%','90%'], avoidLabelOverlap: true,
      label: { show: true, position: 'center', formatter: `${percent}%`, fontSize: 18, fontWeight: 'bold', color: primary },
      data: [
        { value: percent, name: 'occupied', itemStyle: { color: palette[6] } },
        { value: 100 - percent, name: 'free', itemStyle: { color: '#EEF2F7' } },
      ]
    }],
    graphic: [
      { type: 'text', left: 'center', top: '60%', style: { text: '平均', fill: '#606266', fontSize: 14 } }
    ]
  })
}

/**
 * 初始化美食分类占比饼图
 */
function initFoodPie() {
  if (!refFoodPie.value) return
  chartPie = echarts.init(refFoodPie.value)
  const data = [
    { name: '火锅', value: 38 },
    { name: '小面', value: 18 },
    { name: '串串', value: 12 },
    { name: '江湖菜', value: 16 },
    { name: '甜品', value: 8 },
    { name: '其他', value: 8 },
  ]
  chartPie.setOption({
    tooltip: { trigger: 'item' },
    legend: { orient: 'horizontal', bottom: 0 },
    series: [{
      type: 'pie', radius: '60%',
      data, label: { formatter: '{b}: {d}%' },
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.3)' } }
    }],
    color: [palette[5], palette[6], palette[7], palette[4], palette[2], palette[8]]
  })
}

/**
 * 初始化右侧小卡：今日订单走势（迷你折线）
 */
function initMiniSalesLine() {
  if (!refMiniSales.value) return
  chartMiniSales = echarts.init(refMiniSales.value)
  chartMiniSales.setOption({
    grid: { left: 10, right: 10, top: 10, bottom: 10 },
    xAxis: { type: 'category', show: false, data: Array.from({length: 16}, (_, i) => i + 1) },
    yAxis: { type: 'value', show: false },
    series: [{ type: 'line', smooth: true, data: [8,9,12,14,16,18,17,16,14,15,17,19,21,23,22,24], areaStyle: { color: palette[2] }, color: primary }]
  })
}

/**
 * 初始化右侧小卡：周营收（迷你柱状）
 */
function initMiniRevenueBar() {
  if (!refMiniRevenue.value) return
  chartMiniRevenue = echarts.init(refMiniRevenue.value)
  chartMiniRevenue.setOption({
    grid: { left: 10, right: 10, top: 10, bottom: 10 },
    xAxis: { type: 'category', show: false, data: ['M','T','W','T','F','S','S'] },
    yAxis: { type: 'value', show: false },
    series: [{ type: 'bar', data: [12, 18, 16, 20, 22, 26, 19], itemStyle: { color: palette[6], borderRadius: 6 }, barWidth: 10 }]
  })
}

/**
 * 将数值转换为 k 记法
 * @param {number} n
 * @returns {string}
 */
function formatK(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(2)}k`
  return String(n)
}

/**
 * 获取进度条样式
 * @param {number} percent
 * @param {string} color
 * @returns {object}
 */
function getBarStyle(percent, color) {
  return { width: `${percent}%`, background: color }
}

// 游客来源：本地（重庆区县）/ 外地（省份）
const localData = ref([
  { name: '渝中区', visits: 1820 },
  { name: '江北区', visits: 1650 },
  { name: '南岸区', visits: 1520 },
  { name: '渝北区', visits: 1980 },
  { name: '沙坪坝区', visits: 1430 },
  { name: '九龙坡区', visits: 1380 },
  { name: '巴南区', visits: 1270 },
  { name: '北碚区', visits: 1160 },
  { name: '大渡口区', visits: 980 },
  { name: '两江新区', visits: 1320 },
])

const nonlocalData = ref([
  { name: '四川', visits: 3280 },
  { name: '云南', visits: 2140 },
  { name: '广东', visits: 1880 },
  { name: '贵州', visits: 1760 },
  { name: '湖北', visits: 1690 },
  { name: '湖南', visits: 1580 },
  { name: '上海', visits: 1420 },
  { name: '北京', visits: 1390 },
  { name: '陕西', visits: 1210 },
  { name: '其他省份', visits: 4200 },
])

/**
 * 初始化全部图表并绑定自适应
 */
function initCharts() {
  initTouristLine()
  initAttractionBar()
  initAccommodationGauge()
  initFoodPie()
  initMiniSalesLine()
  initMiniRevenueBar()
}

function handleResize() {
  chartLine && chartLine.resize()
  chartBar && chartBar.resize()
  chartGauge && chartGauge.resize()
  chartPie && chartPie.resize()
  chartMiniSales && chartMiniSales.resize()
  chartMiniRevenue && chartMiniRevenue.resize()
}

onMounted(() => {
  initCharts()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartLine && chartLine.dispose()
  chartBar && chartBar.dispose()
  chartGauge && chartGauge.dispose()
  chartPie && chartPie.dispose()
  chartMiniSales && chartMiniSales.dispose()
  chartMiniRevenue && chartMiniRevenue.dispose()
})
</script>

<style scoped>
.dashboard-page { padding: 8px; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }

.item.hero { grid-column: 1 / span 2; }
.item.order { grid-column: 3; }
.item.total { grid-column: 1 / span 2; }
.item.gauge { grid-column: 3; }
.item.bar { grid-column: 1 / span 2; }
.item.revenue { grid-column: 3; }
.item.food { grid-column: 1; }
.item.payments { grid-column: 2; }
.item.traffic { grid-column: 3; }

.item.hero :deep(.el-card__body) { height: 100%; padding: 0; }
.hero-banner { position: relative; border-radius: 16px; padding: 18px; background:
  radial-gradient(1200px 1200px at -10% 10%, rgba(227,242,253,0.9) 0%, rgba(227,242,253,0) 40%),
  radial-gradient(800px 800px at 110% 10%, rgba(187,222,251,0.8) 0%, rgba(187,222,251,0) 42%),
  linear-gradient(135deg, #eef5ff 0%, #ffffff 45%, #eaf7ff 100%);
  border: 1px solid #e6f0fb; overflow: hidden; height: 100%; min-height: 220px; }
.hero-content { display: flex; align-items: stretch; justify-content: space-between; height: 100%; }
.hero-content .text { display: grid; gap: 10px; align-content: center; }
.hero-content .title { font-weight: 800; color: #0D47A1; font-size: clamp(18px, 1.6vw, 26px); }
.hero-content .sub { color: #5b75a1; font-size: clamp(13px, 1.0vw, 16px); }
.chips { display: flex; gap: 8px; flex-wrap: wrap; }
.chip { background: #E3F2FD; color: #1976D2; padding: 6px 10px; border-radius: 999px; font-size: 12px; box-shadow: 0 4px 12px rgba(25,118,210,0.12); }
.art { width: 320px; height: 100%; border-radius: 14px; box-shadow: 0 10px 24px rgba(25,118,210,0.12); overflow: hidden; }
.art svg { display: block; width: 100%; height: 100%; }

@media (max-width: 1200px) {
  .item.hero :deep(.el-card__body) { height: auto; }
  .art { width: 200px; height: 140px; }
}

.card-kpi { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 6px; }
.card-kpi.col { flex-direction: column; align-items: flex-start; gap: 6px; }
.card-kpi .value { font-weight: 700; font-size: 20px; }
.trend { font-size: 12px; }
.trend.up { color: #67C23A; }
.trend.down { color: #F56C6C; }
.muted { color: #909399; font-size: 12px; }

.chart { width: 100%; height: 300px; }
.mini-chart { width: 100%; height: 140px; }

/* 访问来源表格 */
.traffic-tabs { margin-top: 6px; }
.traffic-table { max-height: 300px; overflow-y: auto; padding-right: 4px; }
.traffic-table { display: grid; gap: 8px; }
.traffic-table .tr { display: grid; grid-template-columns: 60px 1fr 120px; align-items: center; gap: 8px; }
.traffic-table .tr.head { color: #909399; font-size: 12px; }
.traffic-table .tr:not(.head) { background: #fff; border-radius: 8px; padding: 6px; box-shadow: 0 6px 14px rgba(0,0,0,0.03); }
.traffic-table .tr:not(.head):hover { box-shadow: 0 8px 20px rgba(25,118,210,0.12); }

@media (max-width: 1200px) {
  .grid { grid-template-columns: 1fr; }
  .item.hero, .item.total, .item.bar { grid-column: 1; }
  .item.order, .item.gauge, .item.revenue, .item.food, .item.payments, .item.traffic { grid-column: 1; }
}
</style>
// 英雄横幅标签
const heroTags = ref(['山城','两江','夜景','火锅'])

/**
 * 点击查看徽章入口
 */
function goBadges() {
  ElMessage.info('徽章中心即将开放，敬请期待')
}
