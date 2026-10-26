import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DefaultActivityId, type ActivityId } from '@/data/activities';
import { DefaultSpotId } from '@/data/spots';
import type { Units } from '@/lib/format';

type Settings = {
  activityId: ActivityId;
  spotId: string;
  favorites: string[];
  units: Units;
};

type SettingsContextValue = Settings & {
  loaded: boolean;
  setActivity: (id: ActivityId) => void;
  setSpot: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setUnits: (units: Units) => void;
};

const StorageKey = 'saltcast.settings.v1';

const Defaults: Settings = {
  activityId: DefaultActivityId,
  spotId: DefaultSpotId,
  favorites: [],
  units: 'imperial',
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(Defaults);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(StorageKey)
      .then((raw) => {
        if (raw) setSettings({ ...Defaults, ...(JSON.parse(raw) as Partial<Settings>) });
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
      setSpot: (spotId) => setSettings((s) => ({ ...s, spotId })),
      toggleFavorite: (id) =>
        setSettings((s) => ({
          ...s,
          favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id],
        })),
      setUnits: (units) => setSettings((s) => ({ ...s, units })),
    }),
    [settings, loaded],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
