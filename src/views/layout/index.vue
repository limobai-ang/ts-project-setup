<template>
    <div>
        <el-container>
            <el-header style="padding: 0;">
                <Header></Header>
            </el-header>
            <el-main style="padding: 0;">
                <router-view />
            </el-main>
        </el-container>
    </div>
</template>

<script setup lang="ts">
import Header from '@/components/header/index.vue'
</script>

<style scoped></style>