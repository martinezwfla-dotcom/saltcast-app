import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, Share, StyleSheet, View } from 'react-native';

import { ForecastCharts } from '@/components/charts';
import { Welcome } from '@/components/welcome';

import { ConditionsGrid, DailyForecast, HourlyStrip, TideCard } from '@/components/conditions';
import { BuoyCard, LocalCard, WaterPicker } from '@/components/extras';
import { ThemedText } from '@/components/themed-text';
import { ActivityPicker, Card, Disclaimer, Icon, openWebsite, Screen, VerdictPill, WebsiteButton } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { getActivity } from '@/data/activities';
import { getSpot } from '@/data/spots';
import { useForecast } from '@/hooks/use-forecast';
import { useNow } from '@/hooks/use-now';
import { findBestWindows } from '@/lib/best-times';
import { summarizeDays } from '@/lib/daily';
import { currentHourIndex, waterFor, WaterLabels } from '@/lib/forecast';
import { clock, compass, height, timeRange, windSpeed } from '@/lib/format';
import { nearestArea } from '@/data/local';
import { rateHour, VerdictLabel } from '@/lib/verdict';
import { useSettings } from '@/state/settings';

export default function TodayScreen() {
  const { activityId, spotId, units, setActivity, favorites, toggleFavorite, water: chosenWater, setWater, loaded, onboarded } = useSettings();
  const water = waterFor(chosenWater, activityId);
  const favorite = favorites.includes(spotId);
  const activity = getActivity(activityId);
  const spot = getSpot(spotId);
  const { forecast, loading, error, refresh, offline } = useForecast(spotId, water);
  const now = useNow();

  const index = forecast ? currentHourIndex(forecast, now) : 0;
  const hour = forecast?.hours[index];
  const rating = hour ? rateHour(hour, activity, spot) : undefined;
  const nextBest = forecast ? findBestWindows(forecast, activity, spot, now, 1)[0] : undefined;
  const days = forecast ? summarizeDays(forecast, activity, spot, now) : [];

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading && !!forecast} onRefresh={refresh} tintColor={Colors.dark.accent} />}>
      <View style={styles.header}>
        <Pressable onPress={openWebsite} accessibilityRole="link" accessibilityLabel="Saltcast Florida, opens saltcastflorida.com">
          <Image source={require('@/assets/images/logo-header.png')} style={styles.logo} contentFit="contain" />
        </Pressable>
        <View style={styles.spotGroup}>
          <Pressable onPress={() => router.navigate('/spots')} style={styles.spotButton} accessibilityRole="button">
            <Icon name="mappin.and.ellipse" size={16} />
            <View style={{ flexShrink: 1 }}>
              <ThemedText type="smallBold" numberOfLines={1}>
                {spot.name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {spot.region}
              </ThemedText>
            </View>
          </Pressable>
          <Pressable
            onPress={() => toggleFavorite(spotId)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={favorite ? `Remove ${spot.name} from favorites` : `Add ${spot.name} to favorites`}>
            <Icon name={favorite ? 'star.fill' : 'star'} size={20} color={favorite ? Colors.dark.maybe : Colors.dark.textSecondary} />
          </Pressable>
        </View>
      </View>

      {loaded && !onboarded ? <Welcome /> : null}

      <ActivityPicker value={activityId} onChange={setActivity} />
      <WaterPicker value={chosenWater} onChange={setWater} activityId={activityId} />

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
              {water !== 'near' ? ` · ${WaterLabels[water].label}` : ''}
            </ThemedText>
            <VerdictPill verdict={rating.verdict} large />
            <ThemedText>{rating.reasons.length ? rating.reasons.join(' · ') : 'Conditions look good.'}</ThemedText>
            {offline ? (
              <ThemedText type="small" style={{ color: Colors.dark.maybe }}>
                No connection. Showing the forecast saved at {clock(forecast.fetchedAt, forecast.utcOffset)}. Pull down to try again.
              </ThemedText>
            ) : null}
            {nextBest ? (
              <Pressable onPress={() => router.navigate('/best-times')} style={styles.nextBest}>
                <Icon name="clock" size={14} />
                <ThemedText type="small">
                  Best window: {timeRange(nextBest.start, nextBest.end, forecast.utcOffset, now)} ({VerdictLabel[nextBest.verdict]})
                </ThemedText>
              </Pressable>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                No good daylight window in the next 72 hours.
              </ThemedText>
            )}
            <Pressable
              onPress={() => {
                const near = nearestArea(spot.lat, spot.lon);
                const slug = near?.exact ? near.area.slug : undefined;
                const url = slug ? `https://saltcastflorida.com/spots/${slug}/` : 'https://saltcastflorida.com/';
                Share.share({
                  message: `${spot.name} ${activity.name.toLowerCase()} right now: ${VerdictLabel[rating.verdict]}. Wind ${compass(hour.windDir)} ${windSpeed(hour.wind, units)}, seas ${height(hour.waveHeight, units)}. Check it on Saltcast Florida: ${url}`,
                }).catch(() => {});
              }}
              style={styles.share}
              accessibilityRole="button"
              accessibilityLabel="Share this forecast">
              <Icon name="square.and.arrow.up" size={16} />
              <ThemedText type="smallBold" themeColor="accent">
                Share
              </ThemedText>
            </Pressable>
          </Card>

          <LocalCard spot={spot} activityId={activityId} />
          <ConditionsGrid hour={hour} spot={spot} units={units} />
          <BuoyCard spot={spot} water={water} units={units} />
          <TideCard forecast={forecast} units={units} stationName={spot.tideStation.name} now={now} />

          <ThemedText type="smallBold">Next 12 hours</ThemedText>
          <HourlyStrip hours={forecast.hours.slice(index, index + 12)} activity={activity} spot={spot} units={units} utcOffset={forecast.utcOffset} />

          <ForecastCharts
            hours={forecast.hours.slice(index, index + 72)}
            units={units}
            utcOffset={forecast.utcOffset}
            now={now}
            inshore={water === 'inshore'}
            tides={forecast.tides}
          />

          <ThemedText type="smallBold">
            {days.length}-day forecast for {activity.name.toLowerCase()}
          </ThemedText>
          <DailyForecast days={days} units={units} utcOffset={forecast.utcOffset} now={now} />

          <ThemedText type="small" themeColor="textSecondary" style={styles.updated}>
            Updated {clock(forecast.fetchedAt, forecast.utcOffset)}. Data from Open-Meteo and NOAA.
          </ThemedText>
        </>
      ) : null}

      <WebsiteButton />
      <Disclaimer />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  logo: { width: 198, height: 66 },
  spotGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexShrink: 1,
  },
  spotButton: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.dark.backgroundElement,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  center: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
    gap: Spacing.three,
  },
  retry: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  verdictCard: { alignItems: 'flex-start', gap: Spacing.two },
  nextBest: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  updated: { textAlign: 'center' },
  share: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.dark.accent,
  },
});
