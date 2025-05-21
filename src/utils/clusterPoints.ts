type LatLng = [number, number];

export interface ClusterItem<T> {
    id: string;
    type: 'cluster' | 'point';
    options: {
        center: [number, number];
        count: number;
    };
    children: T[];
}

export function clusterPoints<T>(
    items: T[],
    getPosition: (item: T) => [number, number],
    gridSize: number,
    projectToPixel: (lnglat: [number, number]) => { x: number; y: number }
): ClusterItem<T>[] {
    const gridMap = new Map<string, T[]>();

    for (const item of items) {
        const [lng, lat] = getPosition(item);
        const { x, y } = projectToPixel([lng, lat]);

        const gridX = Math.floor(x / gridSize);
        const gridY = Math.floor(y / gridSize);
        const key = `${gridX}_${gridY}`;

        if (!gridMap.has(key)) {
            gridMap.set(key, []);
        }
        gridMap.get(key)!.push(item);
    }

    const clusters: ClusterItem<T>[] = [];

    for (const group of gridMap.values()) {
        const positions = group.map(getPosition);
        const count = group.length;

        const center: LatLng = [
            positions.reduce((sum, p) => sum + p[0], 0) / count,
            positions.reduce((sum, p) => sum + p[1], 0) / count,
        ];

        const ids = group.map(item => item.id).join('-');

        const cluster: ClusterItem<T> = {
            id: ids,
            options: {
                center,
                count,
            },
            children: group,
            type: count === 1 ? 'point' : 'cluster',
        };

        clusters.push(cluster);
    }

    return clusters;
}