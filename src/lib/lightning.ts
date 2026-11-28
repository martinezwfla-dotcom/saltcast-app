import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import type { Spot } from '@/data/spots';

/** Red banner within this many miles, yellow within WATCH (last 15 minutes). Same as the website's radar. */
export const Near = 10;
export const Watch = 30;

type Flash = [lat: number, lon: number, time: number];
export type LightningNear = { count: number; miles: number; last: number; minutesAgo: number; level: 'near' | 'watch' };

function miles(a1: number, o1: number, a2: number, o2: number) {
  const r = Math.PI / 180;
  const da = (a2 - a1) * r;
  const dd = (o2 - o1) * r;
  const h = Math.sin(da / 2) ** 2 + Math.cos(a1 * r) * Math.cos(a2 * r) * Math.sin(dd / 2) ** 2;
  return 7917.6 * Math.asin(Math.sqrt(h));
}

/** Strikes within 30 miles of the spot in the last 15 minutes, or undefined when there are none. */
export function lightningNear(spot: Spot, flashes: Flash[], now: number): LightningNear | undefined {
  let count = 0;
  let best = Infinity;
  let last = 0;
  for (const [lat, lon, t] of flashes) {
    if (now - t > 15 * 60_000) continue;
    const d = miles(spot.lat, spot.lon, lat, lon);
    if (d > Watch) continue;
    count++;
    best = Math.min(best, d);
    last = Math.max(last, t);
  }
  return count ? { count, miles: best, last, minutesAgo: Math.max(1, Math.round((now - last) / 60_000)), level: Math.round(best) <= Near ? 'near' : 'watch' } : undefined;
}

/**
 * NOAA GOES-East lightning over Florida (last 30 minutes) from saltcastflorida.com/api/lightning,
 * which the website's server refreshes every 2 minutes. Checked every 2 minutes while the app is open.
 */
export function useLightning(spot: Spot) {
  const [flashes, setFlashes] = useState<Flash[]>([]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let live = true;
    const load = () =>
      fetch('https://saltcastflorida.com/api/lightning', { cache: 'no-cache' })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((j: { flashes?: Flash[] }) => {
          if (!live) return;
          setFlashes(Array.isArray(j.flashes) ? j.flashes : []);
          setNow(Date.now());
        })
        .catch(() => {});
    load();
    const timer = setInterval(() => AppState.currentState === 'active' && load(), 2 * 60_000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && load());
    return () => {
      live = false;
      clearInterval(timer);
      sub.remove();
    };
  }, []);
  return lightningNear(spot, flashes, now);
}
