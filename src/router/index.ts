import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import { useStore } from 'vuex'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: () => import('@/views/layout/index.vue'),
    redirect: '/home',
    children: [
      {
        path: '/home',
        name: 'home',
        component: () => import('@/views/home/index.vue'),
        redirect: '/home/userlist',
        children: [
          {
            path: '/home/userlist',
            name: 'userList',
            component: () => import('@/views/home/components/user/userList.vue'),
          },
          {
            path: '/home/adduser',
            name: 'addUser',
            component: () => import('@/views/home/components/user/addUser.vue'),
          }
        ]
      },
      {
        path: '/setting',
        name: 'setting',
        component: () => import('@/views/setting/index.vue')
      },
    ]
  },

  {
    path: '/login',
    name: 'login',
    component: import('@/views/login/index.vue')
  },
  {
    path: '/:catchAll(.*)',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
