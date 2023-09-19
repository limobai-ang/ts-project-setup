import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import '@/permission.ts'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './styles/index.css'
// import 'element-plus/dist/index.css'
createApp(App).use(store).use(router).mount('#app')
