// utils/useBatchMarker.ts

interface BatchMarkerOptions<T> {
    data: T[];
    getPosition: (item: T) => [number, number];
    getContent: (item: T) => string;
    batchSize?: number;
    interval?: number;
    optimizeByBounds?: boolean;
}

interface BatchMarkerController {
    start: () => void;
    clear: () => void;
}

export function useBatchMarker<T>(
    map: AMap.Map,
    options: BatchMarkerOptions<T>
): BatchMarkerController {
    const {
        data,
        getPosition,
        getContent,
        batchSize = 500,
        interval = 100,
        optimizeByBounds = false,
    } = options;

    let markers: AMap.Marker[] = [];
    let currentBatch = 0;
    const total = Math.ceil(data.length / batchSize);
    let isCancelled = false;

    const isInBounds = (lnglat: [number, number]): boolean => {
        console.log(lnglat, 'lnglat');

        if (!optimizeByBounds) return true;
        const bounds = map.getBounds();
        return bounds.contains(new AMap.LngLat(lnglat[0], lnglat[1]));
    };

    const addBatch = (): void => {
        if (isCancelled || currentBatch >= total) return;

        const start = currentBatch * batchSize;
        const end = Math.min(start + batchSize, data.length);
        const batch = data.slice(start, end);

        const batchMarkers = batch.map(item => {
            const pos = getPosition(item);
            if (!isInBounds(pos)) return null;

            const marker = new AMap.Marker({
                position: pos,
                icon: "//vdata.amap.com/icons/b18/1/2.png", //添加 icon 图标 URL
                title: "北京",
                offset: new AMap.Pixel(-10, -10),
            });

            marker.setMap(map);
            return marker;
        }).filter(Boolean) as AMap.Marker[];

        markers.push(...batchMarkers);
        currentBatch++;

        if (currentBatch < total) {
            setTimeout(addBatch, interval);
        }
    };
    const renderVisible = (): void => {
        if (!optimizeByBounds) return;
        clear();
        currentBatch = 0;
        isCancelled = false;
        addBatch();
    };
    const start = (): void => {
        isCancelled = false;
        currentBatch = 0;
        addBatch();
        if (optimizeByBounds) {
            map.on('zoomend', renderVisible);
            map.on('moveend', renderVisible);
        }
    };

    const clear = (): void => {
        isCancelled = true;
        markers.forEach(marker => marker.setMap(null));
        markers = [];
    };

    return { start, clear };
}
