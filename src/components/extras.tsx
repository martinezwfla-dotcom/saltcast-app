import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Icon, VerdictPill } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import type { ActivityId } from '@/data/activities';
import { nearestArea, type LocalLink } from '@/data/local';
import type { Spot } from '@/data/spots';
import { loadStations, pickStations, stationLabel, type Station } from '@/lib/buoys';
import { WaterLabels, type Forecast, type Water } from '@/lib/forecast';
import { clock, compass, dayLabel, height, temperature, windSpeed, type Units } from '@/lib/format';
import { tideFishing } from '@/lib/tide-fishing';
import type { TropicalAlert } from '@/lib/tropical';

const C = Colors.dark;

/** Inshore / Nearshore / Offshore, as on the website. */
export function WaterPicker({ value, onChange, activityId }: { value: Water; onChange: (w: Water) => void; activityId: ActivityId }) {
  const surfing = activityId === 'surfing';
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.segment} accessibilityRole="radiogroup" accessibilityLabel="Which water">
        {(Object.keys(WaterLabels) as Water[]).map((w) => {
          const on = (surfing ? 'near' : value) === w;
          return (
            <Pressable
              key={w}
              onPress={() => onChange(w)}
              disabled={surfing}
              accessibilityRole="radio"
              accessibilityState={{ selected: on, disabled: surfing }}
              style={[styles.segItem, on && styles.segOn, surfing && !on && { opacity: 0.4 }]}>
              <ThemedText type="smallBold" style={{ color: on ? C.background : C.text }}>
                {WaterLabels[w].label}
              </ThemedText>
              <ThemedText style={[styles.segDesc, { color: on ? C.background : C.textSecondary }]}>{WaterLabels[w].desc}</ThemedText>
            </Pressable>
          );
        })}
      </View>
      {surfing ? (
        <ThemedText type="small" themeColor="textSecondary">
          Surf forecasts are always for the beach (Nearshore).
        </ThemedText>
      ) : null}
    </View>
  );
}

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  return m < 2 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} hr ago`;
};

/** Live NOAA buoy and coastal station readings near the spot. */
export function BuoyCard({ spot, water, units }: { spot: Spot; water: Water; units: Units }) {
  const [stations, setStations] = useState<(Station & { miles: number })[]>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    const run = () =>
      loadStations()
        .then((all) => live && (setStations(pickStations(all, spot.lat, spot.lon, water)), setFailed(false)))
        .catch(() => live && setFailed(true));
    run();
    const timer = setInterval(run, 10 * 60 * 1000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [spot.lat, spot.lon, water]);

  const title = water === 'off' ? 'Live offshore buoys' : water === 'inshore' ? 'Live inshore stations' : 'Live buoys near the beach';
  return (
    <Card>
      <View style={styles.rowCenter}>
        <View style={styles.liveDot} />
        <ThemedText type="smallBold">{title}</ThemedText>
      </View>
      {failed ? (
        <ThemedText type="small" themeColor="textSecondary">
          Live buoy readings are unavailable right now.
        </ThemedText>
      ) : !stations ? (
        <ActivityIndicator color={C.accent} />
      ) : !stations.length ? (
        <ThemedText type="small" themeColor="textSecondary">
          No stations reporting nearby right now.
        </ThemedText>
      ) : (
        stations.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => WebBrowser.openBrowserAsync(`https://www.ndbc.noaa.gov/station_page.php?station=${s.id.toLowerCase()}`)}
            accessibilityRole="link"
            style={styles.station}>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText type="smallBold" themeColor="accent">
                {stationLabel(s)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {Math.round(s.miles)} mi away · {ago(s.time)}
              </ThemedText>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              {s.wind != null ? (
                <ThemedText type="smallBold">
                  {compass(s.windDir)} {windSpeed(s.wind, units)}
                  {s.gust != null ? ` g${Math.round(units === 'metric' ? s.gust * 1.852 : s.gust)}` : ''}
                </ThemedText>
              ) : null}
              <ThemedText type="small">
                {[
                  s.waves != null ? `${height(s.waves, units)}${s.period != null ? ` @ ${Math.round(s.period)}s` : ''}` : '',
                  s.waterTemp != null ? `${temperature(s.waterTemp, units)} water` : '',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </ThemedText>
            </View>
          </Pressable>
        ))
      )}
      <Pressable onPress={() => WebBrowser.openBrowserAsync('https://www.ndbc.noaa.gov/obs.shtml')} accessibilityRole="link">
        <ThemedText type="small" themeColor="accent">
          NOAA National Data Buoy Center map
        </ThemedText>
      </Pressable>
    </Card>
  );
}

