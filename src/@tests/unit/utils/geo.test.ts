import { assertAlmostEquals, assertEquals } from '@std/assert'
import { EARTH_RADIUS_KM, haversineDistanceKm } from 'utils/geo.ts'

Deno.test('haversineDistanceKm: same point returns 0', () => {
  const point = { latitude: 19.4326, longitude: -99.1332 }

  assertEquals(haversineDistanceKm(point, point), 0)
})

Deno.test('haversineDistanceKm: two distinct points with identical coordinates return 0', () => {
  assertEquals(
    haversineDistanceKm(
      { latitude: 40.7128, longitude: -74.006 },
      { latitude: 40.7128, longitude: -74.006 },
    ),
    0,
  )
})

Deno.test('haversineDistanceKm: Mexico City to New York City is approximately 3364 km', () => {
  const mexicoCity = { latitude: 19.4326, longitude: -99.1332 }
  const newYorkCity = { latitude: 40.7128, longitude: -74.006 }

  // Known real-world great-circle distance is ~3364 km; allow a small tolerance for the
  // spherical-Earth approximation.
  assertAlmostEquals(haversineDistanceKm(mexicoCity, newYorkCity), 3364, 10)
})

Deno.test('haversineDistanceKm: London to Paris is approximately 344 km', () => {
  const london = { latitude: 51.5074, longitude: -0.1278 }
  const paris = { latitude: 48.8566, longitude: 2.3522 }

  assertAlmostEquals(haversineDistanceKm(london, paris), 344, 5)
})

Deno.test('haversineDistanceKm: symmetric — swapping arguments returns the same distance', () => {
  const a = { latitude: 19.4326, longitude: -99.1332 }
  const b = { latitude: 40.7128, longitude: -74.006 }

  assertEquals(haversineDistanceKm(a, b), haversineDistanceKm(b, a))
})

Deno.test('haversineDistanceKm: EARTH_RADIUS_KM is exported and used as the sphere radius', () => {
  // Two antipodal-ish points on the equator, a quarter of the way around, should be
  // (pi/2) * radius apart.
  const a = { latitude: 0, longitude: 0 }
  const b = { latitude: 0, longitude: 90 }

  assertAlmostEquals(haversineDistanceKm(a, b), (Math.PI / 2) * EARTH_RADIUS_KM, 0.001)
})
