<template>
  <!-- 仪表盘示例：保持原统计卡片内容，不改动间距，仅继承全局圆角与配色 -->
  <div class="panel">
    <el-card header="统计总览">
      <div class="stats">
        <el-statistic title="今日访问" :value="1268" />
        <el-statistic title="新增用户" :value="58" />
        <el-statistic title="订单数量" :value="132" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
// 仪表盘页面（子路由）
</script>

<style scoped>
/* 保持原布局风格 */
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
</style>
