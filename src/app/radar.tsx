import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Colors, Spacing } from '@/constants/theme';
import { getSpot } from '@/data/spots';
import { useSettings } from '@/state/settings';

export default function RadarScreen() {
  const { spotId } = useSettings();
  const spot = getSpot(spotId);
  const [mode, setMode] = useState<'radar' | 'tropics'>('radar');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  // The Today screen's safety card opens this tab straight to the hurricane tracker.
  const { show, at } = useLocalSearchParams<{ show?: string; at?: string }>();
  const [opened, setOpened] = useState<string>();
  if (show === 'tropics' && at !== opened) {
    setOpened(at);
    if (mode !== 'tropics') {
      setMode('tropics');
      setLoading(true);
      setFailed(false);
    }
  }
  const pick = (m: 'radar' | 'tropics') => {
    if (m === mode) return;
    setMode(m);
    setLoading(true);
    setFailed(false);
  };

  const params = new URLSearchParams({
    lat: String(spot.lat),
    lon: String(spot.lon),
    detailLat: String(spot.lat),
    detailLon: String(spot.lon),
    zoom: '7',
    level: 'surface',
    overlay: 'radar',
    product: 'radar',
    menu: '',
    message: 'true',
    marker: 'true',
    type: 'map',
    location: 'coordinates',
    metricWind: 'kt',
    metricTemp: '°F',
    radarRange: '-1',
  });

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{mode === 'radar' ? 'Radar' : 'Hurricanes'}</ThemedText>
        <ThemedText themeColor="textSecondary">
          {mode === 'radar' ? `Live rain and storms near ${spot.name}` : 'Storms, the forecast cone and when they reach Florida'}
        </ThemedText>
        <View style={styles.segment}>
          {(['radar', 'tropics'] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => pick(m)}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === m }}
              style={[styles.segItem, mode === m && styles.segOn]}>
              <ThemedText type="smallBold" style={{ color: mode === m ? Colors.dark.background : Colors.dark.text }}>
                {m === 'radar' ? 'Rain radar' : 'Hurricane tracker'}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.map}>
        {failed ? (
          <ThemedText themeColor="textSecondary" style={styles.message}>
            The map couldn&apos;t load. Check your connection and try again.
          </ThemedText>
        ) : (
          <WebView
            key={mode === 'radar' ? spot.id : 'tropics'}
            source={{ uri: mode === 'radar' ? `https://embed.windy.com/embed.html?${params}` : TropicsUrl }}
            injectedJavaScript={mode === 'tropics' ? HideSiteChrome : undefined}
            onShouldStartLoadWithRequest={(req) => {
              if (mode === 'radar' || !req.isTopFrame || req.url.startsWith(TropicsUrl) || req.url === 'about:blank') return true;
              // Links out of the tracker (NHC, NWS, satellite pages) open in the browser.
              WebBrowser.openBrowserAsync(req.url);
              return false;
            }}
            style={styles.web}
            onLoadEnd={() => setLoading(false)}
            onError={() => setFailed(true)}
            allowsInlineMediaPlayback
            setSupportMultipleWindows={false}
          />
        )}
        {loading && !failed ? <ActivityIndicator style={StyleSheet.absoluteFill} color={Colors.dark.accent} /> : null}
      </View>
    </SafeAreaView>
  );
}

/** The website's hurricane tracker: NHC storms and cone, Florida timing, NWS alerts, outlooks and satellite. */
const TropicsUrl = 'https://saltcastflorida.com/tropics/';

/** Hides the website's own "exit" button and hurricane link, which make no sense inside the app. */
const HideSiteChrome = `(function(){var s=document.createElement('style');s.textContent='.btn.exit,#hurr-link{display:none!important}';document.head.appendChild(s);})();true;`;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.dark.background },
  header: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.two },
  title: { fontSize: 30, lineHeight: 36, fontWeight: 700 },
  map: { flex: 1, marginBottom: BottomTabInset },
  web: { flex: 1, backgroundColor: Colors.dark.background },
  message: { padding: Spacing.four, textAlign: 'center' },
  segment: { flexDirection: 'row', gap: 6, paddingTop: Spacing.two },
  segItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.dark.backgroundElement,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.dark.border,
  },
  segOn: { backgroundColor: Colors.dark.accent, borderColor: Colors.dark.accent },
});
