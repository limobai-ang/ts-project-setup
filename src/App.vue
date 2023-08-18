<template>
  <div class="app" id="app">
    <el-container>
      <el-header style="padding: 0;">
        <Header />
      </el-header>
      <el-main style="padding: 0;">
        <router-view />
      </el-main>
    </el-container>

  </div>
</template>

<script lang="ts" setup>
import Header from '@/components/header'
</script>

<style lang="less">
body {
  padding: 0;
  margin: 0;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}


</style>
