import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import '@/permission.ts'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './styles/index.css'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
// import 'element-plus/dist/index.css'
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
createApp(App).use(pinia).use(router).mount('#app')
