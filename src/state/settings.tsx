import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DefaultActivityId, type ActivityId } from '@/data/activities';
import { DefaultSpotId, setCustomSpots, type Spot } from '@/data/spots';
import type { Units } from '@/lib/format';

type Settings = {
  activityId: ActivityId;
  spotId: string;
  favorites: string[];
  /** Places found with search. Kept while they are favorites or the current spot. */
  customSpots: Spot[];
  units: Units;
};

type SettingsContextValue = Settings & {
  loaded: boolean;
  setActivity: (id: ActivityId) => void;
  setSpot: (id: string) => void;
  toggleFavorite: (id: string) => void;
  /** Saves a searched place and makes it the current spot. */
  addCustomSpot: (spot: Spot) => void;
  setUnits: (units: Units) => void;
};

const StorageKey = 'saltcast.settings.v1';

const Defaults: Settings = {
  activityId: DefaultActivityId,
  spotId: DefaultSpotId,
  favorites: [],
  customSpots: [],
  units: 'imperial',
};

/** Drops searched places that are neither a favorite nor the current spot. */
function prune(s: Settings): Settings {
  return {
    ...s,
    customSpots: s.customSpots.filter((c) => c.id === s.spotId || s.favorites.includes(c.id)),
  };
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(Defaults);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(StorageKey)
      .then((raw) => {
        if (raw) {
          const saved = {
            ...Defaults,
            ...(JSON.parse(raw) as Partial<Settings>),
          };
          if (!Array.isArray(saved.customSpots)) saved.customSpots = [];
          setSettings(saved);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(StorageKey, JSON.stringify(settings)).catch(() => {});
  }, [settings, loaded]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...settings,
      loaded,
      setActivity: (activityId) => setSettings((s) => ({ ...s, activityId })),
      setSpot: (spotId) => setSettings((s) => prune({ ...s, spotId })),
      toggleFavorite: (id) =>
        setSettings((s) =>
          prune({
            ...s,
            favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id],
          }),
        ),
      addCustomSpot: (spot) =>
        setSettings((s) =>
          prune({
            ...s,
            spotId: spot.id,
            customSpots: [...s.customSpots.filter((c) => c.id !== spot.id), spot],
          }),
        ),
      setUnits: (units) => setSettings((s) => ({ ...s, units })),
    }),
    [settings, loaded],
  );

  // Let getSpot() find searched places before any screen renders.
  setCustomSpots(settings.customSpots);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
