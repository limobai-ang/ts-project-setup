<!-- ClusterMarker.vue -->
<template>
  <div class="cluster-bubble">
    <div class="cluster-count">{{ items.length }} 个设备</div>
    <div v-for="item in items" :key="item.id">
      {{ item.name }} ({{ item.id }})
    </div>
  </div>
</template>

<script setup>
defineProps({
  items: Array
});
</script>

<style scoped>
.cluster-bubble {
  background: white;
  border-radius: 8px;
  padding: 8px 12px;
  border: 1px solid #ccc;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  font-size: 12px;
  line-height: 1.4;
}
</style>
