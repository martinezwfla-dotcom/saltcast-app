import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Colors, Spacing } from '@/constants/theme';
import { getSpot } from '@/data/spots';
import { newsHtml, radarHtml, SiteBase } from '@/lib/radar-html';
import { useSettings } from '@/state/settings';

export default function RadarScreen() {
  const { spotId } = useSettings();
  const spot = getSpot(spotId);
  const [mode, setMode] = useState<Mode>('radar');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  // The Today screen's safety card opens this tab straight to the hurricane tracker.
  const { show, at } = useLocalSearchParams<{ show?: string; at?: string }>();
  const [opened, setOpened] = useState<string>();
  // The lightning banner opens it straight to the radar.
  if ((show === 'tropics' || show === 'radar' || show === 'news') && at !== opened) {
    setOpened(at);
    if (mode !== show) {
      setMode(show);
      setLoading(true);
      setFailed(false);
    }
  }
  const pick = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
    setLoading(true);
    setFailed(false);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{Modes[mode].title}</ThemedText>
        <ThemedText themeColor="textSecondary">{Modes[mode].sub(spot.name)}</ThemedText>
        <View style={styles.segment}>
          {(['radar', 'news', 'tropics'] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => pick(m)}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === m }}
              style={[styles.segItem, mode === m && styles.segOn]}>
              <ThemedText type="smallBold" style={{ color: mode === m ? Colors.dark.background : Colors.dark.text }}>
                {Modes[m].label}
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
            key={mode === 'tropics' ? 'tropics' : `${mode}:${spot.id}`}
            source={
              mode === 'radar'
                ? { html: radarHtml(spot), baseUrl: SiteBase }
                : mode === 'news'
                  ? { html: newsHtml(spot), baseUrl: SiteBase }
                  : { uri: TropicsUrl }
            }
            injectedJavaScript={mode === 'tropics' ? HideSiteChrome : undefined}
            onShouldStartLoadWithRequest={(req) => {
              if (!req.isTopFrame || req.url === 'about:blank') return true;
              // The page itself (and in-page # links) stays; links out (news stories, NWS, NHC, NOAA) open in the browser.
              if (mode === 'tropics' ? req.url.startsWith(TropicsUrl) : req.url === SiteBase || req.url.startsWith(SiteBase + '#')) return true;
              WebBrowser.openBrowserAsync(req.url);
              return false;
            }}
            onOpenWindow={(e) => {
              WebBrowser.openBrowserAsync(e.nativeEvent.targetUrl);
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

type Mode = 'radar' | 'news' | 'tropics';

const Modes: Record<Mode, { label: string; title: string; sub: (name: string) => string }> = {
  radar: { label: 'Radar', title: 'Radar', sub: (n) => `Rain, lightning and storm warnings near ${n}` },
  news: { label: 'Weather news', title: 'Florida Weather News', sub: () => 'NWS alerts and Florida weather headlines' },
  tropics: { label: 'Hurricanes', title: 'Hurricanes', sub: () => 'Storms, the forecast cone and when they reach Florida' },
};

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
