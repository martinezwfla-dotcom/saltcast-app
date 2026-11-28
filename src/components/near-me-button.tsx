import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { findNearMe } from '@/lib/near-me';
import { useSettings } from '@/state/settings';

const C = Colors.dark;

/** Picks the Saltcast spot closest to the phone, or makes a "Near you" place farther away. */
export function NearMeButton({ onDone }: { onDone?: () => void }) {
  const { setSpot, addCustomSpot } = useSettings();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setMessage(null);
    const r = await findNearMe();
    setBusy(false);
    if (!r.ok) {
      setMessage(
        r.reason === 'denied'
          ? 'Location is off for Saltcast. Turn it on in Settings, or pick a spot below.'
          : "Couldn't get your location right now. Pick a spot below instead.",
      );
      return;
    }
    if (r.custom) addCustomSpot(r.spot);
    else setSpot(r.spot.id);
    if (onDone) onDone();
    else router.navigate('/');
  }

  return (
    <View style={{ gap: Spacing.one }}>
      <Pressable onPress={go} style={styles.nearMe} accessibilityRole="button" accessibilityLabel="Use the spot nearest me">
        {busy ? <ActivityIndicator color={C.background} /> : <Icon name="location.fill" size={16} color={C.background} />}
        <ThemedText type="smallBold" style={{ color: C.background }}>
          Near me
        </ThemedText>
      </Pressable>
      {message ? (
        <Pressable onPress={() => Linking.openSettings()}>
          <ThemedText type="small" themeColor="textSecondary">
            {message}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  nearMe: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: C.accent,
  },
});
