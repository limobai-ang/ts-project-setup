import moment from 'moment'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useUserStore = defineStore('user', () => {
    const name = ref<string>('张三')
    const age = ref<number>(19)
    const setName =  (data: string) : void => {
        name.value= data
    }
    const addAge = () => {
        age.value++
    }

    const dateOfBirth = computed(() => {
        const date = moment().subtract(age.value, 'years');
        return date.format('YYYY-MM-DD')
    })
    return {
        name,
        age,
        dateOfBirth,
        addAge,
        setName
    }

})