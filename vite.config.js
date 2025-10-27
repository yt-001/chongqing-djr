import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Vite 配置，别名与移动端调试服务器
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: true, // 允许通过局域网访问，方便手机调试
    port: 8111,
    strictPort: true, // 端口被占用时直接报错，确保使用 8111
    open: true
  }
})