function LinkList({ title, links }: { title: string; links: LocalLink[] }) {
  return (
    <View style={styles.list}>
      <ThemedText type="small" themeColor="textSecondary">
        {title} · opens in your browser
      </ThemedText>
      {links.map((l) => (
        <Pressable key={l.url} onPress={() => WebBrowser.openBrowserAsync(l.url)} accessibilityRole="link" style={styles.rowCenter}>
          <Icon name="arrow.up.right.square" size={14} />
          <ThemedText type="small" themeColor="accent" style={{ flex: 1 }}>
            {l.title}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

/** Live cams and local fishing or surf reports for the spot's area. */
export function LocalCard({ spot, activityId }: { spot: Spot; activityId: ActivityId }) {
  const [open, setOpen] = useState<'cams' | 'report'>();
  const near = nearestArea(spot.lat, spot.lon);
  if (!near) return null;
  const { area, exact } = near;
  const report = activityId === 'surfing' ? area.surfing : area.fishing;
  const reportName = activityId === 'surfing' ? 'surf' : 'fishing';
  const where = exact ? spot.name : `the ${area.name} area`;
  return (
    <Card>
      <View style={styles.buttons}>
        {area.cams.length ? (
          <Pressable onPress={() => setOpen(open === 'cams' ? undefined : 'cams')} style={[styles.btn, open === 'cams' && styles.btnOn]} accessibilityRole="button">
            <Icon name="video" size={14} color={open === 'cams' ? C.background : C.accent} />
            <ThemedText type="smallBold" style={{ color: open === 'cams' ? C.background : C.text }}>
              Live cams
            </ThemedText>
          </Pressable>
        ) : null}
        {report.length ? (
          <Pressable onPress={() => setOpen(open === 'report' ? undefined : 'report')} style={[styles.btn, open === 'report' && styles.btnOn]} accessibilityRole="button">
            <Icon name="doc.text" size={14} color={open === 'report' ? C.background : C.accent} />
            <ThemedText type="smallBold" style={{ color: open === 'report' ? C.background : C.text }}>
              Local {reportName} report
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
      {open === 'cams' ? <LinkList title={`Live cams near ${where}`} links={area.cams} /> : null}
      {open === 'report' ? <LinkList title={`Local ${reportName} report for ${where}`} links={report} /> : null}
    </Card>
  );
}

/** Incoming and outgoing tide stretches in daylight for today and the next two days. */
export function TideFishingCard({ forecast, spot, now }: { forecast: Forecast; spot: Spot; now: number }) {
  const days = tideFishing(forecast, spot, now);
  const near = nearestArea(spot.lat, spot.lon);
  const season = near?.exact ? near.area.season : undefined;
  if (!days.length && !season) return null;
  const off = forecast.utcOffset;
  return (
    <Card>
      <ThemedText style={styles.title}>Best fishing times</ThemedText>
      {season ? (
        <ThemedText type="small">
          <ThemedText type="smallBold" themeColor="accent">
            SEASON{'  '}
          </ThemedText>
          {season}
        </ThemedText>
      ) : null}
      <ThemedText type="small" themeColor="textSecondary">
        Fish feed best while the tide is moving. These are the incoming and outgoing stretches in daylight, skipping the slack water
        around each high and low. Tides from NOAA {spot.tideStation.name}.
      </ThemedText>
      {days.map((d) => (
        <View key={d.day} style={styles.tideDay}>
          <ThemedText type="smallBold">{dayLabel(d.day, off, now)}</ThemedText>
          {d.stretches.length ? (
            d.stretches.map((s) => (
              <View key={s.start} style={[styles.stretch, s.best && styles.stretchBest]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <ThemedText type="smallBold">
                    {clock(s.start, off)} to {clock(s.end, off)}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {s.direction} tide · {s.range.toFixed(1)} ft
                    {s.prime ? ` · ${s.prime}` : ''}
                    {s.best ? ' · Best bet' : ''}
                  </ThemedText>
                </View>
                {s.verdict ? <VerdictPill verdict={s.verdict} /> : null}
              </View>
            ))
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              No moving tide in daylight.
            </ThemedText>
          )}
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', gap: 6 },
  segItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: C.backgroundElement,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  segOn: { backgroundColor: C.accent, borderColor: C.accent },
  segDesc: { fontSize: 11, lineHeight: 14 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.go },
  station: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: 10,
    borderRadius: 12,
    backgroundColor: C.backgroundSelected,
  },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.accent,
  },
  btnOn: { backgroundColor: C.accent },
  list: { gap: 8, paddingTop: 4 },
  title: { fontSize: 17, lineHeight: 22, fontWeight: 700 },
  tideDay: { gap: 6, paddingTop: Spacing.one },
  stretch: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: 10, borderRadius: 12, backgroundColor: C.backgroundSelected },
  stretchBest: { borderWidth: 1, borderColor: C.go },
});

/**
 * Safety heads-up for the next 12 hours, the same checks as the website's alert box:
 * tropical warnings and watches, lightning, gale force, small craft and caution levels,
 * rip currents for surfing, and the hurricane season reminder.
 */
export function SafetyAlerts({
  hours,
  activityId,
  tropical,
  utcOffset,
  onTracker,
}: {
  hours: Forecast['hours'];
  activityId: ActivityId;
  tropical?: TropicalAlert;
  utcOffset: number;
  onTracker: () => void;
}) {
  const next12 = hours.slice(0, 12);
  const alerts: { level: 'nogo' | 'warn'; title: string; text: string }[] = [];
  if (tropical) {
    alerts.push({
      level: tropical.level === 'warn' ? 'nogo' : 'warn',
      title: tropical.event,
      text:
        tropical.level === 'warn'
          ? 'In effect here. Stay off the water and follow local emergency orders.'
          : 'In effect here. Tropical storm or hurricane conditions are possible within 48 hours.',
    });
  }
  const storm = next12.find((h) => h.weatherCode != null && h.weatherCode >= 95);
  if (storm) {
    alerts.push({
      level: 'nogo',
      title: 'Lightning',
      text: `Thunderstorms in the forecast within 12 hours, starting around ${clock(storm.time, utcOffset)}. Get off the water before storms arrive.`,
    });
  }
  const maxW = Math.max(0, ...next12.map((h) => h.wind ?? 0));
  const maxH = Math.max(0, ...next12.map((h) => h.waveHeight ?? 0));
  const r1 = (v: number) => (Math.round(v * 10) / 10).toFixed(1);
  if (maxW >= 34) {
    alerts.push({ level: 'nogo', title: 'Gale force', text: `Winds reach ${Math.round(maxW)} kt in the next 12 hours.` });
  } else if (maxW >= 20 || maxH >= 7) {
    alerts.push({
      level: 'warn',
      title: 'Small craft',
      text: `Advisory-level conditions in the next 12 hours: wind up to ${Math.round(maxW)} kt, seas up to ${r1(maxH)} ft. Check for an official NWS advisory.`,
    });
  } else if (maxW >= 15 || maxH >= 4) {
    alerts.push({
      level: 'warn',
      title: 'Caution',
      text: `Wind up to ${Math.round(maxW)} kt and seas up to ${r1(maxH)} ft in the next 12 hours. Small boats use caution.`,
    });
  }
  const surf = Math.max(next12[0]?.waveHeight ?? 0, next12[0]?.swellHeight ?? 0);
  if (activityId === 'surfing' && surf >= 3) {
    alerts.push({ level: 'warn', title: 'Rip currents', text: 'Surf of 3 ft or more raises rip-current risk. Swim near a lifeguard.' });
  }
  const month = new Date().getMonth() + 1;
  const season = !tropical && month >= 6 && month <= 11;
  if (!alerts.length && !season) return null;
  return (
    <Card style={{ gap: Spacing.two }}>
      {alerts.map((a) => (
        <View key={a.title} style={[safety.row, { borderLeftColor: a.level === 'nogo' ? Colors.dark.noGo : Colors.dark.maybe }]}>
          <ThemedText type="smallBold" style={{ color: a.level === 'nogo' ? Colors.dark.noGo : Colors.dark.maybe }}>
            {a.title}
          </ThemedText>
          <ThemedText type="small">{a.text}</ThemedText>
        </View>
      ))}
      {season ? (
        <Pressable onPress={onTracker} accessibilityRole="button" style={[safety.row, { borderLeftColor: Colors.dark.border }]}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Hurricane season
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            June through November. Check the hurricane tracker before any trip offshore.
          </ThemedText>
        </Pressable>
      ) : tropical ? (
        <Pressable onPress={onTracker} accessibilityRole="link">
          <ThemedText type="smallBold" themeColor="accent">
            Open the hurricane tracker
          </ThemedText>
        </Pressable>
      ) : null}
    </Card>
  );
}

const safety = StyleSheet.create({
  row: { borderLeftWidth: 3, paddingLeft: 10, gap: 2 },
});
