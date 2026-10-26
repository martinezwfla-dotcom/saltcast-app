import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Icon, VerdictColor } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import type { Activity } from '@/data/activities';
import type { Spot } from '@/data/spots';
import type { Forecast, HourForecast, TideEvent } from '@/lib/forecast';
import { clock, compass, dayLabel, height, temperature, weatherSymbol, weatherText, windSpeed, type Units } from '@/lib/format';
import { rateHour, windRelation } from '@/lib/verdict';

const C = Colors.dark;

function Stat({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <Card style={styles.stat}>
      <View style={styles.statLabel}>
        <Icon name={icon} size={16} />
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
      </View>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      {detail ? (
        <ThemedText type="small" themeColor="textSecondary">
          {detail}
        </ThemedText>
      ) : null}
    </Card>
  );
}

export function ConditionsGrid({ hour, spot, units }: { hour: HourForecast; spot: Spot; units: Units }) {
  const relation = hour.windDir != null ? windRelation(hour.windDir, spot.facing) : null;
  return (
    <View style={styles.grid}>
      <Stat
        icon="wind"
        label="Wind"
        value={`${windSpeed(hour.wind, units)} ${compass(hour.windDir)}`}
        detail={`Gusts ${windSpeed(hour.gusts, units)}${relation ? `, ${relation}` : ''}`}
      />
      <Stat
        icon="water.waves"
        label="Seas"
        value={height(hour.waveHeight, units)}
        detail={hour.wavePeriod != null ? `${Math.round(hour.wavePeriod)} s period` : undefined}
      />
      <Stat
        icon="water.waves.and.arrow.up"
        label="Swell"
        value={`${height(hour.swellHeight, units)} ${compass(hour.swellDir)}`}
        detail={hour.swellPeriod != null ? `${Math.round(hour.swellPeriod)} s period` : undefined}
      />
      <Stat icon="thermometer.medium" label="Water" value={temperature(hour.waterTemp, units)} />
      <Stat
        icon={weatherSymbol(hour.weatherCode, hour.isDay)}
        label="Weather"
        value={temperature(hour.airTemp, units)}
        detail={`${weatherText(hour.weatherCode)}${hour.precipChance != null ? `, ${hour.precipChance}% rain` : ''}`}
      />
    </View>
  );
}

export function TideCard({
  forecast,
  units,
  stationName,
  now,
}: {
  forecast: Forecast;
  units: Units;
  stationName: string;
  now: number;
}) {
  const upcoming = forecast.tides.filter((t) => t.time > now).slice(0, 4);
  const next = upcoming[0];

  return (
    <Card>
      <View style={styles.statLabel}>
        <Icon name="arrow.up.and.down" size={16} />
        <ThemedText type="small" themeColor="textSecondary">
          Tides at {stationName}
        </ThemedText>
      </View>
      {forecast.tidesError || !next ? (
        <ThemedText themeColor="textSecondary">Tide predictions aren&apos;t available right now.</ThemedText>
      ) : (
        <>
          <ThemedText style={styles.statValue}>
            {next.type === 'high' ? 'Rising' : 'Falling'}, {next.type} tide at {clock(next.time, forecast.utcOffset)}
          </ThemedText>
          {upcoming.map((t: TideEvent) => (
            <View key={t.time} style={styles.tideRow}>
              <ThemedText type="smallBold" style={styles.tideType}>
                {t.type === 'high' ? 'High' : 'Low'}
              </ThemedText>
              <ThemedText type="small" style={{ flex: 1 }}>
                {dayLabel(t.time, forecast.utcOffset, now)} {clock(t.time, forecast.utcOffset)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {height(t.height, units)}
              </ThemedText>
            </View>
          ))}
        </>
      )}
    </Card>
  );
}

export function HourlyStrip({
  hours,
  activity,
  spot,
  units,
  utcOffset,
}: {
  hours: HourForecast[];
  activity: Activity;
  spot: Spot;
  units: Units;
  utcOffset: number;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourly}>
      {hours.map((h) => {
        const r = rateHour(h, activity, spot);
        return (
          <View key={h.time} style={styles.hour}>
            <ThemedText type="small" themeColor="textSecondary">
              {clock(h.time, utcOffset)}
            </ThemedText>
            <View style={[styles.dot, { backgroundColor: VerdictColor[r.verdict] }]} />
            <ThemedText type="smallBold">{windSpeed(h.wind, units)}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {height(h.waveHeight, units)}
            </ThemedText>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  stat: { flexGrow: 1, flexBasis: '45%', gap: Spacing.one },
  statLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValue: { fontSize: 20, lineHeight: 26, fontWeight: 700 },
  tideRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  tideType: { width: 40 },
  hourly: { gap: Spacing.two },
  hour: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.two,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: C.backgroundElement,
    minWidth: 62,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
