import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: () => import('@/views/layout/index.vue'),
    redirect: '/login',
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
          },
          {
            path: '/home/chatRoom',
            name: 'chatRoom',
            component: () => import('@/views/home/components/chatRoom/index.vue'),
          },
          {
            path: '/home/deepSeek',
            name: 'deepSeek',
            component: () => import('@/views/home/components/deepSeek/index.vue'),
          },
          {
            path: '/home/cesium',
            name: 'cesium',
            component: () => import('@/views/home/components/cesium/index.vue'),
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
    component: () => import('@/views/login/index.vue')
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/login/register.vue')
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
