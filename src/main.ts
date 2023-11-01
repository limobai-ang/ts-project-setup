import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import '@/permission.ts'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './styles/index.css'
// import 'element-plus/dist/index.css'

createApp(App).use(createPinia()).use(router).mount('#app')
