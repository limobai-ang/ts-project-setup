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
                </el-icon>Navigator One
              </template>
              <el-menu-item-group>
                <el-menu-item index="/home/1-1">Option 1</el-menu-item>
              </el-menu-item-group>
              <el-sub-menu index="1-2">
                <template #title>Option2</template>
                <el-menu-item index="1-2">Option 2-1</el-menu-item>
              </el-sub-menu>
            </el-sub-menu>
            <el-sub-menu>
              <template #title>
                <el-icon>
                  <setting />
                </el-icon>Navigator Two
              </template>
              <el-menu-item-group>
                <el-menu-item index="2-1">Option 1</el-menu-item>
              </el-menu-item-group>
            </el-sub-menu>
          </el-menu>
        </el-scrollbar>
      </el-aside>

      <el-container>
        <el-main style="padding-top: 0;">
          <div class="box">
            <h1>Hello World</h1>
          </div>
        </el-main>
      </el-container>
    </el-container>


  </div>
</template>

<script lang="ts" setup>
import { Message, Setting } from '@element-plus/icons-vue'

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