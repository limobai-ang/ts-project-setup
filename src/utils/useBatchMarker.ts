// utils/useBatchMarker.ts

interface BatchMarkerOptions<T> {
    // 聚合配置
    enableCluster?: boolean; // 是否启用聚合展示
    getClusterContent?: (items: T[]) => string; // 聚合点展示的内容方法
    clusterZoomFactor?: number; // 根据缩放级别控制聚合力度（0-1）
    slice?: boolean; // 是否启用切片渲染策略，默认 true
    onCompleted?: () => void; // 切片渲染完成后的回调
    events?: Partial<Record<string, (item: T, marker: AMap.Marker) => void>>;
    data: T[];
    getPosition: (item: T) => [number, number];
    getContent: (item: T) => string;
    batchSize?: number;
    interval?: number;
    optimizeByBounds?: boolean;
    smartDiffRender?: boolean; // 是否启用差异更新渲染，默认 true
    getId?: (item: T) => number | string; // 默认使用 item.id
    compareContent?: (oldContent: string, newContent: string) => boolean; // 可选：内容是否变化判断函数
}

interface BatchMarkerController<T = any> {
    getMarkers: () => AMap.Marker[];
    start: () => void;
    clear: () => void;
    update: (itemOrItems: T | T[]) => void;
}

export function isInBounds(map: AMap.Map, lnglat: [number, number]): boolean {
    const bounds = map.getBounds();
    return bounds.contains(new AMap.LngLat(lnglat[0], lnglat[1]));
}

function runBatches<T>(items: T[], batchSize: number, interval: number, isCancelled: () => boolean, callback: (batch: T[]) => void, onComplete?: () => void) {
    const total = Math.ceil(items.length / batchSize);
    let currentBatch = 0;

    const process = () => {
        if (isCancelled() || currentBatch >= total) {
            if (onComplete) onComplete();
            return;
        }

        const start = currentBatch * batchSize;
        const end = Math.min(start + batchSize, items.length);
        const batch = items.slice(start, end);

        callback(batch);

        currentBatch++;
        if (currentBatch < total) {
            setTimeout(process, interval);
        }
    };

    process();
}

function getClusteredData<T>(
    items: T[],
    zoom: number,
    zoomFactor: number,
    getPosition: (item: T) => [number, number],
    getId: (item: T) => number | string
): Array<{
    id: string;
    children: T[];
    position: [number, number];
}> {
    const clusterDistance = 100 * (1 - zoomFactor) * (18 - zoom + 1);
    const clusters: { items: T[]; center: [number, number] }[] = [];

    items.forEach(item => {
        const pos = getPosition(item);
        let cluster = clusters.find(c => {
            const [lng, lat] = c.center;
            const dx = lng - pos[0];
            const dy = lat - pos[1];
            return Math.sqrt(dx * dx + dy * dy) * 11000 < clusterDistance;
        });

        if (cluster) {
            cluster.items.push(item);
            const total = cluster.items.length;
            const newLng = (cluster.center[0] * (total - 1) + pos[0]) / total;
            const newLat = (cluster.center[1] * (total - 1) + pos[1]) / total;
            cluster.center = [newLng, newLat];
        } else {
            clusters.push({ items: [item], center: pos });
        }
    });

    return clusters.map(cluster => {
        const id = cluster.items.map(getId).join('_');
        return {
            id,
            children: cluster.items,
            position: cluster.center
        };
    });
}


function getClusterCenter<T>(items: T[], getPosition: (item: T) => [number, number]): [number, number] {
    const total = items.length;
    const sum = items.reduce(
        (acc, item) => {
            const [lng, lat] = getPosition(item);
            acc[0] += lng;
            acc[1] += lat;
            return acc;
        },
        [0, 0]
    );
    return [sum[0] / total, sum[1] / total];
}
export function useBatchMarker<T extends Record<string, any>>(
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
        smartDiffRender = true,
        getId = (item: T) => item.id,
        compareContent = (oldContent, newContent) => oldContent === newContent,
        clusterZoomFactor = 0.5,
        enableCluster = false
    } = options;

    const markerMap = new Map<number | string, AMap.Marker>();
    let isCancelled = false;

    const update = (itemOrItems: T | T[]): void => {
        const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];

        items.forEach(item => {
            const id = getId(item);
            const pos = getPosition(item);
            const content = getContent(item);
            const existing = markerMap.get(id);

            if (existing) {
                const currentContent = existing.getContent() as string;
                if (!compareContent(currentContent, content)) {
                    existing.setContent(content);
                }
                const oldPos = existing.getPosition();
                if (oldPos?.getLng() !== pos[0] || oldPos?.getLat() !== pos[1]) {
                    existing.setPosition(pos);
                }
            }
        });
    };

    const processItems = (items: T[]): void => {
        items.forEach(item => {
            const pos = getPosition(item);
            if (!optimizeByBounds || isInBounds(map, pos)) {
                const id = getId(item);
                const newContent = getContent(item);
                const existing = markerMap.get(id);

                if (!existing) {
                    const marker = new AMap.Marker({
                        position: pos,
                        content: newContent,
                        offset: new AMap.Pixel(-10, -10),
                    });
                    if (options.events) {
                        Object.entries(options.events).forEach(([event, handler]) => {
                            if (handler) marker.on(event, () => handler(item, marker));
                        });
                    }
                    marker.setMap(map);
                    markerMap.set(id, marker);
                } else {
                    const currentContent = existing.getContent() as string;
                    if (!compareContent(currentContent, newContent)) {
                        existing.setContent(newContent);
                    }
                    const oldPos = existing.getPosition();
                    if (oldPos?.getLng() !== pos[0] || oldPos?.getLat() !== pos[1]) {
                        existing.setPosition(pos);
                    }
                }
            }
        });
    };

    const renderVisible = (): void => {
        if (!optimizeByBounds) return;

        const visibleIds = new Set<number | string>();

        const visibleItems = data.filter(item => {
            const pos = getPosition(item);
            const id = getId(item);
            if (!optimizeByBounds || isInBounds(map, pos)) {
                visibleIds.add(id);
                return true;
            }
            return false;
        });

        const sourceItems = (enableCluster && options.getClusterContent)
            ? getClusteredData(visibleItems, map.getZoom(), clusterZoomFactor, getPosition, getId)
            : visibleItems;

        console.log(sourceItems, 'DsourceItems');

        if (options.slice !== false) {
            runBatches(visibleItems, batchSize, interval, () => isCancelled, processItems, options.onCompleted);
        } else {
            processItems(visibleItems);
            if (options.onCompleted) options.onCompleted();
        }

        if (smartDiffRender) {
            for (const [id, marker] of markerMap.entries()) {
                if (!visibleIds.has(id)) {
                    marker.setMap(null);
                    markerMap.delete(id);
                }
            }
        }
    };

    const addBatch = (): void => {
        if (options.slice !== false) {
            runBatches(data, batchSize, interval, () => isCancelled, processItems, options.onCompleted);
        } else {
            processItems(data);
            if (options.onCompleted) options.onCompleted();
        }
    };

    const start = (): void => {
        isCancelled = false;
        addBatch();
        if (optimizeByBounds) {
            map.on('zoomend', renderVisible);
            map.on('moveend', renderVisible);
        }
    };

    const clear = (): void => {
        isCancelled = true;
        for (const marker of markerMap.values()) {
            marker.setMap(null);
        }
        markerMap.clear();
        if (optimizeByBounds) {
            map.off('zoomend', renderVisible);
            map.off('moveend', renderVisible);
        }
    };

    return { start, clear, update, getMarkers: () => Array.from(markerMap.values()) };
}
