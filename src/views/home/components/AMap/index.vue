<template>
  <div id="container"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import AMapLoader from "@amap/amap-jsapi-loader";
import { useBatchMarker } from 'use-batch-marker'
import { getMockMarkerList } from '@/views/home/components/AMap/mockMarkerList';
import { createApp, h } from 'vue';
import ClusterMarker from './ClusterMarker.vue';
let map: AMap.Map
const createAMap = async () => {
  (window as any)._AMapSecurityConfig = {
    securityJsCode: "33ca1dc28676da5f6038c33fcb5fef38",
  };
  const AMap = await AMapLoader.load({
    key: "9e654b38b7a5d7adf18d80d4585d4644", // 申请好的Web端开发者Key，首次调用 load 时必填
    version: "2.0", // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
    plugins: ["AMap.Scale"], //需要使用的的插件列表，如比例尺'AMap.Scale'，支持添加多个如：['...','...']
  })
  map = new AMap.Map("container", {
    // 设置地图容器id
    viewMode: "3D", // 是否为3D地图模式
    zoom: 13, // 初始化地图级别
    center: [116.397428, 39.90923], // 初始化地图中心点位置
  });


  initAMap();
}


const initAMap = () => {
  const markerList = getMockMarkerList(10000);

  const { start, clear, update, getMarkers } = useBatchMarker(map, {
    data: markerList,
    getPosition: item => [item.lng, item.lat],
    renderMarker: item => `<div class="marker marker-${item.type}">${item.label}</div>`,

    // 开启分批渲染
    sliceRender: true,
    batchSize: 50,
    interval: 100,

    // 开启边缘优化
    optimizeByBounds: true,
    // 注册点位事件
    events: {
      click: item => {
        console.log(item)
      }
    },
    // 开启聚合
    enableCluster: true,
    renderClusterMarker(items) {
      const container = document.createElement('div');
      const app = createApp({
        render: () => h(ClusterMarker, { items })
      });
      app.mount(container);
      return container
    },

    // 点位渲染完成时的回调
    onCompleted() {
      console.log('点位渲染完成onCompleted');
    }
  });

  start();

  map.on('moveend', () => {
    const markers = getMarkers()
  });
}


onMounted(() => {
  createAMap()
})
onUnmounted(() => {
  map?.destroy();
});
</script>

<style scoped lang="scss">
#container {
  width: 100%;
  height: 800px;
}
</style>

<style>
.marker {
  width: 30px;
  height: 30px;
  background-color: gray;
  /* 默认颜色，类型覆盖 */
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  line-height: 30px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  position: relative;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.cluster-popup {
  position: relative;
  display: inline-block;
}

.cluster-bubble {
  background: white;
  border-radius: 8px;
  padding: 8px 12px;
  border: 1px solid #ccc;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  white-space: nowrap;
  font-size: 12px;
  line-height: 1.4;
  position: relative;
}

.cluster-bubble::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 20px;
  border-width: 8px 8px 0 8px;
  border-style: solid;
  border-color: white transparent transparent transparent;
}

/* 内容字体正向显示 */
.marker::after {
  content: attr(data-id);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: rotate(45deg) translate(-50%, -50%);
  color: #fff;
}

/* 类型样式 */
.marker-type1 {
  background-color: #409EFF;
  /* 蓝色 */
}

.marker-type2 {
  background-color: #67C23A;
  /* 绿色 */
}

.marker-type3 {
  background-color: #E6A23C;
  /* 橙色 */
}
</style>