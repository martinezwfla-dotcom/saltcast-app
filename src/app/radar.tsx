import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Colors, Spacing } from '@/constants/theme';
import { getSpot } from '@/data/spots';
import { useSettings } from '@/state/settings';

export default function RadarScreen() {
  const { spotId } = useSettings();
  const spot = getSpot(spotId);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

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
        <ThemedText style={styles.title}>Radar</ThemedText>
        <ThemedText themeColor="textSecondary">Live rain and storms near {spot.name}</ThemedText>
      </View>
      <View style={styles.map}>
        {failed ? (
          <ThemedText themeColor="textSecondary" style={styles.message}>
            The radar map couldn&apos;t load. Check your connection and try again.
          </ThemedText>
        ) : (
          <WebView
            key={spot.id}
            source={{ uri: `https://embed.windy.com/embed.html?${params}` }}
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.dark.background },
  header: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.two },
  title: { fontSize: 30, lineHeight: 36, fontWeight: 700 },
  map: { flex: 1, marginBottom: BottomTabInset },
  web: { flex: 1, backgroundColor: Colors.dark.background },
  message: { padding: Spacing.four, textAlign: 'center' },
});
