import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

const C = Colors.dark;

const Points = [
  'Check the National Weather Service marine forecast and local conditions before you go.',
  'Follow all official warnings and alerts, including small craft advisories, rip current statements, and storm and lightning warnings.',
  "Watch the sky and use your own judgment. When in doubt, don't go out.",
];

/** Safety reminder shown every time the app opens. */
export function SafetyNotice() {
  const [open, setOpen] = useState(true);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <ThemedText type="small" style={styles.tag}>
            SAFETY FIRST
          </ThemedText>
          <ThemedText style={styles.title} accessibilityRole="header">
            Florida weather changes fast
          </ThemedText>
          <ThemedText>
            Saltcast ratings are general guidance based on forecast models and current conditions. They are not an
            official forecast, and conditions on the water can change quickly.
          </ThemedText>
          {Points.map((p) => (
            <View key={p} style={styles.point}>
              <ThemedText themeColor="accent">•</ThemedText>
              <ThemedText style={{ flex: 1 }}>{p}</ThemedText>
            </View>
          ))}
          <Pressable
            onPress={() => WebBrowser.openBrowserAsync('https://www.weather.gov/marine/')}
            accessibilityRole="link">
            <ThemedText type="smallBold" themeColor="accent">
              Open the NWS marine forecast
            </ThemedText>
          </Pressable>
          <Pressable onPress={() => setOpen(false)} style={styles.button} accessibilityRole="button">
            <ThemedText type="smallBold" style={{ color: C.background }}>
              I understand
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    backgroundColor: C.backgroundElement,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: Spacing.four,
    gap: Spacing.two,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  tag: { color: C.maybe, fontWeight: 700, letterSpacing: 1.2 },
  title: { fontSize: 24, lineHeight: 28, fontWeight: 800 },
  point: { flexDirection: 'row', gap: Spacing.two },
  button: {
    marginTop: Spacing.two,
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
});
