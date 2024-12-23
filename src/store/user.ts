
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { User } from '@/apis/user/types'
export const useUserStore = defineStore('user', () => {
    const userInfo = ref<User | null>(null)
    const setUserInfo = (user: User) => {
        userInfo.value = user
    }

    const clearUserInfo = () => {
        userInfo.value = null
    }
    return {
        userInfo,
        setUserInfo,
        clearUserInfo
    }
},{
    persist: {
        key: 'userInfo',
        storage: localStorage, // 也可以使用 sessionStorage
        pick: ['userInfo']
    },
})