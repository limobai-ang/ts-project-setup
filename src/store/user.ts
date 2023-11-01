import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
    const name = ref<string>('张三')
    const age = ref<number>(19)
    const setName =  (data: string) : void => {
        name.value= data
    }
    const addAge = () => {
        age.value++
    }
    return {
        name,
        age,
        addAge,
        setName
    }

})