// Pinia 用户存储（JS 版）
import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi, check as checkApi, refresh as refreshApi } from '@/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: null,
    user: null,
  }),
  getters: {
    // HttpOnly Cookie 方案：以是否存在用户对象作为登录态依据
    isLoggedIn: (state) => !!state.user,
    username: (state) => (state.user && state.user.username) || '',
  },
  actions: {
    /** 设置用户信息与 token */
    setSession(payload) {
      this.token = payload.token
      this.user = payload.user
    },
    /** 清空登录状态 */
    clearSession() {
      this.token = null
      this.user = null
    },
    /** 执行登录（账号可为邮箱或电话） */
    async login(payload) {
      // 调用登录接口（HttpOnly Cookie 写入由服务端完成）
      const user = await loginApi(payload) // http.js 已统一按 ApiResponse 返回 data
      this.setSession({ token: null, user })
      return user
    },
    /** 主动拉取会话（校验 access_token 并返回用户） */
    async fetchSession() {
      try {
        const user = await checkApi()
        this.setSession({ token: null, user })
        return user
      } catch (err) {
        // 若检查返回业务码 4001/4002（例如令牌过期/无效），尝试刷新令牌
        if (err && (err.code === 4001 || err.code === 4002)) {
          try {
            const user = await refreshApi()
            this.setSession({ token: null, user })
            return user
          } catch (e) {
            // 刷新失败：清空会话并提示用户重新登录
            this.clearSession()
            try {
              const { showToast } = await import('vant')
              showToast({ message: '登录状态已过期，请重新登录', position: 'top' })
            } catch (_) {}
            throw e
          }
        }
        // 其它错误：清空会话并上抛
        this.clearSession()
        throw err
      }
    },
    /** 刷新访问令牌并更新用户信息 */
    async refresh() {
      const user = await refreshApi()
      this.setSession({ token: null, user })
      return user
    },
    /** 退出登录（清除 Cookie 与本地状态） */
    async logout() {
      try { await logoutApi() } catch (_) {}
      this.clearSession()
    },
  },
})