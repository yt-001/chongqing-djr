<template>
  <!-- 动态侧边栏：支持一级/二级菜单 -->
  <el-menu :default-active="activeMenu" class="el-menu-vertical-demo" @select="onSelect">
    <template v-for="item in menus" :key="item.name || item.label">
      <!-- 无子菜单：直接渲染菜单项 -->
      <el-menu-item v-if="!item.children || item.children.length === 0" :index="item.name">
        <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
        <span>{{ item.label }}</span>
      </el-menu-item>
      <!-- 有子菜单：渲染二级 -->
      <el-sub-menu v-else :index="item.name || item.label">
        <template #title>
          <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </template>
        <el-menu-item v-for="child in item.children" :key="child.name" :index="child.name">
          <el-icon v-if="child.icon"><component :is="child.icon" /></el-icon>
          <span>{{ child.label }}</span>
        </el-menu-item>
      </el-sub-menu>
    </template>
  </el-menu>
</template>

<script setup>
// 侧边栏组件：接收菜单配置与当前激活项，向上传递选择事件
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  menus: { type: Array, required: true },
  activeMenu: { type: String, required: false }
})

const emit = defineEmits(['select'])
const onSelect = (index) => emit('select', index)
</script>

<style scoped>
/* 使用全局主题控制圆角与配色，此处不改动间距 */
</style>
