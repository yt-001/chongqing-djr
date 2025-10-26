<script setup>
// 首页示例
</script>

<template>
  <div class="page">
    <div class="hero">
      <h1>移动端首页</h1>
      <p>这是一个使用 Vue3 + Element Plus 的移动端页面示例。</p>
    </div>

    <div class="section">
      <van-button type="primary" round>主要按钮</van-button>
      <van-button type="success" plain round>成功</van-button>
      <van-button type="warning" plain round>警告</van-button>
    </div>

    <van-cell-group inset>
      <van-cell title="卡片内容" value="通过 px-to-viewport 自适应" />
    </van-cell-group>
  </div>
</template>

<style scoped>
.page { padding: 16px; }
.hero { text-align: center; padding: 24px 0; }
.logo { width: 80px; height: 80px; }
.section { display: flex; gap: 12px; justify-content: center; margin: 16px 0; }
.card { margin-top: 16px; }
</style>
