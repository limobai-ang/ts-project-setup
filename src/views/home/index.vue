<template>
  <div class="home">
    <el-container class="layout-container-demo">
      <el-aside width="200px">
        <el-scrollbar>
          <el-menu :router="true">
            <el-sub-menu>
              <template #title>
                <el-icon>
                  <message />
                </el-icon>菜单一
              </template>
              <el-menu-item-group>
                <el-menu-item index="/home/userlist">用户列表</el-menu-item>
              </el-menu-item-group>
              <el-menu-item-group>
                <el-menu-item index="/home/adduser">个人信息</el-menu-item>
              </el-menu-item-group>
            </el-sub-menu>
          </el-menu>
        </el-scrollbar>
      </el-aside>

      <el-container>
        <el-main style="padding-top: 0;">
          <router-view />
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
const store = useUserStore()
const { age, name, dateOfBirth } = storeToRefs(store)


// const tableData = ref<Indicator[]>([]);
// const getMetaIndicatorExtendFn = () => {
//   getMetaIndicatorExtend(18610154).then(res => {
//     tableData.value = res.data
//   })
// }
// getMetaIndicatorExtendFn()

</script>
<style lang="less" scoped>
.box {
  width: 100%;
  height: 300px;
  border: 5px solid var(--demo-border);
  background-color: var(--demo-bg);
  display: flex;
  align-items: center;
  justify-content: center;

  h1 {
    color: var(--demo-text);
  }
}
</style>