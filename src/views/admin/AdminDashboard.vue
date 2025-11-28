<template>
  <div class="dashboard-page">
    <!-- 顶部欢迎语 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="greeting">早安，管理员</h2>
        <p class="subtitle">重庆文旅数据监控中心 · 实时概览</p>
      </div>
      <div class="header-right">
        <el-tag type="success" effect="dark" round>今日运营正常</el-tag>
        <span class="date">{{ currentDate }}</span>
      </div>
    </div>

    <!-- 核心指标卡片 -->
    <el-row :gutter="20" class="kpi-row">
      <el-col :xs="24" :sm="12" :md="6" v-for="(kpi, index) in kpiData" :key="index">
        <el-card shadow="hover" class="kpi-card">
          <div class="kpi-content">
            <div class="kpi-icon" :style="{ background: kpi.bgColor, color: kpi.color }">
              <component :is="kpi.icon" />
            </div>
            <div class="kpi-info">
              <div class="label">{{ kpi.label }}</div>
              <div class="value">
                <span class="num">{{ kpi.value }}</span>
                <span class="unit" v-if="kpi.unit">{{ kpi.unit }}</span>
              </div>
              <div class="trend" :class="kpi.trend > 0 ? 'up' : 'down'">
                {{ kpi.trend > 0 ? '+' : '' }}{{ kpi.trend }}%
                <span class="trend-label">较昨日</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主要图表区域 -->
    <el-row :gutter="20" class="main-charts-row">
      <!-- 左侧：营收趋势 -->
      <el-col :xs="24" :lg="16">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="title">年度营收趋势</span>
              <el-radio-group v-model="revenueTimeRange" size="small">
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
                <el-radio-button label="year">全年</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="refTouristLine" class="chart-container large"></div>
        </el-card>
      </el-col>

      <!-- 右侧：游客来源 -->
      <el-col :xs="24" :lg="8">
        <el-card shadow="never" class="chart-card table-card">
          <template #header>
            <div class="card-header">
              <span class="title">游客来源分析</span>
              <el-tabs v-model="activeTab" class="header-tabs">
                <el-tab-pane label="本地" name="local"></el-tab-pane>
                <el-tab-pane label="外地" name="nonlocal"></el-tab-pane>
              </el-tabs>
            </div>
          </template>
          <div class="traffic-list">
            <div class="traffic-header">
              <span>排名</span>
              <span>来源地</span>
              <span class="align-right">访问量</span>
            </div>
            <div class="traffic-item" v-for="(item, idx) in currentTrafficData" :key="item.name">
              <span class="rank" :class="{ 'top-3': idx < 3 }">{{ idx + 1 }}</span>
              <span class="name">{{ item.name }}</span>
              <div class="bar-container">
                <div class="progress-bar" :style="{ width: (item.visits / maxVisits * 100) + '%' }"></div>
              </div>
              <span class="count align-right">{{ formatK(item.visits) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 次要图表区域 -->
    <el-row :gutter="20" class="sub-charts-row">
      <!-- 热门景点 -->
      <el-col :xs="24" :md="8">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <span class="title">热门景点 TOP10</span>
          </template>
          <div ref="refAttractionBar" class="chart-container medium"></div>
        </el-card>
      </el-col>

      <!-- 美食分类 -->
      <el-col :xs="24" :md="8">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <span class="title">美食消费占比</span>
          </template>
          <div ref="refFoodPie" class="chart-container medium"></div>
        </el-card>
      </el-col>

      <!-- 住宿入住率 -->
      <el-col :xs="24" :md="8">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <span class="title">住宿平均入住率</span>
          </template>
          <div ref="refAccommodationGauge" class="chart-container medium"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { Money, User, TrendCharts, Wallet } from '@element-plus/icons-vue'

// --- 状态与数据 ---
const currentDate = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
const revenueTimeRange = ref('year')
const activeTab = ref('local')

// KPI 数据
const kpiData = [
  { label: '今日营收', value: '27.6', unit: '万', trend: 12.6, icon: Money, bgColor: '#ecf5ff', color: '#409eff' },
  { label: '今日访客', value: '3,850', unit: '人', trend: 8.2, icon: User, bgColor: '#f0f9eb', color: '#67c23a' },
  { label: '订单转化', value: '85.2', unit: '%', trend: -2.4, icon: TrendCharts, bgColor: '#fdf6ec', color: '#e6a23c' },
  { label: '平均消费', value: '425', unit: '元', trend: 5.1, icon: Wallet, bgColor: '#fef0f0', color: '#f56c6c' },
]

// 游客来源数据
const localData = [
  { name: '渝中区', visits: 1820 }, { name: '江北区', visits: 1650 }, { name: '南岸区', visits: 1520 },
  { name: '渝北区', visits: 1980 }, { name: '沙坪坝', visits: 1430 }, { name: '九龙坡', visits: 1380 },
  { name: '巴南区', visits: 1270 }, { name: '北碚区', visits: 1160 },
]
const nonlocalData = [
  { name: '四川', visits: 3280 }, { name: '云南', visits: 2140 }, { name: '广东', visits: 1880 },
  { name: '贵州', visits: 1760 }, { name: '湖北', visits: 1690 }, { name: '湖南', visits: 1580 },
  { name: '上海', visits: 1420 }, { name: '北京', visits: 1390 },
]

const currentTrafficData = computed(() => {
  const data = activeTab.value === 'local' ? localData : nonlocalData
  return data.sort((a, b) => b.visits - a.visits)
})

const maxVisits = computed(() => Math.max(...currentTrafficData.value.map(i => i.visits)))

function formatK(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n
}

// --- ECharts 实例与容器 ---
const refTouristLine = ref(null)
const refAttractionBar = ref(null)
const refAccommodationGauge = ref(null)
const refFoodPie = ref(null)

let chartLine = null
let chartBar = null
let chartGauge = null
let chartPie = null

// --- ECharts 初始化函数 ---

/**
 * 初始化营收趋势折线图（现代化风格）
 */
function initTouristLine() {
  if (!refTouristLine.value) return
  chartLine = echarts.init(refTouristLine.value)
  
  const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
  const values = [320, 380, 420, 510, 560, 820, 1260, 1380, 1150, 980, 860, 940]
  
  chartLine.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#eee',
      borderWidth: 1,
      textStyle: { color: '#333' },
      formatter: (params) => {
        return `<div style="margin-bottom: 4px; font-weight: bold">${params[0].name}</div>
                <div style="display: flex; align-items: center">
                  <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${params[0].color}"></span>
                  ${params[0].seriesName}: <span style="font-weight: bold; margin-left: 4px">¥${params[0].value}万</span>
                </div>`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: months,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#909399' }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: '#eee' } },
      axisLabel: { color: '#909399' }
    },
    series: [{
      name: '总营收',
      type: 'line',
      smooth: true,
      symbol: 'none', // 默认不显示点，hover时显示
      lineStyle: { width: 3, color: '#409EFF' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.02)' }
        ])
      },
      data: values
    }]
  })
}

