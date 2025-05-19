// utils/mockMarkerList.ts
interface MockMarker {
  id: number;
  lng: number;
  lat: number;
  type: string;
  label: string;
}

export function getMockMarkerList(count: number = 10000): MockMarker[] {
  const typeList = Array.from({ length: 10 }, (_, i) => `type-${i + 1}`);
  const result: MockMarker[] = [];

  // 北京经纬度范围（大致）
  const minLng = 115.7;
  const maxLng = 117.4;
  const minLat = 39.4;
  const maxLat = 41.1;

  for (let i = 0; i < count; i++) {
    const lng = +(Math.random() * (maxLng - minLng) + minLng).toFixed(6);
    const lat = +(Math.random() * (maxLat - minLat) + minLat).toFixed(6);
    const type = typeList[Math.floor(Math.random() * typeList.length)];

    result.push({
      id: i + 1,
      lng,
      lat,
      type,
      label: `点位 ${i + 1}`
    });
  }

  return result;
}