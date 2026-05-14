export interface ClusterableItem {
  id: string;
  lat: number;
  lng: number;
}

export interface Cluster<T extends ClusterableItem> {
  key: string;
  lat: number;
  lng: number;
  items: T[];
}

const CLUSTER_PRECISION = 1000; // 3 decimal places (~111m at equator)

function isFiniteCoord(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/**
 * Group items by rounding lat/lng to 3 decimals. Items with non-finite
 * coordinates are skipped (defensive against NaN/undefined from DB nulls).
 */
export function clusterItems<T extends ClusterableItem>(items: T[]): Cluster<T>[] {
  const clusterMap = new globalThis.Map<string, Cluster<T>>();

  for (const item of items) {
    if (!isFiniteCoord(item.lat) || !isFiniteCoord(item.lng)) continue;

    const roundedLat = Math.round(item.lat * CLUSTER_PRECISION) / CLUSTER_PRECISION;
    const roundedLng = Math.round(item.lng * CLUSTER_PRECISION) / CLUSTER_PRECISION;
    const key = `${roundedLat},${roundedLng}`;

    const existing = clusterMap.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      clusterMap.set(key, { key, lat: roundedLat, lng: roundedLng, items: [item] });
    }
  }

  return Array.from(clusterMap.values());
}
