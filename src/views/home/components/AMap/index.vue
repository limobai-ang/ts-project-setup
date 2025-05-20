<template>
    <div id="container"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import AMapLoader from "@amap/amap-jsapi-loader";
import { useBatchMarker } from '@/utils/useBatchMarker';
import { getMockMarkerList } from '@/views/home/components/AMap/mockMarkerList';
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
        zoom: 15, // 初始化地图级别
        center: [116.397428, 39.90923], // 初始化地图中心点位置
    });


    initAMap();
}


const initAMap = () => {
    const markerList = getMockMarkerList(10000);

    const { start, clear, update, getMarkers } = useBatchMarker(map, {
        data: markerList,
        getPosition: item => [item.lng, item.lat],
        getContent: item => `<div class="marker marker-${item.type}">${item.label}</div>`,
        batchSize: 500,
        interval: 100,
        optimizeByBounds: true,
        events: {
            click: item => {
                console.log(item)
            }
        },
        enableCluster: true,
        clusterZoomFactor: 0.1,
        getClusterContent(items) {
            console.log(items, 'items');
            
            return `<div class="marker">ID</div>`
        },
        onCompleted() {
            console.log('点位渲染完成onCompleted');
        }
    });

    start();

    map.on('moveend', () => {
        const markers = getMarkers()
        console.log(markers, 'markers');

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