// 路由配置（手机端）：包含首页与我的页
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user.js'

const Home = () => import('@/views/Home.vue')
const Recommend = () => import('@/views/Recommend.vue')
const Food = () => import('@/views/Food.vue')
const FoodDetail = () => import('@/views/FoodDetail.vue')
const ScenicDetail = () => import('@/views/ScenicDetail.vue')
const PaymentSuccess = () => import('@/views/PaymentSuccess.vue')
const PayMock = () => import('@/views/PayMock.vue')
const OrderDetail = () => import('@/views/OrderDetail.vue')
const Booking = () => import('@/views/Booking.vue')
const Mine = () => import('@/views/Mine.vue')
const PendingVouchers = () => import('@/views/PendingVouchers.vue')
const UnpaidOrders = () => import('@/views/UnpaidOrders.vue')
const CompletedOrders = () => import('@/views/CompletedOrders.vue')


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Home, meta: { title: '首页' } },
    { path: '/recommend', name: 'recommend', component: Recommend, meta: { title: '推荐' } },
    { path: '/guide-routes', name: 'guide-routes', component: () => import('@/views/GuideRoutes.vue'), meta: { title: '路线推荐', hideTabbar: true } },
    { path: '/food', name: 'food', component: Food, meta: { title: '美食' } },
    { path: '/food/:id', name: 'food-detail', component: FoodDetail, meta: { title: '美食详情', hideTabbar: true } },
    { path: '/accommodations', name: 'accommodation-list', component: () => import('@/views/AccommodationList.vue'), meta: { title: '住宿列表', hideTabbar: true } },
    { path: '/accommodations/:id', name: 'accommodation-detail', component: () => import('@/views/AccommodationDetail.vue'), meta: { title: '住宿详情', hideTabbar: true } },
    { path: '/scenic/:id', name: 'scenic-detail', component: ScenicDetail, meta: { title: '景点详情', hideTabbar: true } },
    { path: '/pay-success', name: 'pay-success', component: PaymentSuccess, meta: { title: '支付成功', hideTabbar: true } },
    { path: '/pay/mock', name: 'pay-mock', component: PayMock, meta: { title: '模拟支付', hideTabbar: true } },
    { path: '/orders/:orderNo', name: 'order-detail', component: OrderDetail, meta: { title: '订单详情', hideTabbar: true } },
    { path: '/booking', name: 'booking', component: Booking, meta: { title: '预定' } },
    { path: '/mine', name: 'mine', component: Mine, meta: { title: '我的' } },
    { path: '/vouchers/pending', name: 'pending-vouchers', component: PendingVouchers, meta: { title: '待消费卷', hideTabbar: true } },
    { path: '/orders/incomplete', name: 'incomplete-orders', component: UnpaidOrders, meta: { title: '未完成', hideTabbar: true } },
    { path: '/orders/completed', name: 'completed-orders', component: CompletedOrders, meta: { title: '已完成', hideTabbar: true } },
    { path: '/my-favorites', name: 'my-favorites', component: () => import('@/views/MyFavorites.vue'), meta: { title: '我的收藏', hideTabbar: true } },
    { path: '/map', name: 'map-navigation', component: () => import('@/views/MapNavigation.vue'), meta: { title: '景点导航', hideTabbar: true } },
    { path: '/route-map', name: 'route-map-navigation', component: () => import('@/views/RouteMapNavigation.vue'), meta: { title: '路线详情', hideTabbar: true } },

    { path: '/login', name: 'login', component: () => import('@/views/Login.vue'), meta: { title: '登录', hideTabbar: true } },
    { path: '/register', name: 'register', component: () => import('@/views/Register.vue'), meta: { title: '注册', hideTabbar: true } },
    // 管理员端：使用子路由在右侧区域渲染内容
    { path: '/admin', name: 'admin-home', component: () => import('@/views/admin/AdminHome.vue'), meta: { title: '管理员后台', hideTabbar: true },
      children: [
        { path: '', name: 'admin-default', redirect: { name: 'admin-dashboard' } },
        { path: 'dashboard', name: 'admin-dashboard', component: () => import('@/views/admin/AdminDashboard.vue'), meta: { title: '仪表盘', hideTabbar: true } },
        { path: 'attractions', name: 'admin-attractions', component: () => import('@/views/admin/AdminAttractions.vue'), meta: { title: '景点管理', hideTabbar: true } },
        { path: 'popular-attractions', name: 'admin-popular-attractions', component: () => import('@/views/admin/AdminPopularAttractions.vue'), meta: { title: '热门景点', hideTabbar: true } },
        { path: 'guide-map', name: 'admin-guide-map', component: () => import('@/views/admin/AdminGuideMap.vue'), meta: { title: '向导图制作', hideTabbar: true } },
        { path: 'guide-map-gallery', name: 'admin-guide-map-gallery', component: () => import('@/views/admin/AdminGuideMapGallery.vue'), meta: { title: '向导图库', hideTabbar: true } },
        { path: 'guide-map-workflow', name: 'admin-guide-map-workflow', component: () => import('@/views/admin/AdminGuideMapWorkflow.vue'), meta: { title: '旅游路线编辑', hideTabbar: true } },
        { path: 'restaurants', name: 'admin-restaurants', component: () => import('@/views/admin/AdminRestaurants.vue'), meta: { title: '餐饮管理', hideTabbar: true } },
        { path: 'accommodations', name: 'admin-accommodations', component: () => import('@/views/admin/AdminAccommodations.vue'), meta: { title: '住宿管理', hideTabbar: true } },
        { path: 'accommodation-types', name: 'admin-accommodation-types', component: () => import('@/views/admin/AdminAccommodationTypes.vue'), meta: { title: '住宿类型', hideTabbar: true } },
        { path: 'accommodation-facilities', name: 'admin-accommodation-facilities', component: () => import('@/views/admin/AdminAccommodationFacilities.vue'), meta: { title: '住宿设施', hideTabbar: true } },
        { path: 'orders', name: 'admin-orders', component: () => import('@/views/admin/AdminOrders.vue'), meta: { title: '订单管理', hideTabbar: true } },
        { path: 'users', name: 'admin-users', component: () => import('@/views/admin/AdminUserManagement.vue'), meta: { title: '用户管理', hideTabbar: true } },
        { path: 'user', name: 'admin-user', component: () => import('@/views/admin/AdminUserClient.vue'), meta: { title: '用户端', hideTabbar: true } },
        { path: 'profile', name: 'admin-profile', component: () => import('@/views/admin/Profile.vue'), meta: { title: '个人中心', hideTabbar: true } }
      ]
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})


