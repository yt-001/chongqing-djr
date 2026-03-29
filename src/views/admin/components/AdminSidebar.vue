<template>
  <el-menu :default-active="activeMenu" class="el-menu-vertical-demo" @select="onSelect">
    <template v-for="item in menus" :key="item.name || item.label">
      <!-- 无子菜单：直接渲染菜单项 -->
      <el-menu-item v-if="!item.children || item.children.length === 0" :index="item.name">
        <el-icon v-if="resolveIcon(item.icon)"><component :is="resolveIcon(item.icon)" /></el-icon>
        <span>{{ item.label }}</span>
      </el-menu-item>
      <!-- 有子菜单：渲染二级 -->
      <el-sub-menu v-else :index="item.name || item.label">
        <template #title>
          <el-icon v-if="resolveIcon(item.icon)"><component :is="resolveIcon(item.icon)" /></el-icon>
          <span>{{ item.label }}</span>
        </template>
        <el-menu-item v-for="child in item.children" :key="child.name" :index="child.name">
          <el-icon v-if="resolveIcon(child.icon)"><component :is="resolveIcon(child.icon)" /></el-icon>
          <span>{{ child.label }}</span>
        </el-menu-item>
      </el-sub-menu>
    </template>
  </el-menu>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import { Monitor, Location, ForkSpoon, House, Document, User, ChatLineRound, Medal } from '@element-plus/icons-vue'

const props = defineProps({
  menus: { type: Array, required: true },
  activeMenu: { type: String, required: false }
})

const iconMap = {
  Monitor,
  Location,
  ForkSpoon,
  House,
  Document,
  User,
  ChatLineRound,
  Medal,
}

function resolveIcon(iconName) {
  if (!iconName) return null
  return iconMap[iconName] || null
}

const emit = defineEmits(['select'])
const onSelect = (index) => emit('select', index)
</script>

<style scoped>
</style>
