// 路由配置（手机端）：包含首页与我的页
import { createRouter, createWebHistory } from 'vue-router'

const Home = () => import('@/views/Home.vue')
const Recommend = () => import('@/views/Recommend.vue')
const Food = () => import('@/views/Food.vue')
const FoodDetail = () => import('@/views/FoodDetail.vue')
const Booking = () => import('@/views/Booking.vue')
const Mine = () => import('@/views/Mine.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Home, meta: { title: '首页' } },
    { path: '/recommend', name: 'recommend', component: Recommend, meta: { title: '推荐' } },
    { path: '/food', name: 'food', component: Food, meta: { title: '美食' } },
    { path: '/food/:id', name: 'food-detail', component: FoodDetail, meta: { title: '美食详情', hideTabbar: true } },
    { path: '/booking', name: 'booking', component: Booking, meta: { title: '预定' } },
    { path: '/mine', name: 'mine', component: Mine, meta: { title: '我的' } },
    { path: '/login', name: 'login', component: () => import('@/views/Login.vue'), meta: { title: '登录', hideTabbar: true } },
    { path: '/register', name: 'register', component: () => import('@/views/Register.vue'), meta: { title: '注册', hideTabbar: true } },
    // 管理员端：使用子路由在右侧区域渲染内容
    { path: '/admin', name: 'admin-home', component: () => import('@/views/admin/AdminHome.vue'), meta: { title: '管理员后台', hideTabbar: true },
      children: [
        { path: '', redirect: { name: 'admin-dashboard' } },
        { path: 'dashboard', name: 'admin-dashboard', component: () => import('@/views/admin/AdminDashboard.vue'), meta: { title: '仪表盘', hideTabbar: true } },
        { path: 'attractions', name: 'admin-attractions', component: () => import('@/views/admin/AdminAttractions.vue'), meta: { title: '景点管理', hideTabbar: true } },
        { path: 'restaurants', name: 'admin-restaurants', component: () => import('@/views/admin/AdminRestaurants.vue'), meta: { title: '餐饮管理', hideTabbar: true } },
        { path: 'orders', name: 'admin-orders', component: () => import('@/views/admin/AdminOrders.vue'), meta: { title: '订单管理', hideTabbar: true } },
        { path: 'user', name: 'admin-user', component: () => import('@/views/admin/AdminUserClient.vue'), meta: { title: '用户端', hideTabbar: true } }
      ]
    }
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
