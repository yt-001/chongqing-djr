import { request } from '../../http.js'

export function fetchRestaurantDishesPage(restaurantId, payload) {
  return request(`/restaurants/${restaurantId}/dishes/page`, {
    method: 'POST',
    body: payload,
  })
}

export function fetchRestaurantDishOptions(restaurantId) {
  return request(`/restaurants/${restaurantId}/dishes/options`, {
    method: 'GET',
  })
}

export function createRestaurantDish(restaurantId, payload) {
  return request(`/restaurants/${restaurantId}/dishes`, {
    method: 'POST',
    body: payload,
  })
}

export function updateRestaurantDish(restaurantId, dishId, payload) {
  return request(`/restaurants/${restaurantId}/dishes/${dishId}`, {
    method: 'PUT',
    body: payload,
  })
}

export function deleteRestaurantDish(restaurantId, dishId) {
  return request(`/restaurants/${restaurantId}/dishes/${dishId}`, {
    method: 'DELETE',
  })
}