// 角色判定：尽量兼容多种后端返回结构
function isAdminUser(user) {
  if (!user) return false
  // 1) 显式布尔或数值
  if (user.isAdmin === true) return true
  if (user.roleCode === 1 || user.type === 'admin') return true
  // 2) 单值字符串 role
  if (typeof user.role === 'string' && user.role.toLowerCase().includes('admin')) return true
  // 3) 角色数组/权限数组
  const roles = user.roles || user.authorities || user.permissions || []
  if (Array.isArray(roles) && roles.some(r => String(r).toLowerCase().includes('admin'))) return true
  // 4) 兜底：用户名即为 admin
  if (typeof user.username === 'string' && user.username.toLowerCase() === 'admin') return true
  return false
}

// 刷新控制标志：仅在刷新后的首个导航执行一次“就近修正”
let sessionLoaded = false
let adjustedOnceAfterRefresh = false

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()
  // 1) 刷新后首个导航：通过 HttpOnly Cookie 调用 /check 拉取会话
  if (!sessionLoaded) {
    try { await userStore.fetchSession() } catch (_) {}
    sessionLoaded = true
  }

  const isAdmin = isAdminUser(userStore.user)
  const isAdminRoute = to.path.startsWith('/admin')

  // 2) 仅在刷新首跳执行你描述的就近修正规则
  if (!adjustedOnceAfterRefresh) {
    adjustedOnceAfterRefresh = true
    if (isAdmin) {
      // 管理员：如果当前不在 /admin 下，跳到管理员首页；在 /admin 下则保持不变
      if (!isAdminRoute) return next({ path: '/admin' })
    } else {
      // 普通用户：如果当前在 /admin 下，跳到用户首页；否则保持不变
      if (isAdminRoute) return next({ name: 'home' })
    }
  }

  return next()
})

router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = to.meta.title
  }
})

export default router
