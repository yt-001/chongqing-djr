// 全局样式与框架引入（移动端 + 管理端）
import './styles/reset.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
// 引入 Vant（移动端）
import Vant from 'vant'
import 'vant/lib/index.css'
// 引入 Element Plus（管理端/桌面端）
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import './styles/element-theme.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(Vant)
dayjs.locale('zh-cn')
app.use(ElementPlus, { locale: zhCn })
// 全量注册 Element Plus 图标，方便在管理端使用
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')
