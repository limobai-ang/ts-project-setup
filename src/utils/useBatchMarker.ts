// utils/useBatchMarker.ts
import { ClusterItem, clusterPoints } from './clusterPoints';

export interface BatchMarkerOptions<T> {
    enableCluster?: boolean;
    renderClusterMarker?: (items: T[]) => string;
    clusterZoomFactor?: number;
    slice?: boolean;
    onCompleted?: () => void;
    events?: Partial<Record<string, (item: T | ClusterItem<T>, marker: AMap.Marker) => void>>;
    data: T[];
    getPosition: (item: T) => [number, number];
    renderMarker: (item: T) => string;
    batchSize?: number;
    interval?: number;
    optimizeByBounds?: boolean;
    smartDiffRender?: boolean;
    getId?: (item: T) => number | string;
    compareContent?: (oldContent: string, newContent: string) => boolean;
}

export interface BatchMarkerController<T = any> {
    getMarkers: () => AMap.Marker[];
    start: () => void;
    clear: () => void;
    update: (itemOrItems: T | T[]) => void;
}

export function isInBounds(map: AMap.Map, lnglat: [number, number]): boolean {
    const bounds = map.getBounds();
    return bounds.contains(new AMap.LngLat(lnglat[0], lnglat[1]));
}

export function projectToPixelFactory(map: AMap.Map) {
    return (lnglat: [number, number]) => {
        const lngLatObj = new AMap.LngLat(lnglat[0], lnglat[1]);
        const pixel = map.lngLatToContainer(lngLatObj);
        return { x: pixel.getX(), y: pixel.getY() };
    };
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

export function useBatchMarker<T extends Record<string, any>>(
    map: AMap.Map,
    options: BatchMarkerOptions<T>
): BatchMarkerController {
    const {
        data,
        getPosition,
        renderMarker,
        batchSize = 50,
        interval = 100,
        optimizeByBounds = false,
        smartDiffRender = true,
        getId = (item: T) => item.id,
        compareContent = (oldContent, newContent) => oldContent === newContent,
        enableCluster = false,
        renderClusterMarker = (items) => `<div class="marker">ID</div>`
    } = options;

    const markerMap = new Map<string, AMap.Marker>();
    let isCancelled = false;

    const update = (itemOrItems: T | T[]): void => {
        const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];

        items.forEach(item => {
            const id = String(getId(item));
            const pos = getPosition(item);
            const content = renderMarker(item);
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
                const id = String(getId(item));
                const newContent = renderMarker(item);
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

        const visibleIds = new Set<string>();
        const projectToPixel = projectToPixelFactory(map);
        const visibleItems = data.filter(item => {
            const pos = getPosition(item);
            const id = String(getId(item));
            if (isInBounds(map, pos)) {
                if (!enableCluster) visibleIds.add(id);
                return true;
            }
            return false;
        });

        const clusteredList: ClusterItem<T>[] = clusterPoints(
            visibleItems,
            getPosition,
            60,
            projectToPixel
        );

        function renderClusterItems(clusters: ClusterItem<T>[]): void {
            clusters.forEach(cluster => {
                const id = cluster.id;
                const marker = new AMap.Marker({
                    position: cluster.options.center,
                    content: cluster.type === 'cluster'
                        ? renderClusterMarker(cluster.children)
                        : renderMarker(cluster.children[0]),
                    offset: new AMap.Pixel(-10, -10),
                });

                if (options.events) {
                    Object.entries(options.events).forEach(([event, handler]) => {
                        if (handler) marker.on(event, () => handler(cluster as any, marker));
                    });
                }
                visibleIds.add(cluster.id)
                marker.setMap(map);
                markerMap.set(id, marker);
            });
        }
        if (enableCluster) {
            // 清空并删除
            markerMap.forEach((marker) => marker.setMap(null));
            markerMap.clear();
            renderClusterItems(clusteredList);
        } else {
            const size = options.slice ? batchSize : visibleItems.length;
            runBatches(visibleItems, size, interval, () => isCancelled, processItems, options.onCompleted);
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

    const start = (): void => {
        isCancelled = false;
        if (optimizeByBounds) {
            map.on('zoomend', renderVisible);
            // map.on('moveend', renderVisible);
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
