import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { getSpot } from '@/data/spots';
import { fetchForecast, type Forecast } from '@/lib/forecast';

/** Forecasts are reused for 30 minutes before fetching again. */
const MaxAge = 30 * 60 * 1000;

type Entry = { forecast?: Forecast; loading: boolean; error?: string };

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

async function load(spotId: string, force = false) {
  const entry = entries.get(spotId) ?? Empty;
  if (entry.loading) return;
  if (!force && entry.forecast && Date.now() - entry.forecast.fetchedAt < MaxAge) return;

  update(spotId, { loading: true, error: undefined });
  try {
    const forecast = await fetchForecast(getSpot(spotId));
    update(spotId, { forecast, loading: false });
  } catch (e) {
    update(spotId, { loading: false, error: e instanceof Error ? e.message : 'Could not load the forecast' });
  }
}

export function useForecast(spotId: string) {
  const entry = useSyncExternalStore(subscribe, () => entries.get(spotId) ?? Empty);

  useEffect(() => {
    load(spotId);
    // Refresh when the app comes back to the foreground.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') load(spotId);
    });
    return () => sub.remove();
  }, [spotId]);

  const refresh = useCallback(() => load(spotId, true), [spotId]);

  return { ...entry, refresh };
}
