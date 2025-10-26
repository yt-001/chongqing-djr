// 路由配置（手机端）：包含首页与我的页
import { createRouter, createWebHistory } from 'vue-router'

const Home = () => import('@/views/Home.vue')
const Mine = () => import('@/views/Mine.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Home, meta: { title: '首页' } },
    { path: '/mine', name: 'mine', component: Mine, meta: { title: '我的' } }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = to.meta.title
  }
})

export default router
