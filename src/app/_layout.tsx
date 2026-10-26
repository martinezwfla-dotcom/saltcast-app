import { DarkTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';

import AppTabs from '@/components/app-tabs';
import { Colors } from '@/constants/theme';
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

export default function RootLayout() {
  return (
    <ThemeProvider value={Theme}>
      <StatusBar style="light" />
      <SettingsProvider>
        <HideSplashWhenReady>
          <AppTabs />
        </HideSplashWhenReady>
      </SettingsProvider>
    </ThemeProvider>
  );
}
