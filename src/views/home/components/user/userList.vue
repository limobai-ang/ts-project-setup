<template>
  <div class="user">
    <el-table :data="tableData" style="width: 100%">
      <el-table-column prop="id" label="id" />
      <el-table-column prop="name" label="name" />
      <el-table-column prop="region" label="region" />
      <el-table-column prop="date1" label="date1" />
      <el-table-column prop="delivery" label="delivery">
        <template #default="scope">
          <el-tag>{{ scope.row.delivery ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="type" label="type">
        <template #default="scope">
          <el-tag v-for="item in scope.row.type">{{ item }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="resource" label="resource" />
      <el-table-column prop="desc" label="desc" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button type="primary" size="small">编辑</el-button>
          <el-button type="danger" size="small" @click="deleteData(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { User } from '@/apis/user/types'
import { getUserList, delUser } from '@/apis/user'
import { ref } from 'vue';

const tableData = ref<User[]>([])
const getUserListFn = () => {
  getUserList().then(res => {
    tableData.value = res.data
  })
}
getUserListFn()

const deleteData = (data: User) => {
  delUser(data.id).then(res => {
    getUserListFn()
  })
}
</script>

<style lang="scss" scoped></style>