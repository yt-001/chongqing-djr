export { login, logout, refresh, check } from './modules/auth.js'
export { fetchAttractionsPage } from './modules/attractions.js' // 用户端-景点分页
export { fetchAdminAttractionsPage, fetchAdminAttractionById, createAdminAttraction, updateAdminAttraction, deleteAdminAttraction } from './modules/admin/attractions.js' // 管理端-景点分页+详情+增改删
export { fetchRestaurantsPage, fetchRestaurantById } from './modules/restaurants.js'
export { fetchAdminRestaurantsPage, fetchAdminRestaurantById, createAdminRestaurant, updateAdminRestaurant, deleteAdminRestaurant } from './modules/admin/restaurants.js'
export { fetchAdminAccommodationsPage, fetchAdminAccommodationById, createAdminAccommodation, updateAdminAccommodation, deleteAdminAccommodation } from './modules/admin/accommodations.js' // 管理端-住宿分页+详情+增改删
