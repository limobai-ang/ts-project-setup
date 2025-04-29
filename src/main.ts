import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

import 'element-plus/theme-chalk/dark/css-vars.css'
import './styles/index.css'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
const app = createApp(App)
app.config.errorHandler = (err, instance, info) => {
    console.error('[Vue error]:', err, info)
}
app.use(pinia).use(router).mount('#app')

