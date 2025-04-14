<template>
  <div class="user">
    <el-table :data="tableData" style="width: 100%">
      <el-table-column prop="_id" label="用户编号" />
      <el-table-column prop="name" label="用户名称" />
      <el-table-column prop="region" label="地区" />
      <el-table-column prop="gender" label="性别" />
      <el-table-column prop="birthData" label="出生日期" />
      <el-table-column prop="delivery" label="是否已婚">
        <template #default="scope">
          <el-tag>{{ scope.row.delivery ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="personalSituation" label="个人情况">
        <template #default="scope">
          <el-tag v-for="item in scope.row.personalSituation">{{ item }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="email" label="电子邮箱" />
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