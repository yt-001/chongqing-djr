// 路由配置（手机端）：包含首页与我的页
import { createRouter, createWebHistory } from 'vue-router'

const Home = () => import('@/views/Home.vue')
const Recommend = () => import('@/views/Recommend.vue')
const Food = () => import('@/views/Food.vue')
const Booking = () => import('@/views/Booking.vue')
const Mine = () => import('@/views/Mine.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Home, meta: { title: '首页' } },
    { path: '/recommend', name: 'recommend', component: Recommend, meta: { title: '推荐' } },
    { path: '/food', name: 'food', component: Food, meta: { title: '美食' } },
    { path: '/booking', name: 'booking', component: Booking, meta: { title: '预定' } },
    { path: '/mine', name: 'mine', component: Mine, meta: { title: '我的' } },
    { path: '/login', name: 'login', component: () => import('@/views/Login.vue'), meta: { title: '登录', hideTabbar: true } },
    { path: '/register', name: 'register', component: () => import('@/views/Register.vue'), meta: { title: '注册', hideTabbar: true } },
    // 管理员端独立页面
    { path: '/admin', name: 'admin-home', component: () => import('@/views/admin/AdminHome.vue'), meta: { title: '管理员后台', hideTabbar: true } }
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
