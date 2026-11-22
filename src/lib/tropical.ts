import { useEffect, useMemo, useState } from 'react';

import type { Spot } from '@/data/spots';

/**
 * National Weather Service tropical alerts at a spot, the same rule as the website (tropics/trop.js):
 * a hurricane, tropical storm, storm surge or extreme wind WARNING makes every hour it covers No Go,
 * and a WATCH caps those hours at Not ideal.
 */
export type TropicalAlert = { event: string; level: 'warn' | 'watch'; until: number };

const Warnings = ['Hurricane Warning', 'Tropical Storm Warning', 'Storm Surge Warning', 'Extreme Wind Warning'];
const Watches = ['Hurricane Watch', 'Tropical Storm Watch', 'Storm Surge Watch'];
/** NWS reissues these every few hours. With no end time, hold one for 36 hours. */
const Hold = 36 * 3600 * 1000;
const Refresh = 30 * 60 * 1000;
const NoAlerts: TropicalAlert[] = [];

const cache = new Map<string, { at: number; alerts: TropicalAlert[] }>();
const key = (spot: Pick<Spot, 'lat' | 'lon'>) => `${spot.lat.toFixed(2)},${spot.lon.toFixed(2)}`;

/** The tropical alert in force at this spot at `time` (ms), or undefined. Reads what useTropical attached. */
export function tropicalAt(spot: Pick<Spot, 'tropical'>, time: number): TropicalAlert | undefined {
  return spot.tropical?.find((a) => time <= a.until);
}

type NwsAlerts = { features?: { properties?: { event?: string; ends?: string | null; expires?: string | null } }[] };

async function load(spot: Pick<Spot, 'lat' | 'lon'>): Promise<boolean> {
  const k = key(spot);
  const old = cache.get(k);
  if (old && Date.now() - old.at < Refresh) return false;
  try {
    const res = await fetch(`https://api.weather.gov/alerts/active?point=${spot.lat.toFixed(3)},${spot.lon.toFixed(3)}`, {
      headers: { Accept: 'application/geo+json', 'User-Agent': 'SaltcastFlorida app (saltcastflorida.com)' },
    });
    if (!res.ok) return false;
    const json = (await res.json()) as NwsAlerts;
    const seen = new Set<string>();
    const alerts: TropicalAlert[] = [];
    for (const f of json.features ?? []) {
      const p = f.properties ?? {};
      const event = p.event ?? '';
      const level = Warnings.includes(event) ? 'warn' : Watches.includes(event) ? 'watch' : undefined;
      if (!level || seen.has(event)) continue;
      seen.add(event);
      const end = Date.parse(p.ends ?? p.expires ?? '');
      alerts.push({ event, level, until: Number.isNaN(end) ? Date.now() + Hold : Math.max(end, Date.now() + 3 * 3600 * 1000) });
    }
    alerts.sort((a, b) => (a.level === b.level ? 0 : a.level === 'warn' ? -1 : 1));
    cache.set(k, { at: Date.now(), alerts });
    return alerts.length > 0 || (old?.alerts.length ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Loads NWS tropical alerts for the spot and returns the spot with them attached (a new object when
 * they change, so every rating made from it is redone), plus the alert in force at `now`.
 */
export function useTropical<S extends Spot>(spot: S, now: number): { spot: S; now?: TropicalAlert } {
  const { lat, lon } = spot;
  const [alerts, setAlerts] = useState<{ key: string; list: TropicalAlert[] }>();
  useEffect(() => {
    let live = true;
    const run = () =>
      load({ lat, lon }).then(() => {
        const k = key({ lat, lon });
        if (live) setAlerts({ key: k, list: cache.get(k)?.alerts ?? [] });
      });
    run();
    const id = setInterval(run, Refresh);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, [lat, lon]);
  const list = alerts && alerts.key === key({ lat, lon }) ? alerts.list : NoAlerts;
  const withAlerts = useMemo(() => (list.length ? { ...spot, tropical: list } : spot), [spot, list]);
  return { spot: withAlerts, now: list.find((a) => now <= a.until) };
}
