import * as Location from 'expo-location';

import { makeCustomSpot, Spots, type Spot } from '@/data/spots';

const milesBetween = (a: number, b: number, c: number, d: number) => {
  const t = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(t(c - a) / 2) ** 2 + Math.cos(t(a)) * Math.cos(t(c)) * Math.sin(t(d - b) / 2) ** 2;
  return 2 * 3959 * Math.asin(Math.sqrt(h));
};

export type NearMe =
  | { ok: true; spot: Spot; custom: boolean; miles: number; nearest: Spot }
  | { ok: false; reason: 'denied' | 'unavailable' };

/**
 * Finds the spot closest to the phone. Within 25 miles of a Saltcast spot, that spot is used;
 * farther away in Florida, a "Near you" place is made at the phone's position. The position
 * is only used on the phone and is not saved or sent anywhere except the forecast lookup.
 */
export async function findNearMe(): Promise<NearMe> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return { ok: false, reason: 'denied' };
    const pos =
      (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 })) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    const { latitude, longitude } = pos.coords;
    let nearest = Spots[0];
    let miles = Infinity;
    for (const s of Spots) {
      const d = milesBetween(latitude, longitude, s.lat, s.lon);
      if (d < miles) {
        miles = d;
        nearest = s;
      }
    }
    const inFlorida = latitude > 24 && latitude < 31.2 && longitude > -87.8 && longitude < -79.8;
    if (miles <= 25 || !inFlorida) return { ok: true, spot: nearest, custom: false, miles, nearest };
    const spot = makeCustomSpot({
      id: 0,
      name: 'Near you',
      latitude: +latitude.toFixed(3),
      longitude: +longitude.toFixed(3),
    });
    return { ok: true, spot, custom: true, miles, nearest };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
