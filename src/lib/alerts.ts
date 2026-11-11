import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { getActivity, type ActivityId } from '@/data/activities';
import { getSpot, setCustomSpots, type Spot } from '@/data/spots';
import { findBestWindows } from '@/lib/best-times';
import { fetchForecast } from '@/lib/forecast';
import { clock, dayLabel } from '@/lib/format';

/**
 * Go alerts for favorite spots. Everything runs on the phone: the app checks the
 * forecast for each favorite when it opens and in the background, then schedules
 * local notifications for upcoming Go windows. Nothing is sent to a server.
 */

export type AlertSettings = { enabled: boolean; activities: ActivityId[] };

export const DefaultAlerts: AlertSettings = { enabled: false, activities: [] };

/** What the alert check needs from the saved settings. */
export type AlertInput = { alerts: AlertSettings; favorites: string[]; customSpots: Spot[] };

const TaskName = 'saltcast-go-alerts';
/** Keys of alerts already scheduled, with the time each one fires, so the same window isn't announced twice. */
const SentKey = 'saltcast.alerts.sent.v1';
const IdPrefix = 'go-';

const Hour = 3600 * 1000;

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Local hour (0 to 23) of a time at the spot. */
function localHour(time: number, utcOffset: number) {
  return new Date(time + utcOffset * 1000).getUTCHours();
}

/** The given local hour on the same local day as `time`. */
function atLocalHour(time: number, utcOffset: number, hour: number) {
  const d = new Date(time + utcOffset * 1000);
  d.setUTCHours(hour, 0, 0, 0);
  return d.getTime() - utcOffset * 1000;
}

/**
 * When to send the alert for a window: 6am on the day, or 8pm the evening before for a
 * window that starts before 7:30am, so there's time to plan.
 */
function alertTime(start: number, utcOffset: number) {
  const early =
    localHour(start, utcOffset) < 7 || (localHour(start, utcOffset) === 7 && new Date(start).getUTCMinutes() < 30);
  return early ? atLocalHour(start - 24 * Hour, utcOffset, 20) : atLocalHour(start, utcOffset, 6);
}

type Sent = Record<string, number>;

async function readSent(): Promise<Sent> {
  try {
    return JSON.parse((await AsyncStorage.getItem(SentKey)) ?? '{}') as Sent;
  } catch {
    return {};
  }
}

/** Checks the forecast for each favorite and reschedules the Go alerts. */
export async function refreshAlerts(input: AlertInput, now = Date.now()) {
  if (Platform.OS === 'web') return;
  setCustomSpots(input.customSpots);

  // Clear alerts that haven't fired yet; they're rebuilt from the latest forecast.
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(IdPrefix))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );

  const sent = await readSent();
  // Forget alerts more than three days old.
  for (const k of Object.keys(sent)) if (sent[k] < now - 72 * Hour) delete sent[k];
  // Alerts scheduled earlier that haven't fired yet were just cancelled, so they can be scheduled again.
  for (const k of Object.keys(sent)) if (sent[k] > now) delete sent[k];

  const { alerts, favorites } = input;
  if (!alerts.enabled || !alerts.activities.length || !favorites.length) {
    await AsyncStorage.setItem(SentKey, JSON.stringify(sent));
    return;
  }

  for (const spotId of favorites) {
    const spot = getSpot(spotId);
    if (spot.id !== spotId) continue;
    let forecast;
    try {
      forecast = await fetchForecast(spot);
    } catch {
      continue;
    }
    for (const activityId of alerts.activities) {
      const activity = getActivity(activityId);
      const windows = findBestWindows(forecast, activity, spot, now, 8).filter(
        (w) => w.verdict === 'go' && w.end > now,
      );
      const days = new Set<string>();
      for (const w of windows) {
        const day = new Date(w.start + forecast.utcOffset * 1000).toISOString().slice(0, 10);
        // One alert per spot, activity and day: the first Go window.
        if (days.has(day)) continue;
        days.add(day);
        const key = `${spot.id}|${activityId}|${day}`;
        if (sent[key]) continue;

        let at = alertTime(w.start, forecast.utcOffset);
        // A window that's coming up soon but whose alert time has passed is announced right away.
        if (at <= now) {
          if (w.start - now > 12 * Hour) continue;
          at = now + 5000;
        }
        await Notifications.scheduleNotificationAsync({
          identifier: `${IdPrefix}${key}`,
          content: {
            title: `Favorable for ${activity.name.toLowerCase()} at ${spot.name}`,
            body: `${dayLabel(w.start, forecast.utcOffset, at)} ${clock(w.start, forecast.utcOffset)} to ${clock(w.end, forecast.utcOffset)}. Tap for the details.`,
            data: { spotId: spot.id, activityId },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at) },
        });
        sent[key] = at;
      }
    }
  }
  await AsyncStorage.setItem(SentKey, JSON.stringify(sent));
}

/** Asks for permission to show notifications. Returns true when allowed. */
export async function requestAlertPermission() {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/** Turns the background check on or off. iOS decides exactly when it runs, usually a few times a day. */
export async function setBackgroundAlerts(on: boolean) {
  if (Platform.OS === 'web') return;
  try {
    const registered = await TaskManager.isTaskRegisteredAsync(TaskName);
    if (on && !registered) await BackgroundTask.registerTaskAsync(TaskName, { minimumInterval: 3 * 60 });
    if (!on && registered) await BackgroundTask.unregisterTaskAsync(TaskName);
  } catch {
    // Background checks aren't available; alerts still refresh whenever the app opens.
  }
}

/** Settings are saved under this key by the settings provider. */
export const SettingsStorageKey = 'saltcast.settings.v1';

if (Platform.OS !== 'web') {
  TaskManager.defineTask(TaskName, async () => {
    try {
      const raw = await AsyncStorage.getItem(SettingsStorageKey);
      if (!raw) return BackgroundTask.BackgroundTaskResult.Success;
      const s = JSON.parse(raw) as Partial<AlertInput>;
      await refreshAlerts({
        alerts: s.alerts ?? DefaultAlerts,
        favorites: Array.isArray(s.favorites) ? s.favorites : [],
        customSpots: Array.isArray(s.customSpots) ? s.customSpots : [],
      });
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}
