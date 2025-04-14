<template>
  <div class="home">
    <el-container class="home-container">
      <el-aside width="200px">
          <el-menu :router="true" :default-active="$route.path" :default-openeds="['1']" class="home-menu">
            <el-sub-menu index="1">
              <template #title>
                <el-icon>
                  <message />
                </el-icon>功能菜单
              </template>
              <el-menu-item-group>
                <el-menu-item index="/home/userlist">用户列表</el-menu-item>
              </el-menu-item-group>
              <el-menu-item-group>
                <el-menu-item index="/home/adduser">个人信息</el-menu-item>
              </el-menu-item-group>
              <el-menu-item-group>
                <el-menu-item index="/home/chatRoom">webSocket</el-menu-item>
              </el-menu-item-group>
              <el-menu-item-group>
                <el-menu-item index="/home/deepSeek">deepSeek</el-menu-item>
              </el-menu-item-group>
              <el-menu-item-group>
                <el-menu-item index="/home/cesium">cesium</el-menu-item>
              </el-menu-item-group>
            </el-sub-menu>
          </el-menu>
      </el-aside>

      <el-container>
        <el-main style="padding-top: 0;">
          <router-view @click="() => {console.log('1111');
          }" />
        </el-main>
      </el-container>
    </el-container>

  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { Message, Setting } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { storeToRefs } from 'pinia';
// import { getMetaIndicatorExtend } from '@/apis/home/home'
// import { Indicator } from '@/apis/home/types'
// const store = useUserStore()
// const { age, name, dateOfBirth } = storeToRefs(store)


// const tableData = ref<Indicator[]>([]);
// const getMetaIndicatorExtendFn = () => {
//   getMetaIndicatorExtend(18610154).then(res => {
//     tableData.value = res.data
//   })
// }
// getMetaIndicatorExtendFn()

</script>
<style lang="less" scoped>
.home, .home-container, .home-menu {
  height: 100%;
}
</style>