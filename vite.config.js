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
  build: {
    minify: false,
    cssMinify: false
  },
  server: {
    host: true, // 允许通过局域网访问，方便手机调试
    port: 8111,
    strictPort: true, // 端口被占用时直接报错，确保使用 8111
    open: true,
    proxy: {
      // 代理后端 API 请求
      '/auth': { target: 'http://localhost:9002', changeOrigin: true },
      '/files': { target: 'http://localhost:9002', changeOrigin: true },
      '/attractions': { target: 'http://localhost:9002', changeOrigin: true },
      '/popular-attractions': { target: 'http://localhost:9002', changeOrigin: true },
      '/restaurants': { target: 'http://localhost:9002', changeOrigin: true },
      '/accommodations': { target: 'http://localhost:9002', changeOrigin: true },
      '/intangible-cultures': { target: 'http://localhost:9002', changeOrigin: true },
      '/comments': { target: 'http://localhost:9002', changeOrigin: true },
      '/favorites': { target: 'http://localhost:9002', changeOrigin: true },
      '/users': { target: 'http://localhost:9002', changeOrigin: true },
      '/orders': { target: 'http://localhost:9002', changeOrigin: true },
      '/bookings': { target: 'http://localhost:9002', changeOrigin: true },
      '/restaurant-categories': { target: 'http://localhost:9002', changeOrigin: true },
      '/dish-categories': { target: 'http://localhost:9002', changeOrigin: true },
      '/accommodation-types': { target: 'http://localhost:9002', changeOrigin: true },
      '/accommodation-facilities': { target: 'http://localhost:9002', changeOrigin: true },
      // 代理静态图片资源，从后端获取
      '/public/images': { 
        target: 'http://localhost:9002', 
        changeOrigin: true
      }
    }
  }
})
