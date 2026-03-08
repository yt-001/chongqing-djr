<script setup>
import { onMounted, onUnmounted, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const size = 56
const margin = 12
const bottomReserve = 90

const pos = reactive({ x: 0, y: 0 })
let startX = 0
let startY = 0
let startLeft = 0
let startTop = 0
let dragging = false
let moved = false

const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

const computeBounds = () => {
  const maxX = Math.max(margin, window.innerWidth - size - margin)
  const maxY = Math.max(margin, window.innerHeight - size - bottomReserve)
  return { minX: margin, minY: margin, maxX, maxY }
}

const resetPosition = () => {
  const { minX, minY, maxX, maxY } = computeBounds()
  const targetX = window.innerWidth * 0.68
  const targetY = window.innerHeight - bottomReserve - size - 8
  pos.x = clamp(targetX, minX, maxX)
  pos.y = clamp(targetY, minY, maxY)
}

const onPointerDown = (e) => {
  dragging = true
  moved = false
  startX = e.clientX
  startY = e.clientY
  startLeft = pos.x
  startTop = pos.y
  e.preventDefault()
}

const onPointerMove = (e) => {
  if (!dragging) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true
  const { minX, minY, maxX, maxY } = computeBounds()
  pos.x = clamp(startLeft + dx, minX, maxX)
  pos.y = clamp(startTop + dy, minY, maxY)
}

const onPointerUp = () => {
  if (!dragging) return
  dragging = false
  if (!moved) router.push({ name: 'ai-assistant' })
}

const onResize = () => resetPosition()

onMounted(() => {
  resetPosition()
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="floating-assistant" :style="{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }" @pointerdown="onPointerDown">
    <div class="assistant-ring"></div>
    <div class="assistant-core">
      <svg class="assistant-icon" viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id="aiGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#4f7cff"/>
            <stop offset="100%" stop-color="#6ee7ff"/>
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="24" fill="url(#aiGlow)"/>
        <rect x="18" y="20" width="28" height="20" rx="10" fill="#ffffff" opacity="0.9"/>
        <circle cx="27" cy="30" r="3.2" fill="#4f7cff"/>
        <circle cx="37" cy="30" r="3.2" fill="#4f7cff"/>
        <path d="M24 38c2.6 3 6.3 4.5 8 4.5s5.4-1.5 8-4.5" fill="none" stroke="#4f7cff" stroke-width="2.6" stroke-linecap="round"/>
      </svg>
      <span class="assistant-text">AI</span>
    </div>
  </div>
</template>

<style scoped>
.floating-assistant {
  position: fixed;
  left: 0;
  top: 0;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #ffffff;
  color: #1f6fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 24px rgba(31,111,255,0.18);
  z-index: 1200;
  user-select: none;
  touch-action: none;
}
.assistant-ring {
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(79,124,255,0.25), rgba(110,231,255,0.2));
  filter: blur(2px);
}
.assistant-core {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px rgba(31,111,255,0.08);
  flex-direction: column;
  gap: 2px;
}
.assistant-icon {
  width: 26px;
  height: 26px;
}
.assistant-text {
  font-size: 10px;
  font-weight: 600;
  color: #2c6fff;
  line-height: 1;
}
</style>
