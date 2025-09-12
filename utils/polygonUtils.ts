export function isPointInPolygon(
  point: { latitude: number; longitude: number },
  polygon: Array<{ latitude: number; longitude: number }>
): boolean {
  const { latitude: x, longitude: y } = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const { latitude: xi, longitude: yi } = polygon[i];
    const { latitude: xj, longitude: yj } = polygon[j];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

export function findPolygonsContainingPoint(
  point: { latitude: number; longitude: number },
  polygons: Array<{
    id: string;
    points: Array<{ latitude: number; longitude: number }>;
    name: string;
    color: string;
  }>
): Array<{ id: string; name: string; color: string }> {
  return polygons
    .filter(polygon => polygon.points.length >= 3 && isPointInPolygon(point, polygon.points))
    .map(polygon => ({
      id: polygon.id,
      name: polygon.name,
      color: polygon.color,
    }));
}