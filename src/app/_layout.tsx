import * as Notifications from 'expo-notifications';
import { DarkTheme, router, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { Colors } from '@/constants/theme';
import type { ActivityId } from '@/data/activities';
import { refreshAlerts, setBackgroundAlerts } from '@/lib/alerts';
import { SettingsProvider, useSettings } from '@/state/settings';

SplashScreen.preventAutoHideAsync();

const Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.dark.background,
    card: Colors.dark.background,
    primary: Colors.dark.accent,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

function HideSplashWhenReady({ children }: { children: ReactNode }) {
  const { loaded } = useSettings();
  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);
  return loaded ? children : null;
}

/** Keeps the Go alerts up to date, and opens the right spot when one is tapped. */
function AlertsSync() {
  const { loaded, alerts, favorites, customSpots } = useSettings();

  useEffect(() => {
    if (!loaded || Platform.OS === 'web') return;
    const input = { alerts, favorites, customSpots };
    const on = alerts.enabled && alerts.activities.length > 0 && favorites.length > 0;
    setBackgroundAlerts(on);
    const timer = setTimeout(() => refreshAlerts(input).catch(() => {}), 1500);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshAlerts(input).catch(() => {});
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [loaded, alerts, favorites, customSpots]);

  return Platform.OS === 'web' ? null : <AlertTaps />;
}

/** Opens the spot and activity of a Go alert the user tapped. Not available on web. */
function AlertTaps() {
  const { setSpot, setActivity } = useSettings();
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    const data = response?.notification.request.content.data as
      | { spotId?: string; activityId?: ActivityId }
      | undefined;
    if (!data?.spotId) return;
    setSpot(data.spotId);
    if (data.activityId) setActivity(data.activityId);
    router.navigate('/');
    // Only react to a new tap, not to settings changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return null;
}

export default function RootLayout() {
  return (
    <ThemeProvider value={Theme}>
      <StatusBar style="light" />
      <SettingsProvider>
        <HideSplashWhenReady>
          <AlertsSync />
          <AppTabs />
        </HideSplashWhenReady>
      </SettingsProvider>
    </ThemeProvider>
  );
}
