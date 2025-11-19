export { login, logout, refresh, check } from './modules/auth.js'
export { fetchAttractionsPage } from './modules/attractions.js' // 用户端-景点分页
export { fetchAdminAttractionsPage, fetchAdminAttractionById, createAdminAttraction, updateAdminAttraction, deleteAdminAttraction } from './modules/admin/attractions.js' // 管理端-景点分页+详情+增改删
export { fetchRestaurantsPage, fetchRestaurantById } from './modules/restaurants.js'
export { fetchAdminRestaurantsPage, fetchAdminRestaurantById, createAdminRestaurant, updateAdminRestaurant, deleteAdminRestaurant } from './modules/admin/restaurants.js'
export { fetchAdminAccommodationsPage, fetchAdminAccommodationById, createAdminAccommodation, updateAdminAccommodation, deleteAdminAccommodation } from './modules/admin/accommodations.js' // 管理端-住宿分页+详情+增改删
export { uploadImages, createImagesFormData, uploadSingleImage, uploadMultipleImages } from './modules/upload.js' // 文件上传
export { updateUser } from './modules/user.js' // 用户更新
export { fetchOrdersPage, fetchOrderById, createOrder, updateOrder, deleteOrder, fetchExpiredPaidOrdersPage, fetchPendingValidOrdersPage } from './modules/orders.js' // 订单模块（用户端）
export { fetchAdminOrdersPage } from './modules/admin/orders.js' // 管理端订单分页
