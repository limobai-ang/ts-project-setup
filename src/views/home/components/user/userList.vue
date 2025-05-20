<template>
  <div class="user">
    <el-table :data="tableData" style="width: 100%">
      <el-table-column prop="_id" label="用户编号" />
      <el-table-column prop="username" label="用户名称" />
      <el-table-column prop="email" label="电子邮箱" />
      <el-table-column prop="phone" label="手机号" />
      <el-table-column prop="desc" label="备注" />
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
  delUser(data._id).then(res => {
    getUserListFn()
  })
}
</script>

<style lang="scss" scoped></style>