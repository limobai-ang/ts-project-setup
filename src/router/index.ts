import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/views/layout/index.vue'),
    redirect: '/login',
    children: [
      {
        path: 'home',
        name: 'home',
        component: () => import('@/views/home/index.vue'),
        redirect: 'home/userlist',
        children: [
          {
            path: 'userlist',
            name: 'userList',
            component: () => import('@/views/home/components/user/userList.vue'),
          },
          {
            path: 'userSetting',
            name: 'userSetting',
            component: () => import('@/views/home/components/user/userSetting.vue'),
          },
          {
            path: 'addUser',
            name: 'addUser',
            component: () => import('@/views/home/components/user/addUser.vue'),
          },
          {
            path: 'chatRoom',
            name: 'chatRoom',
            component: () => import('@/views/home/components/chatRoom/index.vue'),
          },
          {
            path: 'deepSeek',
            name: 'deepSeek',
            component: () => import('@/views/home/components/deepSeek/index.vue'),
          },
          {
            path: 'cesium',
            name: 'cesium',
            component: () => import('@/views/home/components/cesium/index.vue'),
          },
          {
            path: 'AMap',
            name: 'AMap',
            component: () => import('@/views/home/components/AMap/index.vue'),
          },
        ]
      },
      {
        path: 'setting',
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
