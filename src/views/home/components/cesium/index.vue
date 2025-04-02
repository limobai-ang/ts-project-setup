<template>
  <div id="cesiumContainer" style="height: 100%; width: 100%;">
  </div>

</template>

<script setup lang="ts">
// The URL on your server where CesiumJS's static files are hosted.
// Extend the Window interface to include CESIUM_BASE_URL
declare global {
  interface Window {
    CESIUM_BASE_URL: string;
  }
}

window.CESIUM_BASE_URL = '/';

import { Cartesian3, createOsmBuildingsAsync, Ion, Math as CesiumMath, Terrain, Viewer, ProviderViewModel, UrlTemplateImageryProvider } from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";
import { onMounted } from 'vue';

Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5NDc0N2ZiZS1mYTdiLTQ1MjMtOTkwMC05YjM5NTNhMGYwY2UiLCJpZCI6Mjg4NzU0LCJpYXQiOjE3NDMxNzMyMTJ9.UnM0lq5EOVnKkJ-_jKohmy2gt08_08ZIP-G2rynM424';

// 高德影像图层
const gaodeSatellite = new ProviderViewModel({
  name: '高德影像',
  iconUrl: 'https://cesium.com/learn/cesiumjs/ref-docs/images/imageryProviders/gaode.png',
  tooltip: '高德影像地图',
  creationFunction: () => new UrlTemplateImageryProvider({
    url: 'https://webst01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=6&x={x}&y={y}&z={z}',
    credit: '高德影像'
  })
});
// 高德矢量图层
const gaodeVector = new ProviderViewModel({
  name: '高德矢量',
  iconUrl: 'https://cesium.com/learn/cesiumjs/ref-docs/images/imageryProviders/gaode.png',
  tooltip: '高德矢量地图',
  creationFunction: () => new UrlTemplateImageryProvider({
    url: 'https://webst01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}',
    credit: '高德矢量'
  })
});


// 初始化cesium
const initCesium = async () => {
  // Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
const viewer = new Viewer('cesiumContainer', {
  imageryProviderViewModels: [gaodeSatellite, gaodeVector], // 添加高德地图选项
  selectedImageryProviderViewModel: gaodeVector, // 默认显示矢量地图
  baseLayerPicker: true, // 启用底图选择器
  infoBox: false, // 是否显示信息框
  selectionIndicator: false, // 是否显示选中指示器
  sceneModePicker: false, // 是否显示场景模式选择器
  navigationHelpButton: false, // 是否显示导航帮助按钮
  geocoder: false, // 是否显示地理编码器
  homeButton: false, // 是否显示主页按钮
  animation: false, // 是否显示动画控件
  timeline: false, // 是否显示时间轴
  
  terrain: Terrain.fromWorldTerrain(), // 使用全球地形


}); 

// 去掉图标
(viewer.cesiumWidget.creditContainer as HTMLElement).style.display = 'none';


// 用于让相机平滑地飞到指定的位置和角度
viewer.camera.flyTo({
  // 设置相机要飞往的地理坐标点（经度、纬度、高度）。
  destination: Cartesian3.fromDegrees(115.05, 31.22, 10000000),
  // 控制相机的方向，包括 航向（heading）、俯仰角（pitch）、翻滚角（roll）。
  orientation: {
    heading: CesiumMath.toRadians(0.0),
    pitch: CesiumMath.toRadians(-90.0),

  }
});

// Add Cesium OSM Buildings, a global 3D buildings layer.
const buildingTileset = await createOsmBuildingsAsync();
viewer.scene.primitives.add(buildingTileset);   
};

// 元素渲染完成后执行
onMounted (() => {
  initCesium();
});
</script>

<style scoped>

</style>