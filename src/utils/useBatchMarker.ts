// utils/useBatchMarker.ts

interface BatchMarkerOptions<T> {
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
    start: () => void;
    clear: () => void;
    update: (itemOrItems: T | T[]) => void;
}

export function isInBounds(map: AMap.Map, lnglat: [number, number]): boolean {
    const bounds = map.getBounds();
    return bounds.contains(new AMap.LngLat(lnglat[0], lnglat[1]));
}

export function setMarkerEvents(marker: AMap.Marker, item: any, events: Partial<Record<string, (item: any, marker: AMap.Marker) => void>>): void {
    Object.entries(events).forEach(([event, handler]) => {
        if (handler) marker.on(event, () => handler(item, marker));
    });
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

    const renderVisible = (): void => {
        if (!optimizeByBounds) return;

        const visibleIds = new Set<number | string>();

        data.forEach(item => {
            const pos = getPosition(item);
            const id = getId(item);
            if (!optimizeByBounds || isInBounds(map, pos)) {
                visibleIds.add(id);
                const newContent = getContent(item);
                const existing = markerMap.get(id);

                if (!existing) {
                    const marker = new AMap.Marker({
                        position: pos,
                        content: newContent,
                        offset: new AMap.Pixel(-10, -10),
                    });
                    if (options.events) {
                        setMarkerEvents(
                            marker,
                            item,
                            options.events
                        );
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

        if (smartDiffRender) {
            for (const [id, marker] of markerMap.entries()) {
                if (!visibleIds.has(id)) {
                    marker.setMap(null);
                    markerMap.delete(id);
                }
            }
        } else {
            clear();
            data.forEach(item => {
                const pos = getPosition(item);
                if (!optimizeByBounds || isInBounds(map, pos)) {
                    const id = getId(item);
                    const marker = new AMap.Marker({
                        position: pos,
                        content: getContent(item),
                        offset: new AMap.Pixel(-10, -10),
                    });
                    marker.setMap(map);
                    markerMap.set(id, marker);
                }
            });
        }
    };

    const addBatch = (): void => {
        const total = Math.ceil(data.length / batchSize);
        let currentBatch = 0;

        const process = () => {
            if (isCancelled || currentBatch >= total) return;

            const start = currentBatch * batchSize;
            const end = Math.min(start + batchSize, data.length);
            const batch = data.slice(start, end);

            batch.forEach(item => {
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
                            setMarkerEvents(
                                marker,
                                item,
                                options.events
                            );
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

            currentBatch++;
            if (currentBatch < total) {
                setTimeout(process, interval);
            }
        };

        process();
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

    return { start, clear, update };
}
