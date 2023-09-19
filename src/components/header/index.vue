<template>
  <el-menu :default-active="route.path" class="el-menu-demo" mode="horizontal" router :ellipsis="false">
    <div class="header-content">
      <el-avatar :size="32" class="mr-3" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
      <span class="text-large font-600 mr-3">Title </span>
      <span class="text-sm mr-2" style="color: var(--el-text-color-regular)">
        Sub title
      </span>
    </div>
    <div class="flex-grow" />
    <el-menu-item index="/home">Home</el-menu-item>
    <el-menu-item index="/user">User</el-menu-item>
    <el-switch class="switch-el" v-model="isDark" :active-action-icon="Moon" :inactive-action-icon="Sunny"
      @change="toggleDark" />
  </el-menu>
</template>

<script lang="ts" setup>
import { Sunny, Moon } from '@element-plus/icons-vue'
import { useDark, useToggle } from '@vueuse/core'
import '@/utils/elementPlusResizeObserverError'
import { ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute()

const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: 'light',
})
const toggleDark = () => useToggle(isDark);
</script>

<style lang="less" scoped>
.header-content {
  display: flex;
  align-items: center;
}

.el-menu-demo {
  height: 50px;
}

.flex-grow {
  flex-grow: 1;
}

.switch-el {
  height: inherit;
}
</style>