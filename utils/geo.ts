const EARTH_RADIUS_METERS = 6371000;

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export function getDistanceMeters(from: Coordinate, to: Coordinate) {
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c);
}

export function formatDistance(meters: number) {
  if (meters < 1000) {
    return `${meters} m`;
  }

  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
