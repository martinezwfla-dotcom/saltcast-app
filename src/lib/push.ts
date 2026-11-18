import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Spot } from '@/data/spots';

/**
 * Weather change alerts. Unlike the Favorable alerts, these come from the Saltcast server:
 * it checks each followed spot every 15 minutes and sends a push when the weather is
 * improving, changing or turns severe. The server only gets the push token and the
 * favorite spots' names and positions.
 */
const Endpoint = 'https://saltcastflorida.com/api/subscribe';

async function pushToken() {
  if (Platform.OS === 'web' || !Device.isDevice) return null;
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  const t = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  return t.data;
}

/** Tells the server which spots to watch. An empty list (or `enabled` false) stops the alerts. */
export async function syncChangeAlerts(enabled: boolean, spots: Spot[]) {
  const token = await pushToken();
  if (!token) return false;
  const body = {
    kind: 'expo',
    token,
    spots: enabled ? spots.slice(0, 30).map((s) => ({ name: s.name, lat: s.lat, lon: s.lon })) : [],
  };
  const r = await fetch(Endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.ok;
}

/** The favorite spot nearest a position, for opening the right spot when a server alert is tapped. */
export function nearestSpot(spots: Spot[], lat: number, lon: number) {
  let best: Spot | undefined;
  let bd = Infinity;
  for (const s of spots) {
    const d = (s.lat - lat) ** 2 + ((s.lon - lon) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (d < bd) {
      bd = d;
      best = s;
    }
  }
  return bd < 0.05 ? best : undefined;
}
