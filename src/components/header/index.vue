<template>
  <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal" :ellipsis="false" @select="handleSelect">
    <div class="header-content">
      <el-avatar :size="32" class="mr-3" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
      <span class="text-large font-600 mr-3">Title </span>
      <span class="text-sm mr-2" style="color: var(--el-text-color-regular)">
        Sub title
      </span>
    </div>
    <div class="flex-grow" />
    <el-menu-item index="1">Home</el-menu-item>
    <el-sub-menu index="2">
      <template #title>User</template>
      <el-menu-item index="2-1">item one</el-menu-item>
      <el-menu-item index="2-2">item two</el-menu-item>
      <el-menu-item index="2-3">item three</el-menu-item>
      <el-sub-menu index="2-4">
        <template #title>item four</template>
        <el-menu-item index="2-4-1">item one</el-menu-item>
        <el-menu-item index="2-4-2">item two</el-menu-item>
        <el-menu-item index="2-4-3">item three</el-menu-item>
      </el-sub-menu>
    </el-sub-menu>
    <el-switch class="switch-el" v-model="isDark" :active-action-icon="Moon" :inactive-action-icon="Sunny"
      @change="toggleDark" />
  </el-menu>
</template>

<script lang="ts" setup>
import { Sunny, Moon } from '@element-plus/icons-vue'
import { useDark, useToggle } from '@vueuse/core'
import '@/utils/elementPlusResizeObserverError'
import { ref } from 'vue';
const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: 'light',
})
const toggleDark = () => useToggle(isDark);

// 菜单
const activeIndex = ref('1')
const handleSelect = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
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