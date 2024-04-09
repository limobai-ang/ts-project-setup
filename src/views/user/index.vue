<template>
  <div class="user">
    <h1>Hello User</h1>

    <h1>年龄：{{ age }}</h1>
    <h1>姓名：{{ name }}</h1>

    <el-input v-model="input" placeholder="Please input" width="300px">
      <template #append>
        <el-button type="primary" @click="setName">确定</el-button>
      </template>
    </el-input>

    <el-button type="primary" @click="addAge">add</el-button>
  </div>
</template>

<script setup>
import { useUserStore } from '@/store/user'
import { storeToRefs } from 'pinia';
import { ref } from 'vue'
const store = useUserStore()
const {age, name}  = storeToRefs(store)
const input = ref('')
const addAge = () => {
  age.value += 1
}
const setName = () => {
  store.setName(input.value)
}

</script>

<style lang="scss" scoped></style>