export { login, logout, refresh, check } from './modules/auth.js'
export { fetchAttractionsPage } from './modules/attractions.js' // 用户端-景点分页
export { fetchAdminAttractionsPage, fetchAdminAttractionById, createAdminAttraction, updateAdminAttraction, deleteAdminAttraction } from './modules/admin/attractions.js' // 管理端-景点分页+详情+增改删
export { fetchRestaurantsPage, fetchRestaurantById } from './modules/restaurants.js'
export { fetchAdminRestaurantsPage, fetchAdminRestaurantById, createAdminRestaurant, updateAdminRestaurant, deleteAdminRestaurant } from './modules/admin/restaurants.js'
export { fetchAdminAccommodationsPage, fetchAdminAccommodationById, createAdminAccommodation, updateAdminAccommodation, deleteAdminAccommodation } from './modules/admin/accommodations.js' // 管理端-住宿分页+详情+增改删
export * from './modules/admin/restaurantCategories.js'
export * from './modules/admin/dishCategories.js'
export * from './modules/admin/restaurantDishes.js'
export { fetchAccommodationTypesPage, fetchAccommodationTypeById, createAccommodationType, updateAccommodationType, deleteAccommodationType } from './modules/accommodationTypes.js' // 住宿类型管理
export { fetchAccommodationFacilitiesPage, fetchAccommodationFacilityById, createAccommodationFacility, updateAccommodationFacility, deleteAccommodationFacility } from './modules/accommodationFacilities.js' // 住宿设施管理
export { fetchAccommodationsPage, fetchAccommodationById } from './modules/accommodations.js' // 用户端-住宿分页+详情
export { uploadImages, createImagesFormData, uploadSingleImage, uploadMultipleImages } from './modules/upload.js' // 文件上传
export { updateUser } from './modules/user.js' // 用户更新
export { fetchOrdersPage, fetchOrderById, createOrder, updateOrder, deleteOrder, fetchExpiredPaidOrdersPage, fetchPendingValidOrdersPage } from './modules/orders.js' // 订单模块（用户端）
export { fetchAdminOrdersPage } from './modules/admin/orders.js' // 管理端订单分页
export * from './modules/admin/users.js'
export * from './modules/favorites.js' // 收藏模块
export * from './modules/comments.js' // 评论模块
export * from './modules/popularAttractions.js' // 热门景点
export * from './modules/admin/popularAttractions.js' // 管理端热门景点
export * from './modules/guideRoutes.js' // 向导路线/向导图库
export * from './modules/guideRoutesWorkflow.js' // 向导路线详情（工作流）
