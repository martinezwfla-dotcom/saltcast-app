import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { NearMeButton } from '@/components/near-me-button';
import { ThemedText } from '@/components/themed-text';
import { ActivityPicker, Card } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { getSpot } from '@/data/spots';
import { requestAlertPermission } from '@/lib/alerts';
import { syncChangeAlerts } from '@/lib/push';
import { useSettings } from '@/state/settings';

const C = Colors.dark;

/** First-run setup on the Today tab: activity, home spot, alerts. Shown once. */
export function Welcome() {
  const { activityId, setActivity, spotId, favorites, toggleFavorite, changeAlerts, setChangeAlerts, finishOnboarding } =
    useSettings();
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const spot = getSpot(spotId);

  async function alertsOn() {
    setAlertMsg(null);
    const ok = await requestAlertPermission();
    if (!ok) {
      setAlertMsg('Notifications are off for Saltcast. You can turn them on later in Settings.');
      return;
    }
    const sent = await syncChangeAlerts(true, []).catch(() => false);
    if (!sent) {
      setAlertMsg("Couldn't reach Saltcast. You can turn alerts on later from the Spots tab.");
      return;
    }
    if (!favorites.includes(spotId)) toggleFavorite(spotId);
    setChangeAlerts(true);
    setAlertMsg(`Alerts are on for ${spot.name}. Star more spots to add them.`);
  }

  return (
    <Card style={styles.card}>
      <ThemedText type="smallBold">Welcome to Saltcast</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Three quick steps and the app is set up for you.
      </ThemedText>

      <ThemedText type="smallBold">1. What are you heading out for?</ThemedText>
      <ActivityPicker value={activityId} onChange={setActivity} />

      <ThemedText type="smallBold">2. Your home spot: {spot.name}</ThemedText>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <NearMeButton onDone={() => {}} />
        </View>
        <Pressable onPress={() => router.navigate('/spots')} style={styles.outline} accessibilityRole="button">
          <ThemedText type="smallBold" themeColor="accent">
            Pick a spot
          </ThemedText>
        </Pressable>
      </View>

      <ThemedText type="smallBold">3. Get weather alerts?</ThemedText>
      {changeAlerts ? null : (
        <Pressable onPress={alertsOn} style={styles.outline} accessibilityRole="button">
          <ThemedText type="smallBold" themeColor="accent">
            Alert me when the weather at {spot.name} changes
          </ThemedText>
        </Pressable>
      )}
      {alertMsg ? (
        <ThemedText type="small" themeColor="textSecondary">
          {alertMsg}
        </ThemedText>
      ) : null}

      <Pressable onPress={finishOnboarding} style={styles.done} accessibilityRole="button">
        <ThemedText type="smallBold" style={{ color: C.background }}>
          Done
        </ThemedText>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two, borderWidth: 1, borderColor: C.accent },
  row: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  outline: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  done: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
});