/**
 * 初始化热门景点柱状图
 */
function initAttractionBar() {
  if (!refAttractionBar.value) return
  chartBar = echarts.init(refAttractionBar.value)
  
  const data = [
    { name: '洪崖洞', value: 98 }, { name: '解放碑', value: 95 }, { name: '长江索道', value: 92 },
    { name: '磁器口', value: 90 }, { name: '白公馆', value: 87 }
  ]
  
  chartBar.setOption({
    tooltip: { trigger: 'item' },
    grid: { left: '3%', right: '3%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(i => i.name),
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: '#606266', interval: 0 }
    },
    yAxis: { show: false }, // 隐藏Y轴，更简洁
    series: [{
      type: 'bar',
      barWidth: 24,
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#36D1DC' },
          { offset: 1, color: '#5B86E5' }
        ])
      },
      label: { show: true, position: 'top', color: '#5B86E5' },
      data: data.map(i => i.value)
    }]
  })
}

/**
 * 初始化美食占比饼图（甜甜圈图）
 */
function initFoodPie() {
  if (!refFoodPie.value) return
  chartPie = echarts.init(refFoodPie.value)
  
  chartPie.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%', left: 'center', icon: 'circle', itemWidth: 8, itemHeight: 8 },
    series: [{
      name: '美食分类',
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      labelLine: { show: false },
      data: [
        { value: 38, name: '火锅', itemStyle: { color: '#FF6B6B' } },
        { value: 18, name: '小面', itemStyle: { color: '#FFD93D' } },
        { value: 16, name: '江湖菜', itemStyle: { color: '#4D96FF' } },
        { value: 12, name: '串串', itemStyle: { color: '#6BCB77' } },
        { value: 16, name: '其他', itemStyle: { color: '#A0A0A0' } }
      ]
    }]
  })
}

/**
 * 初始化入住率仪表盘
 */
