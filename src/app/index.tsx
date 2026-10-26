import { router } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { ConditionsGrid, DailyForecast, HourlyStrip, TideCard } from '@/components/conditions';
import { ThemedText } from '@/components/themed-text';
import { ActivityPicker, Card, Disclaimer, Header, Icon, Screen, VerdictPill } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { getActivity } from '@/data/activities';
import { getSpot } from '@/data/spots';
import { useForecast } from '@/hooks/use-forecast';
import { useNow } from '@/hooks/use-now';
import { findBestWindows } from '@/lib/best-times';
import { summarizeDays } from '@/lib/daily';
import { currentHourIndex } from '@/lib/forecast';
import { clock, timeRange } from '@/lib/format';
import { rateHour, VerdictLabel } from '@/lib/verdict';
import { useSettings } from '@/state/settings';

export default function TodayScreen() {
  const { activityId, spotId, units, setActivity } = useSettings();
  const activity = getActivity(activityId);
  const spot = getSpot(spotId);
  const { forecast, loading, error, refresh } = useForecast(spotId);
  const now = useNow();

  const index = forecast ? currentHourIndex(forecast, now) : 0;
  const hour = forecast?.hours[index];
  const rating = hour ? rateHour(hour, activity, spot) : undefined;
  const nextBest = forecast ? findBestWindows(forecast, activity, spot, now, 1)[0] : undefined;

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading && !!forecast} onRefresh={refresh} tintColor={Colors.dark.accent} />}>
      <Header
        title="Saltcast"
        subtitle="Florida water conditions"
        right={
          <Pressable onPress={() => router.navigate('/spots')} style={styles.spotButton} accessibilityRole="button">
            <Icon name="mappin.and.ellipse" size={16} />
            <View>
              <ThemedText type="smallBold">{spot.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {spot.region}
              </ThemedText>
            </View>
          </Pressable>
        }
      />

      <ActivityPicker value={activityId} onChange={setActivity} />

      {!forecast ? (
        <Card style={styles.center}>
          {error ? (
            <>
              <ThemedText>Couldn&apos;t load the forecast. {error}</ThemedText>
              <Pressable onPress={refresh} style={styles.retry} accessibilityRole="button">
                <ThemedText type="smallBold" style={{ color: Colors.dark.background }}>
                  Try again
                </ThemedText>
              </Pressable>
            </>
          ) : (
            <ActivityIndicator color={Colors.dark.accent} />
          )}
        </Card>
      ) : hour && rating ? (
        <>
          <Card style={styles.verdictCard}>
            <ThemedText type="small" themeColor="textSecondary">
              {activity.name} right now at {spot.name}
            </ThemedText>
            <VerdictPill verdict={rating.verdict} large />
            <ThemedText>
              {rating.reasons.length ? rating.reasons.join(' · ') : 'Conditions look good.'}
            </ThemedText>
            {nextBest ? (
              <Pressable onPress={() => router.navigate('/best-times')} style={styles.nextBest}>
                <Icon name="clock" size={14} />
                <ThemedText type="small">
                  Best window: {timeRange(nextBest.start, nextBest.end, forecast.utcOffset, now)} ({VerdictLabel[nextBest.verdict]})
                </ThemedText>
              </Pressable>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                No good daylight window in the next 48 hours.
              </ThemedText>
            )}
          </Card>

          <ConditionsGrid hour={hour} spot={spot} units={units} />
          <TideCard forecast={forecast} units={units} stationName={spot.tideStation.name} now={now} />

          <ThemedText type="smallBold">Next 12 hours</ThemedText>
          <HourlyStrip
            hours={forecast.hours.slice(index, index + 12)}
            activity={activity}
            spot={spot}
            units={units}
            utcOffset={forecast.utcOffset}
          />

          <ThemedText type="smallBold">7-day forecast for {activity.name.toLowerCase()}</ThemedText>
          <DailyForecast
            days={summarizeDays(forecast, activity, spot, now)}
            units={units}
            utcOffset={forecast.utcOffset}
            now={now}
          />

          <ThemedText type="small" themeColor="textSecondary" style={styles.updated}>
            Updated {clock(forecast.fetchedAt, forecast.utcOffset)}. Data from Open-Meteo and NOAA.
          </ThemedText>
        </>
      ) : null}

      <Disclaimer />
    </Screen>
  );
}

const styles = StyleSheet.create({
  spotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.dark.backgroundElement,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  center: { alignItems: 'center', paddingVertical: Spacing.five, gap: Spacing.three },
  retry: { backgroundColor: Colors.dark.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  verdictCard: { alignItems: 'flex-start', gap: Spacing.two },
  nextBest: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  updated: { textAlign: 'center' },
});
