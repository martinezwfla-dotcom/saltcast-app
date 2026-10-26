import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ActivityPicker, Card, Disclaimer, Header, Icon, Screen, VerdictColor, VerdictPill } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { getActivity } from '@/data/activities';
import { getSpot } from '@/data/spots';
import { useForecast } from '@/hooks/use-forecast';
import { useNow } from '@/hooks/use-now';
import { findBestWindows } from '@/lib/best-times';
import { clock, compass, height, timeRange, windSpeed } from '@/lib/format';
import { useSettings } from '@/state/settings';

export default function BestTimesScreen() {
  const { activityId, spotId, units, setActivity } = useSettings();
  const activity = getActivity(activityId);
  const spot = getSpot(spotId);
  const { forecast, loading, error, refresh } = useForecast(spotId);
  const [open, setOpen] = useState<number>();
  const now = useNow();

  const windows = forecast ? findBestWindows(forecast, activity, spot, now) : [];

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading && !!forecast} onRefresh={refresh} tintColor={Colors.dark.accent} />}>
      <Header title="Best times" subtitle={`Next 48 hours at ${spot.name}`} />
      <ActivityPicker value={activityId} onChange={setActivity} />

      {!forecast ? (
        <Card style={styles.center}>
          {error ? <ThemedText>Couldn&apos;t load the forecast. Pull down to try again.</ThemedText> : <ActivityIndicator color={Colors.dark.accent} />}
        </Card>
      ) : windows.length === 0 ? (
        <Card>
          <ThemedText style={styles.title}>No good windows</ThemedText>
          <ThemedText themeColor="textSecondary">
            Conditions don&apos;t look right for {activity.name.toLowerCase()} at {spot.name} in daylight over the next 48 hours.
            Try another spot or activity.
          </ThemedText>
        </Card>
      ) : (
        windows.map((w) => {
          const expanded = open === w.start;
          return (
            <Pressable key={w.start} onPress={() => setOpen(expanded ? undefined : w.start)} accessibilityRole="button">
              <Card>
                <View style={styles.row}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <ThemedText style={styles.title}>{timeRange(w.start, w.end, forecast.utcOffset, now)}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {w.hours[0].rating.reasons.length ? w.hours[0].rating.reasons.join(' · ') : 'Conditions look good'}
                    </ThemedText>
                  </View>
                  <VerdictPill verdict={w.verdict} />
                  <Icon name={expanded ? 'chevron.up' : 'chevron.down'} size={14} />
                </View>
                {expanded ? (
                  <View style={styles.detail}>
                    {w.hours.map(({ hour, rating }) => (
                      <View key={hour.time} style={styles.hourRow}>
                        <View style={[styles.dot, { backgroundColor: VerdictColor[rating.verdict] }]} />
                        <ThemedText type="smallBold" style={styles.hourTime}>
                          {clock(hour.time, forecast.utcOffset)}
                        </ThemedText>
                        <ThemedText type="small" style={{ flex: 1 }}>
                          {windSpeed(hour.wind, units)} {compass(hour.windDir)}, seas {height(hour.waveHeight, units)}
                          {hour.precipChance != null ? `, ${hour.precipChance}% rain` : ''}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Card>
            </Pressable>
          );
        })
      )}

      <Disclaimer />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', paddingVertical: Spacing.five },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { fontSize: 17, lineHeight: 22, fontWeight: 700 },
  detail: { gap: 6, paddingTop: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.dark.border },
  hourRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  hourTime: { width: 48 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