function initAccommodationGauge() {
  if (!refAccommodationGauge.value) return
  chartGauge = echarts.init(refAccommodationGauge.value)
  
  const percent = 86
  
  chartGauge.setOption({
    series: [{
      type: 'gauge',
      startAngle: 90,
      endAngle: -270,
      pointer: { show: false },
      progress: {
        show: true,
        overlap: false,
        roundCap: true,
        clip: false,
        itemStyle: { color: '#67C23A' }
      },
      axisLine: { lineStyle: { width: 12, color: [[1, '#E6EBF8']] } }, // 背景环
      splitLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      detail: {
        width: 50, height: 14,
        fontSize: 24, color: '#303133',
        formatter: '{value}%',
        offsetCenter: [0, 0]
      },
      data: [{ value: percent }]
    }]
  })
}

// --- 生命周期 ---
function initCharts() {
  initTouristLine()
  initAttractionBar()
  initFoodPie()
  initAccommodationGauge()
}

function handleResize() {
  chartLine?.resize()
  chartBar?.resize()
  chartPie?.resize()
  chartGauge?.resize()
}

onMounted(() => {
  // 延时一点确保DOM渲染
  setTimeout(() => {
    initCharts()
    window.addEventListener('resize', handleResize)
  }, 100)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartLine?.dispose()
  chartBar?.dispose()
  chartPie?.dispose()
  chartGauge?.dispose()
})
</script>

<style scoped>
.dashboard-page {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* 顶部 Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}
.greeting {
  font-size: 24px;
  color: #303133;
  margin: 0 0 8px 0;
  font-weight: 600;
}
.subtitle {
  color: #909399;
  margin: 0;
  font-size: 14px;
}
.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.date {
  color: #909399;
  font-size: 13px;
}

/* KPI 卡片 */
.kpi-row { margin-bottom: 20px; }
.kpi-card {
  border: none;
  border-radius: 12px;
  transition: transform 0.2s;
  margin-bottom: 12px; /* 移动端间距 */
}
.kpi-card:hover { transform: translateY(-4px); }
.kpi-content {
  display: flex;
  align-items: center;
  gap: 16px;
}
.kpi-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
.kpi-info { flex: 1; }
.kpi-info .label { color: #909399; font-size: 13px; margin-bottom: 4px; }
.kpi-info .value { font-size: 24px; font-weight: bold; color: #303133; line-height: 1.2; }
.kpi-info .unit { font-size: 12px; margin-left: 4px; font-weight: normal; color: #909399; }
.kpi-info .trend { font-size: 12px; margin-top: 4px; display: flex; align-items: center; gap: 4px; }
.trend.up { color: #67C23A; }
.trend.down { color: #F56C6C; }
.trend-label { color: #C0C4CC; }

/* 通用图表卡片 */
.main-charts-row { margin-bottom: 20px; }
.chart-card {
  border: none;
  border-radius: 12px;
  height: 100%;
  margin-bottom: 20px; /* 移动端适配 */
}
.chart-card :deep(.el-card__header) {
  border-bottom: 1px solid #f0f2f5;
  padding: 16px 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title { font-weight: 600; font-size: 16px; color: #303133; }

/* 图表容器 */
.chart-container { width: 100%; }
.chart-container.large { height: 360px; }
.chart-container.medium { height: 280px; }

/* 游客来源列表 */
.table-card :deep(.el-card__body) { padding: 10px 20px; }
.header-tabs :deep(.el-tabs__nav-wrap::after) { height: 1px; }
.traffic-list { font-size: 13px; }
.traffic-header {
  display: flex;
  color: #909399;
  padding: 10px 0;
  border-bottom: 1px solid #f5f7fa;
}
.traffic-header span { flex: 1; }
.traffic-header .align-right { text-align: right; }
.traffic-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #fcfcfc;
}
.traffic-item:last-child { border-bottom: none; }
.traffic-item .rank {
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  background: #f0f2f5;
  border-radius: 4px;
  color: #909399;
  font-size: 12px;
  margin-right: 12px;
  flex-shrink: 0;
}
.traffic-item .rank.top-3 {
  background: #333;
  color: #fff;
}
.traffic-item .rank.top-3:nth-child(1) { background: #FFD700; } /* 金 */
.traffic-item .name { width: 60px; margin-right: 10px; color: #606266; }
.bar-container { flex: 1; background: #f5f7fa; height: 6px; border-radius: 3px; overflow: hidden; margin-right: 12px; }
.progress-bar { height: 100%; background: #409EFF; border-radius: 3px; }
.traffic-item .count { width: 50px; text-align: right; color: #303133; font-weight: 500; }

/* 移动端适配修正 */
@media (min-width: 992px) {
  .kpi-card, .chart-card { margin-bottom: 0; }
}
</style>
