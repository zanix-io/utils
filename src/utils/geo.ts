/**
 * A geographic point expressed as decimal-degree latitude/longitude.
 *
 * @category helpers
 */
export interface GeoCoordinate {
  /**
   * Latitude in decimal degrees (positive north, negative south).
   */
  latitude: number

  /**
   * Longitude in decimal degrees (positive east, negative west).
   */
  longitude: number
}

/**
 * The mean radius of the Earth, in kilometers, used by {@linkcode haversineDistanceKm}.
 *
 * @category helpers
 */
export const EARTH_RADIUS_KM = 6371

/**
 * Computes the great-circle distance between two points on Earth using the haversine formula.
 *
 * Pure and deterministic: no I/O, no side effects, and the result never depends on anything
 * other than `a` and `b`. Swapping the two arguments returns the same distance.
 *
 * The formula treats the Earth as a perfect sphere ({@linkcode EARTH_RADIUS_KM}), so the result
 * is an approximation — accurate enough for a proximity/ranking signal, not for
 * surveying-grade distance.
 *
 * @param a - The first point.
 * @param b - The second point.
 * @returns The distance between `a` and `b`, in kilometers. `0` when both points are the same.
 *
 * @example
 * ```ts
 * haversineDistanceKm(
 *   { latitude: 19.4326, longitude: -99.1332 }, // Mexico City
 *   { latitude: 40.7128, longitude: -74.0060 }, // New York City
 * )
 * ```
 *
 * @category helpers
 */
export function haversineDistanceKm(a: GeoCoordinate, b: GeoCoordinate): number {
  const toRadians = (degrees: number): number => (degrees * Math.PI) / 180

  const deltaLatitude = toRadians(b.latitude - a.latitude)
  const deltaLongitude = toRadians(b.longitude - a.longitude)

  const latitudeA = toRadians(a.latitude)
  const latitudeB = toRadians(b.latitude)

  const haversine = Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(deltaLongitude / 2) ** 2

  const centralAngle = 2 * Math.asin(Math.sqrt(haversine))

  return EARTH_RADIUS_KM * centralAngle
}
