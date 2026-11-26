import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DefaultActivityId, type ActivityId } from '@/data/activities';
import { DefaultAlerts, SettingsStorageKey, type AlertSettings } from '@/lib/alerts';
import { DefaultSpotId, setCustomSpots, Spots, type Spot } from '@/data/spots';
import type { Water } from '@/lib/forecast';
import type { ChangeAlertMode } from '@/lib/push';
import type { Units } from '@/lib/format';

type Settings = {
  activityId: ActivityId;
  spotId: string;
  favorites: string[];
  /** Places found with search. Kept while they are favorites or the current spot. */
  customSpots: Spot[];
  /** Go alerts for favorite spots. */
  alerts: AlertSettings;
  /** Server push alerts when the weather at a favorite is improving, changing or turns severe. */
  changeAlerts: boolean;
  /** What those alerts cover: every change, only when it turns Favorable, or warnings only. */
  changeAlertMode: ChangeAlertMode;
  /** The first-run welcome card has been finished or dismissed. */
  onboarded: boolean;
  /** Built-in spots removed from the Spots list. */
  hidden: string[];
  units: Units;
  /** Inshore, nearshore (default) or offshore forecasts. For a searched place this is that place's water. */
  water: Water;
  /** Water picked for each searched place (they keep their own; the 20 spots share `water`). */
  placeWater: Record<string, Water>;
};

type SettingsContextValue = Settings & {
  loaded: boolean;
  setActivity: (id: ActivityId) => void;
  setSpot: (id: string) => void;
  toggleFavorite: (id: string) => void;
  /** Saves a searched place and makes it the current spot. */
  addCustomSpot: (spot: Spot) => void;
  setAlerts: (alerts: AlertSettings) => void;
  setChangeAlerts: (on: boolean) => void;
  setChangeAlertMode: (mode: ChangeAlertMode) => void;
  finishOnboarding: () => void;
  /** Removes a spot from the list. A searched place is deleted. */
  hideSpot: (id: string) => void;
  /** Puts a removed spot back, or all of them when no id is given. */
  showSpot: (id?: string) => void;
  setUnits: (units: Units) => void;
  setWater: (water: Water) => void;
};

const StorageKey = SettingsStorageKey;

const Defaults: Settings = {
  activityId: DefaultActivityId,
  spotId: DefaultSpotId,
  favorites: [],
  customSpots: [],
  alerts: DefaultAlerts,
  changeAlerts: false,
  changeAlertMode: 'all',
  onboarded: false,
  hidden: [],
  units: 'imperial',
  water: 'near',
  placeWater: {},
};

// A searched town that isn't a beach (Placida, Matlacha, Cortez...) sits on a bay or sound, so it starts on
// Inshore: Nearshore rates the open water a few miles off the beach, which can be rough while the sound is calm.
const Beachy = /beach|key\b|keys|island|isle|pier|inlet|shores|jetty|sands|surf/i;
const isWater = (w: unknown): w is Water => w === 'inshore' || w === 'near' || w === 'off';

/** The water used for the current spot and activity. */
function currentWater(s: Settings): Water {
  const place = s.customSpots.find((c) => c.id === s.spotId);
  let w: Water = place ? (isWater(s.placeWater[place.id]) ? s.placeWater[place.id] : Beachy.test(place.name) ? 'near' : 'inshore') : s.water;
  // Surfing always reads the beach (Nearshore). Kayak & SUP stay close in: Offshore becomes Nearshore.
  if (s.activityId === 'surfing' || (s.activityId === 'paddling' && w === 'off')) w = 'near';
  return w;
}

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
          const parsed = JSON.parse(raw) as Partial<Settings>;
          const saved = { ...Defaults, ...parsed };
          if (!Array.isArray(saved.customSpots)) saved.customSpots = [];
          if (!saved.alerts || !Array.isArray(saved.alerts.activities)) saved.alerts = DefaultAlerts;
          if (!Array.isArray(saved.hidden)) saved.hidden = [];
          if (typeof saved.changeAlerts !== 'boolean') saved.changeAlerts = false;
          if (!['inshore', 'near', 'off'].includes(saved.water)) saved.water = 'near';
          if (!saved.placeWater || typeof saved.placeWater !== 'object') saved.placeWater = {};
          if (!['all', 'fav', 'severe'].includes(saved.changeAlertMode)) saved.changeAlertMode = 'all';
          // People updating from an earlier version have already set the app up.
          if (typeof parsed.onboarded !== 'boolean') saved.onboarded = true;
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
      water: currentWater(settings),
      loaded,
      // Surfing always reads the beach (Nearshore). Kayak & SUP stay close in: Offshore switches to Nearshore, Inshore is kept.
      setActivity: (activityId) =>
        setSettings((s) => ({
          ...s,
          activityId,
          water: activityId === 'surfing' || (activityId === 'paddling' && s.water === 'off') ? 'near' : s.water,
        })),
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
      setAlerts: (alerts) => setSettings((s) => ({ ...s, alerts })),
      setChangeAlerts: (changeAlerts) => setSettings((s) => ({ ...s, changeAlerts })),
      setChangeAlertMode: (changeAlertMode) => setSettings((s) => ({ ...s, changeAlertMode })),
      finishOnboarding: () => setSettings((s) => ({ ...s, onboarded: true })),
      hideSpot: (id) =>
        setSettings((s) => {
          const custom = s.customSpots.some((c) => c.id === id);
          const hidden = custom || s.hidden.includes(id) ? s.hidden : [...s.hidden, id];
          const favorites = s.favorites.filter((f) => f !== id);
          const customSpots = s.customSpots.filter((c) => c.id !== id);
          // If the current spot is removed, switch to the first spot still listed.
          const spotId = s.spotId === id ? (Spots.find((x) => !hidden.includes(x.id))?.id ?? DefaultSpotId) : s.spotId;
          return prune({ ...s, hidden, favorites, customSpots, spotId });
        }),
      showSpot: (id) => setSettings((s) => ({ ...s, hidden: id ? s.hidden.filter((h) => h !== id) : [] })),
      setUnits: (units) => setSettings((s) => ({ ...s, units })),
      setWater: (water) =>
        setSettings((s) =>
          s.customSpots.some((c) => c.id === s.spotId) ? { ...s, placeWater: { ...s.placeWater, [s.spotId]: water } } : { ...s, water },
        ),
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
