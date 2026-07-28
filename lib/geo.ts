export interface TrackStats {
  distanceM: number;
  elevationGainM: number | null;
  elevationLossM: number | null;
}

function haversineMeters(
  [lng1, lat1]: [number, number],
  [lng2, lat2]: [number, number]
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Coordinates as [lng, lat, elevation?] tuples, GeoJSON order. */
export function computeTrackStats(coords: number[][]): TrackStats {
  let distanceM = 0;
  let gain = 0;
  let loss = 0;
  let hasElevation = false;

  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    distanceM += haversineMeters([prev[0], prev[1]], [curr[0], curr[1]]);

    if (prev.length > 2 && curr.length > 2) {
      hasElevation = true;
      const diff = curr[2] - prev[2];
      if (diff > 0) gain += diff;
      else loss += -diff;
    }
  }

  return {
    distanceM: Math.round(distanceM),
    elevationGainM: hasElevation ? Math.round(gain) : null,
    elevationLossM: hasElevation ? Math.round(loss) : null,
  };
}

export function formatDistance(m: number | null): string {
  if (m == null) return "-";
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

export function formatElevation(m: number | null): string {
  if (m == null) return "-";
  return `${Math.round(m)} m`;
}

export function formatDuration(minutes: number | null): string {
  if (minutes == null) return "-";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}
