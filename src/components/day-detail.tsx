import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { dayKind, hourKind, SkyIcon } from '@/components/sky-icon';
import { TrendText } from '@/components/trend-text';
import { Card, Icon, VerdictColor, VerdictPill } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import type { Activity } from '@/data/activities';
import type { Spot } from '@/data/spots';
import type { DaySummary } from '@/lib/daily';
import type { Forecast, Water } from '@/lib/forecast';
import { clock, compass, dayLabel, height, temperature, weatherText, windSpeed, type Units } from '@/lib/format';
import { rateHour, VerdictLabel } from '@/lib/verdict';

const C = Colors.dark;

type Why = { lead?: string; text: string } | null | undefined;

/**
 * Full-screen details for one day of the daily forecast, opened by tapping the day.
 * Same as the website's tap-a-day view: Back button, stats, tides and hour by hour.
 */
export function DayDetail({
  index,
  days,
  whys,
  forecast,
  spot,
  activity,
  units,
  water,
  now,
  onChange,
  onClose,
}: {
  index: number | null;
  days: DaySummary[];
  whys: Why[];
  forecast: Forecast;
  spot: Spot;
  activity: Activity;
  units: Units;
  water: Water;
  now: number;
  onChange: (i: number) => void;
  onClose: () => void;
}) {
  const d = index != null ? days[index] : undefined;
  return (
    <Modal visible={!!d} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
        {d && index != null ? (
          <Body
            index={index}
            d={d}
            why={whys[index]}
            count={days.length}
            forecast={forecast}
            spot={spot}
            activity={activity}
            units={units}
            water={water}
            now={now}
            onChange={onChange}
            onClose={onClose}
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

function Body({
  index,
  d,
  why,
  count,
  forecast,
  spot,
  activity,
  units,
  water,
  now,
  onChange,
  onClose,
}: {
  index: number;
  d: DaySummary;
  why: Why;
  count: number;
  forecast: Forecast;
  spot: Spot;
  activity: Activity;
  units: Units;
  water: Water;
  now: number;
  onChange: (i: number) => void;
  onClose: () => void;
}) {
  const off = forecast.utcOffset * 1000;
  const dayOf = (t: number) => Math.floor((t + off) / 86400000);
  const day = dayOf(d.time);
  const hours = forecast.hours.filter((h) => dayOf(h.time) === day && h.time + 3600 * 1000 > now);
  const tides = forecast.tides.filter((t) => dayOf(t.time) === day);
  const water0 = hours.map((h) => h.waterTemp).filter((x): x is number => x != null);
  const waterTemp = water0.length ? water0.reduce((a, b) => a + b, 0) / water0.length : null;
  const swell = Math.max(...hours.filter((h) => h.isDay).map((h) => h.swellHeight ?? 0), 0);
  const period = hours.find((h) => h.isDay && h.swellPeriod != null)?.swellPeriod ?? null;
  const daylight = hours.filter((h) => h.isDay);
  const sunrise = daylight[0]?.time;
  const sunset = daylight.length ? daylight[daylight.length - 1].time + 3600 * 1000 : undefined;
  const seasLabel = water === 'inshore' ? 'Chop' : 'Seas';
  const wind =
    d.windMin != null && d.windMax != null && Math.round(d.windMin) !== Math.round(d.windMax)
      ? `${windSpeed(d.windMin, units).split(' ')[0]} to ${windSpeed(d.windMax, units)}`
      : windSpeed(d.windMax, units);
  const kind = dayKind(d);

  return (
    <>
      <View style={styles.bar}>
        <Pressable onPress={onClose} style={styles.back} accessibilityRole="button" accessibilityLabel="Back to the forecast">
          <Icon name="chevron.left" size={16} color={C.background} />
          <ThemedText style={styles.backText}>Back</ThemedText>
        </Pressable>
        <View style={styles.nav}>
          <Pressable
            disabled={index === 0}
            onPress={() => onChange(index - 1)}
            style={[styles.navBtn, index === 0 && styles.off]}
            accessibilityLabel="Previous day">
            <Icon name="chevron.left" size={16} color={C.text} />
          </Pressable>
          <Pressable
            disabled={index >= count - 1}
            onPress={() => onChange(index + 1)}
            style={[styles.navBtn, index >= count - 1 && styles.off]}
            accessibilityLabel="Next day">
            <Icon name="chevron.right" size={16} color={C.text} />
          </Pressable>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.hero}>
          {kind ? <SkyIcon kind={kind} size={56} /> : null}
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.dayTitle}>{dayLabel(d.time, forecast.utcOffset, now)}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {spot.name} · {weatherText(d.weatherCode)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.rate}>
          <ThemedText type="small" themeColor="textSecondary">
            {activity.name}
          </ThemedText>
          {d.trend ? (
            <>
              <VerdictPill verdict={d.trend[0].verdict} />
              <TrendText steps={d.trend} utcOffset={forecast.utcOffset} afterPill />
            </>
          ) : d.verdict ? (
            <VerdictPill verdict={d.verdict} />
          ) : null}
          {d.trend ? null : d.window ? (
            <ThemedText type="smallBold" style={{ color: VerdictColor[d.window.verdict] }}>
              {VerdictLabel[d.window.verdict]} {clock(d.window.start, forecast.utcOffset)} to{' '}
              {clock(d.window.end, forecast.utcOffset)}
            </ThemedText>
          ) : d.best && d.verdict !== 'nogo' ? (
            <ThemedText type="small" themeColor="textSecondary">
              best {clock(d.best.hour.time, forecast.utcOffset)}
            </ThemedText>
          ) : null}
        </View>

        {why ? (
          <ThemedText style={styles.why}>
            {why.lead ? <ThemedText style={[styles.why, { fontWeight: 700 }]}>{why.lead} </ThemedText> : null}
            {why.text}
          </ThemedText>
        ) : null}

        <View style={styles.stats}>
          <Stat
            label="Wind"
            value={wind}
            detail={`${d.windDir != null ? `From ${compass(d.windDir)} · ` : ''}gusts ${windSpeed(d.gustMax, units)}`}
          />
          <Stat
            label={seasLabel}
            value={height(d.waveMax, units)}
            detail={
              water === 'inshore'
                ? 'Estimated bay chop'
                : `Swell ${height(swell, units)}${period != null ? ` at ${Math.round(period)} s` : ''}`
            }
          />
          <Stat
            label="Rain"
            value={d.precipChance != null ? `${d.precipChance}%` : '–'}
            detail="Highest chance in any hour"
          />
          <Stat
            label="Temperature"
            value={`${temperature(d.high, units)} / ${temperature(d.low, units)}`}
            detail={waterTemp != null ? `Water ${temperature(waterTemp, units)}` : 'High / low'}
          />
          {sunrise != null && sunset != null ? (
            <Stat
              label="Daylight"
              value={`${clock(sunrise, forecast.utcOffset)} – ${clock(sunset, forecast.utcOffset)}`}
              detail="Roughly sunrise to sunset"
            />
          ) : null}
        </View>

        {tides.length ? (
          <ThemedText type="small">
            <ThemedText type="smallBold" style={{ color: C.accent }}>
              TIDES{'  '}
            </ThemedText>
            {tides.map((t) => `${t.type === 'high' ? 'High' : 'Low'} ${clock(t.time, forecast.utcOffset)}`).join(' · ')}
          </ThemedText>
        ) : null}

        <ThemedText type="smallBold" style={{ marginTop: Spacing.two }}>
          Hour by hour
          <ThemedText type="small" themeColor="textSecondary">
            {'  '}dimmed = dark
          </ThemedText>
        </ThemedText>
        <Card style={styles.table}>
          <View style={[styles.row, styles.head]}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.cTime}>
              Time
            </ThemedText>
            <View style={styles.cIcon} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.cWind}>
              Wind
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.cNum}>
              {seasLabel}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.cNum}>
              Rain
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.cNum}>
              Temp
            </ThemedText>
          </View>
          {hours.map((h) => {
            const v = rateHour(h, activity, spot).verdict;
            const seas = activity.id === 'surfing' ? Math.max(h.waveHeight ?? 0, h.swellHeight ?? 0) : h.waveHeight;
            return (
              <View key={h.time} style={[styles.row, !h.isDay && styles.night]}>
                <ThemedText type="small" style={styles.cTime}>
                  {clock(h.time, forecast.utcOffset)}
                </ThemedText>
                <View style={[styles.cIcon, styles.iconCell]}>
                  <SkyIcon kind={hourKind(h)} size={22} />
                  <View style={[styles.dot, { backgroundColor: VerdictColor[v] }]} />
                </View>
                <ThemedText type="small" style={styles.cWind}>
                  {compass(h.windDir)} {h.wind != null ? Math.round(h.wind) : '–'}
                  <ThemedText type="small" themeColor="textSecondary">
                    {h.gusts != null ? ` g${Math.round(h.gusts)}` : ''}
                  </ThemedText>
                </ThemedText>
                <ThemedText type="small" style={styles.cNum}>
                  {height(seas, units)}
                </ThemedText>
                <ThemedText type="small" style={styles.cNum}>
                  {h.precipChance != null ? `${h.precipChance}%` : '–'}
                </ThemedText>
                <ThemedText type="small" style={styles.cNum}>
                  {temperature(h.airTemp, units)}
                </ThemedText>
              </View>
            );
          })}
        </Card>
        <ThemedText type="small" themeColor="textSecondary">
          Wind in {units === 'metric' ? 'km/h' : 'knots'}. The dot is the {activity.name.toLowerCase()} rating for that hour.
        </ThemedText>
      </ScrollView>
    </>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card style={styles.stat}>
      <ThemedText type="small" themeColor="textSecondary">
        {label.toUpperCase()}
      </ThemedText>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {detail}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingLeft: 12,
    paddingRight: 18,
    borderRadius: 999,
    backgroundColor: C.accent,
  },
  backText: { color: C.background, fontWeight: 700, fontSize: 17 },
  nav: { marginLeft: 'auto', flexDirection: 'row', gap: Spacing.two },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  off: { opacity: 0.35 },
  body: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.five },
  hero: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  dayTitle: { fontSize: 28, lineHeight: 34, fontWeight: 800 },
  rate: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two },
  why: { fontSize: 16, lineHeight: 23 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  stat: { flexGrow: 1, flexBasis: '45%', gap: 2 },
  statValue: { fontSize: 19, lineHeight: 25, fontWeight: 700 },
  table: { paddingVertical: Spacing.one, gap: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  head: { paddingVertical: 6 },
  night: { opacity: 0.5 },
  cTime: { width: 48 },
  cIcon: { width: 44 },
  iconCell: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  cWind: { flex: 1 },
  cNum: { width: 52, textAlign: 'right' },
});
