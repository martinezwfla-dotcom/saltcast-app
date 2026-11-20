import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { getSpot } from '@/data/spots';
import { fetchForecast, type Forecast, type Water } from '@/lib/forecast';

/** Forecasts are reused for 30 minutes before fetching again. */
const MaxAge = 30 * 60 * 1000;

/** `offline` is set when the forecast shown is the last one saved on the phone because a fresh one couldn't load. */
type Entry = { forecast?: Forecast; loading: boolean; error?: string; offline?: boolean };

/** The last forecast for each spot is saved on the phone, so it still shows with no signal on the water. */
const CacheKey = (key: string) => `forecast:${key}`;
const CacheMaxAge = 3 * 24 * 3600 * 1000;

async function readCache(key: string): Promise<Forecast | undefined> {
  try {
    const raw = await AsyncStorage.getItem(CacheKey(key));
    if (!raw) return undefined;
    const f = JSON.parse(raw) as Forecast;
    return f && Array.isArray(f.hours) && Date.now() - f.fetchedAt < CacheMaxAge ? f : undefined;
  } catch {
    return undefined;
  }
}

/** A small shared store, so every tab showing the same spot shares one forecast. */
const entries = new Map<string, Entry>();
const listeners = new Set<() => void>();
const Empty: Entry = { loading: false };

function update(spotId: string, patch: Partial<Entry>) {
  entries.set(spotId, { ...(entries.get(spotId) ?? Empty), ...patch });
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function load(key: string, force = false) {
  const [spotId, water] = key.split('|') as [string, Water];
  const entry = entries.get(key) ?? Empty;
  if (entry.loading) return;
  if (!force && entry.forecast && Date.now() - entry.forecast.fetchedAt < MaxAge) return;

  update(key, { loading: true, error: undefined });
  // Show the saved forecast straight away while the fresh one loads.
  if (!entry.forecast) {
    const saved = await readCache(key);
    if (saved && !entries.get(key)?.forecast) update(key, { forecast: saved, offline: true });
  }
  try {
    const forecast = await fetchForecast(getSpot(spotId), water);
    update(key, { forecast, loading: false, offline: false });
    AsyncStorage.setItem(CacheKey(key), JSON.stringify(forecast)).catch(() => {});
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not load the forecast';
    const kept = entries.get(key)?.forecast;
    update(key, { loading: false, error: message, offline: !!kept });
  }
}

/** The forecast for a spot and water (inshore, nearshore or offshore). */
export function useForecast(spotId: string, water: Water = 'near') {
  const key = `${spotId}|${water}`;
  const entry = useSyncExternalStore(subscribe, () => entries.get(key) ?? Empty);

  useEffect(() => {
    load(key);
    // Refresh when the app comes back to the foreground.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') load(key);
    });
    return () => sub.remove();
  }, [key]);

  const refresh = useCallback(() => load(key, true), [key]);

  return { ...entry, refresh };
}
