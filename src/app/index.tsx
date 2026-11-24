import { Image } from 'expo-image';
import { useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, Share, StyleSheet, View } from 'react-native';

import { CatchOfTheWeek } from '@/components/catch';
import { ForecastCharts } from '@/components/charts';
import { Welcome } from '@/components/welcome';

import { ConditionsGrid, DailyForecast, HourlyStrip, TideCard } from '@/components/conditions';
import { BuoyCard, LocalCard, SafetyAlerts, WaterPicker } from '@/components/extras';
import { ThemedText } from '@/components/themed-text';
import { ActivityPicker, Card, Disclaimer, Icon, openWebsite, Screen, VerdictPill, WebsiteButton } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { getActivity } from '@/data/activities';
import { getSpot } from '@/data/spots';
import { useForecast } from '@/hooks/use-forecast';
import { useNow } from '@/hooks/use-now';
import { findBestWindows } from '@/lib/best-times';
import { summarizeDays } from '@/lib/daily';
import { nowLine } from '@/lib/why';
import { currentHourIndex, waterFor, WaterLabels } from '@/lib/forecast';
import { clock, compass, height, timeRange, windSpeed } from '@/lib/format';
import { nearestArea } from '@/data/local';
import { useTropical } from '@/lib/tropical';
import { rateHour, VerdictLabel } from '@/lib/verdict';
import { useSettings } from '@/state/settings';

export default function TodayScreen() {
  const { activityId, spotId, units, setActivity, favorites, toggleFavorite, water: chosenWater, setWater, loaded, onboarded } = useSettings();
  const water = waterFor(chosenWater, activityId);
  const favorite = favorites.includes(spotId);
  const activity = getActivity(activityId);
  const baseSpot = getSpot(spotId);
  // The hour picked on the 72-hour strip or the charts; both stay in step.
  const [sel, setSel] = useState(0);
  const { forecast, loading, error, refresh, offline } = useForecast(spotId, water);
  const now = useNow();
  const { spot, now: tropical } = useTropical(baseSpot, now);

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
          <Pressable
            onPress={() => router.navigate('/spots')}
            style={({ pressed }) => [styles.spotButton, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel={`Location: ${spot.name}. Tap to change location`}>
            <Icon name="mappin.and.ellipse" size={22} color={Colors.dark.accent} />
            <View style={{ flexShrink: 1 }}>
              <ThemedText style={styles.spotName} numberOfLines={1}>
                {spot.name}
              </ThemedText>
              <View style={styles.changeRow}>
                <ThemedText type="smallBold" style={{ color: Colors.dark.accent }}>
                  Change location
                </ThemedText>
                <Icon name="chevron.down" size={12} color={Colors.dark.accent} />
              </View>
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
            <View style={styles.verdictRow}>
              <ThemedText style={styles.townName} numberOfLines={2}>
                {spot.name}
              </ThemedText>
              <VerdictPill verdict={rating.verdict} large />
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {activity.name} right now · {spot.region}
              {water !== 'near' ? ` · ${WaterLabels[water].label}` : ''}
            </ThemedText>
            <ThemedText>{nowLine(hour, rating.reasons)}</ThemedText>
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

          <SafetyAlerts
            hours={forecast.hours.slice(index)}
            activityId={activityId}
            tropical={tropical}
            utcOffset={forecast.utcOffset}
            onTracker={() => router.navigate({ pathname: '/radar', params: { show: 'tropics', at: String(Date.now()) } })}
          />
          <LocalCard spot={spot} activityId={activityId} />
          <ConditionsGrid hour={hour} spot={spot} units={units} />
          <BuoyCard spot={spot} water={water} units={units} />
          <TideCard forecast={forecast} units={units} stationName={spot.tideStation.name} now={now} />

          <ThemedText type="smallBold">Next 72 hours</ThemedText>
          <HourlyStrip
            hours={forecast.hours.slice(index, index + 72)}
            activity={activity}
            spot={spot}
            units={units}
            utcOffset={forecast.utcOffset}
            now={now}
            selected={sel}
            onSelect={setSel}
          />

          <ForecastCharts
            hours={forecast.hours.slice(index, index + 72)}
            units={units}
            utcOffset={forecast.utcOffset}
            now={now}
            inshore={water === 'inshore'}
            tides={forecast.tides}
            sel={sel}
            onSel={setSel}
          />

          <ThemedText type="smallBold">
            {days.length}-day forecast for {activity.name.toLowerCase()}
          </ThemedText>
          <DailyForecast
            days={days}
            units={units}
            utcOffset={forecast.utcOffset}
            now={now}
            activity={activityId}
            water={water}
          />

          <ThemedText type="small" themeColor="textSecondary" style={styles.updated}>
            Updated {clock(forecast.fetchedAt, forecast.utcOffset)}. Data from Open-Meteo and NOAA.
          </ThemedText>
        </>
      ) : null}

      <CatchOfTheWeek activityId={activityId} />

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
  logo: { width: 156, height: 52 },
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
    gap: 8,
    backgroundColor: Colors.dark.backgroundElement,
    borderWidth: 1.5,
    borderColor: Colors.dark.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 56,
    borderRadius: 14,
  },
  spotName: { fontSize: 18, lineHeight: 22, fontWeight: 700 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verdictRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, alignSelf: 'stretch' },
  townName: { flexShrink: 1, fontSize: 30, lineHeight: 36, fontWeight: 700 },
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
