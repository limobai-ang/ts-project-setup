import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAppStore = defineStore('app', () => {
    const token = ref<string>('');

    const setToken = (newToken: string) => {
        token.value = newToken;
    };

    const clearToken = () => {
        token.value = '';
    };

    const isLoggedIn = computed(() => !!token.value);

    return {
        token,
        setToken,
        clearToken,
        isLoggedIn,
    };
}, {
    persist: {
        key: 'userStore',
        storage: localStorage, // 也可以使用 sessionStorage
        pick: ['token']
    },
});
