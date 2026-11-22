import { useMemo, useState } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Card, Icon } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import type { HourForecast, TideEvent } from '@/lib/forecast';
import { clock, compass, type Units } from '@/lib/format';
import { moonInfo } from '@/lib/moon';

const Dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekday = (time: number, utcOffset: number) => Dow[new Date(time + utcOffset * 1000).getUTCDay()];

const C = Colors.dark;

type Series = { values: (number | null)[]; color: string; fill?: boolean; label: string };

/** A small 72-hour line chart: night shaded, a line per series, a dashed reference line if given. */
function LineChart({
  hours,
  series,
  unit,
  utcOffset,
  now,
  refLine,
  sel,
  onSel,
  minZero = true,
  marks,
}: {
  hours: HourForecast[];
  series: Series[];
  unit: string;
  utcOffset: number;
  now: number;
  refLine?: { value: number; label: string };
  /** The hour picked by touch, shared by every chart on the screen. */
  sel: number;
  onSel: (i: number) => void;
  minZero?: boolean;
  marks?: { i: number; label: string; up: boolean }[];
}) {
  const [width, setWidth] = useState(0);
  const n = hours.length;
  // Tap to pick an hour; drag sideways to scrub. Up-and-down drags are left to the page scroll.
  const pan = useMemo(() => {
    const iwPx = Math.max(1, width - 30 - 8);
    const pick = (px: number) => onSel(Math.max(0, Math.min(n - 1, Math.round(((px - 30) / iwPx) * (n - 1)))));
    return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderGrant: (e) => pick(e.nativeEvent.locationX),
        onPanResponderMove: (e) => pick(e.nativeEvent.locationX),
        onPanResponderTerminationRequest: (_, g) => Math.abs(g.dy) > Math.abs(g.dx),
      });
  }, [width, n, onSel]);
  const H = 170;
  const L = 30;
  const R = 8;
  const T = 10;
  const B = 22;
  const vals = series.flatMap((s) => s.values.filter((v): v is number => v != null));
  if (!n || !vals.length) return null;
  let hi = Math.max(...vals, refLine && Math.max(...vals) >= refLine.value * 0.7 ? refLine.value : 0);
  let lo = minZero ? 0 : Math.min(...vals);
  if (hi - lo < 1) hi = lo + 1;
  const step = niceStep((hi - lo) / 4);
  hi = Math.ceil(hi / step) * step;
  lo = Math.floor(lo / step) * step;
  const iw = Math.max(1, width - L - R);
  const ih = H - T - B;
  const x = (i: number) => L + (n === 1 ? 0 : (i / (n - 1)) * iw);
  const y = (v: number) => T + ih - ((v - lo) / (hi - lo)) * ih;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + 1e-9; v += step) ticks.push(v);

  // Night bands
  const bands: [number, number][] = [];
  let start: number | null = null;
  hours.forEach((h, i) => {
    if (!h.isDay && start == null) start = i;
    if ((h.isDay || i === n - 1) && start != null) {
      bands.push([start, h.isDay ? i - 1 : i]);
      start = null;
    }
  });

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={{ height: H }}
      accessible
      accessibilityRole="adjustable"
      accessibilityHint="Swipe up or down to step through the hours"
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onSel(Math.max(0, Math.min(n - 1, sel + (e.nativeEvent.actionName === 'increment' ? 1 : -1))))}
      {...pan.panHandlers}>
      {width > 0 ? (
        <Svg width={width} height={H} accessibilityLabel={`72-hour chart in ${unit}`}>
          {bands.map(([a, b]) => (
            <Rect
              key={a}
              x={x(Math.max(0, a - 0.5))}
              y={T}
              width={Math.max(2, x(Math.min(n - 1, b + 0.5)) - x(Math.max(0, a - 0.5)))}
              height={ih}
              fill={C.backgroundSelected}
              opacity={0.5}
            />
          ))}
          {ticks.map((v) => (
            <Line key={'g' + v} x1={L} x2={width - R} y1={y(v)} y2={y(v)} stroke={C.border} strokeWidth={1} />
          ))}
          {ticks.map((v) => (
            <SvgText key={'t' + v} x={L - 5} y={y(v) + 4} fontSize={11} fill={C.textSecondary} textAnchor="end">
              {String(+v.toFixed(1))}
            </SvgText>
          ))}
          {hours.map((h, i) => {
            const label = clock(h.time, utcOffset);
            if (label !== '12am' && label !== '12pm') return null;
            return (
              <SvgText key={'x' + i} x={x(i)} y={H - 6} fontSize={11} fill={C.textSecondary} textAnchor="middle">
                {label === '12am' ? weekday(h.time, utcOffset) : 'noon'}
              </SvgText>
            );
          })}
          {refLine && refLine.value <= hi ? (
            <>
              <Line x1={L} x2={width - R} y1={y(refLine.value)} y2={y(refLine.value)} stroke={C.maybe} strokeDasharray="5 4" strokeWidth={1.5} />
              <SvgText x={width - R - 2} y={y(refLine.value) - 4} fontSize={10} fill={C.maybe} textAnchor="end">
                {refLine.label}
              </SvgText>
            </>
          ) : null}
          {series.map((s) => {
            const pts: [number, number][] = [];
            s.values.forEach((v, i) => {
              if (v != null) pts.push([x(i), y(v)]);
            });
            if (pts.length < 2) return null;
            const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('');
            return (
              <G key={s.label}>
                {s.fill ? (
                  <Path d={`${d}L${pts[pts.length - 1][0].toFixed(1)} ${T + ih}L${pts[0][0].toFixed(1)} ${T + ih}Z`} fill={s.color} opacity={0.15} />
                ) : null}
                <Path d={d} stroke={s.color} strokeWidth={2.2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
                <Circle cx={pts[0][0]} cy={pts[0][1]} r={3.5} fill={s.color} />
              </G>
            );
          })}
          {(marks ?? []).map((m) => {
            const v = series[0]?.values[m.i];
            if (v == null) return null;
            return (
              <G key={'m' + m.i}>
                <Circle cx={x(m.i)} cy={y(v)} r={3} fill={series[0].color} />
                <SvgText x={Math.min(width - R - 1, Math.max(L + 1, x(m.i)))} y={m.up ? y(v) - 7 : y(v) + 14} fontSize={10} fontWeight="600" fill={C.text} textAnchor={x(m.i) > width - R - 24 ? 'end' : x(m.i) < L + 24 ? 'start' : 'middle'}>
                  {m.label}
                </SvgText>
              </G>
            );
          })}
          <Line x1={x(sel)} x2={x(sel)} y1={T} y2={T + ih} stroke={C.text} strokeWidth={1.2} />
          {series.map((s) => {
            const v = s.values[sel];
            return v == null ? null : <Circle key={'s' + s.label} cx={x(sel)} cy={y(v)} r={5} fill={s.color} stroke={C.background} strokeWidth={2} />;
          })}
        </Svg>
      ) : null}
    </View>
  );
}

function niceStep(r: number) {
  const p = Math.pow(10, Math.floor(Math.log10(r || 1)));
  const f = r / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
}

function Key({ items }: { items: { color: string; label: string }[] }) {
  return (
    <View style={styles.key}>
      {items.map((k) => (
        <View key={k.label} style={styles.keyItem}>
          <View style={[styles.swatch, { backgroundColor: k.color }]} />
          <ThemedText type="small" themeColor="textSecondary">
            {k.label}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

/** Smooth hourly tide curve from NOAA high/low times (half-cosine between each turn). */
function tideCurve(hours: HourForecast[], tides: TideEvent[]): (number | null)[] {
  return hours.map((h) => {
    const k = tides.findIndex((t) => t.time > h.time);
    if (k <= 0) return null;
    const a = tides[k - 1];
    const b = tides[k];
    const f = (h.time - a.time) / (b.time - a.time);
    return a.height + (b.height - a.height) * (1 - Math.cos(Math.PI * f)) / 2;
  });
}

/** Wind, seas and tide for the next 72 hours, as on the website. Touch any chart to read that hour on all three. */
export function ForecastCharts({
  hours,
  units,
  utcOffset,
  now,
  inshore,
  tides = [],
  sel: selProp,
  onSel,
}: {
  hours: HourForecast[];
  units: Units;
  utcOffset: number;
  now: number;
  inshore?: boolean;
  tides?: TideEvent[];
  /** Optional: the selected hour, shared with the 72-hour strip. */
  sel?: number;
  onSel?: (i: number) => void;
}) {
  const [selInner, setSelRaw] = useState(0);
  const sel = selProp ?? selInner;
  // A tapped day in the moon calendar; moving the chart marker hands the moon back to the charts.
  const [moonDay, setMoonDay] = useState<number | null>(null);
  const setSel = useMemo(
    () => (i: number) => {
      setSelRaw(i);
      onSel?.(i);
      setMoonDay(null);
    },
    [onSel],
  );
  const moonDays = useMemo(() => {
    const t0 = new Date(now);
    t0.setHours(12, 0, 0, 0);
    return Array.from({ length: 14 }, (_, d) => t0.getTime() + d * 864e5);
  }, [now]);
  const metric = units === 'metric';
  const w = (v: number | null) => (v == null ? null : metric ? v * 1.852 : v);
  const h = (v: number | null) => (v == null ? null : metric ? v / 3.28084 : v);
  const windUnit = metric ? 'km/h' : 'knots';
  const seaUnit = metric ? 'meters' : 'feet';
  const wu = metric ? 'km/h' : 'kt';
  const hu = metric ? 'm' : 'ft';
  const gustColor = '#8FB7C0';
  const tideColor = '#4FB3BF';
  const r0 = (v: number | null) => (v == null ? '—' : String(Math.round(v)));
  const r1 = (v: number | null) => (v == null ? '—' : (Math.round(v * 10) / 10).toFixed(1));
  const tide = useMemo(() => tideCurve(hours, tides), [hours, tides]);
  const tideMarks = useMemo(
    () =>
      tides
        .map((t) => {
          const i = hours.findIndex((x) => Math.abs(x.time - t.time) <= 30 * 60 * 1000);
          return i < 0 ? null : { i, label: `${t.type === 'high' ? 'H' : 'L'} ${clock(t.time, utcOffset).replace(/m$/, '')}`, up: t.type === 'high' };
        })
        .filter((m): m is { i: number; label: string; up: boolean } => m != null),
    [hours, tides, utcOffset],
  );
  const hasTide = tide.some((v) => v != null);
  const x = hours[Math.min(sel, hours.length - 1)];
  if (!x) return null;
  const when = sel === 0 ? 'Now' : `${weekday(x.time, utcOffset)} ${clock(x.time, utcOffset)}`;
  const tv = tide[sel];
  const tPrev = tide[Math.max(0, sel - 1)];
  const tNext = tide[Math.min(tide.length - 1, sel + 1)];
  const nextTurn = tides.find((t) => t.time > x.time);
  const trend = tv == null || tPrev == null || tNext == null ? '' : Math.abs(tNext - tPrev) < 0.03 ? 'slack' : tNext > tPrev ? 'rising' : 'falling';
  const common = { hours, utcOffset, now, sel, onSel: setSel };
  return (
    <>
      <ThemedText type="small" themeColor="textSecondary">
        Tap an hour above, or touch or drag across any chart. The hours, charts and moon all move together.
      </ThemedText>
      <Card style={{ gap: Spacing.two }}>
        <ThemedText type="smallBold">Wind, next 72 hours ({windUnit})</ThemedText>
        <Key items={[{ color: C.accent, label: 'Sustained' }, { color: gustColor, label: 'Gusts' }]} />
        <LineChart
          {...common}
          unit={windUnit}
          refLine={{ value: metric ? 37 : 20, label: metric ? '37 km/h small craft' : '20 kt small craft' }}
          series={[
            { label: 'gusts', color: gustColor, values: hours.map((v) => w(v.gusts)) },
            { label: 'wind', color: C.accent, fill: true, values: hours.map((v) => w(v.wind)) },
          ]}
        />
        <Readout when={when} text={x.wind == null ? 'No wind data' : `${r0(w(x.wind))} ${wu} from ${compass(x.windDir)} · gusts ${r0(w(x.gusts))} ${wu}`} />
      </Card>
      <Card style={{ gap: Spacing.two }}>
        <ThemedText type="smallBold">
          {inshore ? 'Bay chop' : 'Seas and swell'}, next 72 hours ({seaUnit})
        </ThemedText>
        <Key
          items={
            inshore
              ? [{ color: C.go, label: 'Estimated chop' }]
              : [
                  { color: C.go, label: 'Combined seas' },
                  { color: C.maybe, label: 'Swell' },
                ]
          }
        />
        <LineChart
          {...common}
          unit={seaUnit}
          series={[
            ...(inshore ? [] : [{ label: 'swell', color: C.maybe, values: hours.map((v) => h(v.swellHeight)) }]),
            { label: 'seas', color: C.go, fill: true, values: hours.map((v) => h(v.waveHeight)) },
          ]}
        />
        <Readout
          when={when}
          text={
            x.waveHeight == null
              ? 'No sea data'
              : inshore
                ? `Chop ${r1(h(x.waveHeight))} ${hu}`
                : `Seas ${r1(h(x.waveHeight))} ${hu}${x.wavePeriod != null ? ` at ${r0(x.wavePeriod)} s` : ''}` +
                  (x.swellHeight != null
                    ? ` · swell ${r1(h(x.swellHeight))} ${hu}${x.swellPeriod != null ? ` at ${r0(x.swellPeriod)} s` : ''}${x.swellDir != null ? ` from ${compass(x.swellDir)}` : ''}`
                    : '')
          }
        />
      </Card>
      {hasTide ? (
        <Card style={{ gap: Spacing.two }}>
          <ThemedText type="smallBold">Tide, next 72 hours ({seaUnit} above low water)</ThemedText>
          <LineChart
            {...common}
            unit={seaUnit}
            minZero={false}
            marks={tideMarks}
            series={[{ label: 'tide', color: tideColor, values: tide.map((v) => h(v)) }]}
          />
          <Readout
            when={when}
            text={
              tv == null
                ? 'No tide data for this hour'
                : `${r1(h(tv))} ${hu}${trend ? ` · ${trend}` : ''}${nextTurn ? ` · next ${nextTurn.type} ${weekday(nextTurn.time, utcOffset) === weekday(x.time, utcOffset) ? '' : weekday(nextTurn.time, utcOffset) + ' '}${clock(nextTurn.time, utcOffset)}` : ''}`
            }
          />
        </Card>
      ) : null}
      <MoonCard
        time={moonDay ?? x.time}
        label={moonDay != null ? (moonDay === moonDays[0] ? 'Today' : new Date(moonDay).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })) : when}
        isDay={moonDay != null}
        days={moonDays}
        picked={moonDay}
        onPick={setMoonDay}
      />
    </>
  );
}

function MoonCard({
  time,
  label,
  isDay,
  days,
  picked,
  onPick,
}: {
  time: number;
  label: string;
  isDay: boolean;
  days: number[];
  picked: number | null;
  onPick: (ms: number) => void;
}) {
  const m = moonInfo(time);
  return (
    <Card style={{ gap: Spacing.two }}>
      <ThemedText type="smallBold">Moon</ThemedText>
      <View style={styles.moonNow}>
        <Icon name={m.symbol} size={44} color="#F4E9C8" />
        <View style={{ flex: 1 }}>
          <ThemedText type="small">
            <ThemedText type="smallBold" style={{ color: C.accent }}>
              {label}
            </ThemedText>
            {'  '}
            {m.pct}% lit · {m.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {isDay && m.soon ? 'Expect bigger tide swings around this day' : m.next}
          </ThemedText>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {days.map((ms, i) => {
          const d = moonInfo(ms);
          const dt = new Date(ms);
          const on = picked === ms;
          return (
            <Pressable
              key={ms}
              onPress={() => onPick(ms)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${dt.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}: ${d.name}, ${d.pct}% lit`}
              style={[styles.moonDay, d.soon && { borderColor: C.maybe }, on && { borderColor: C.accent, borderWidth: 2 }]}>
              <ThemedText type="smallBold">{i === 0 ? 'Today' : dt.toLocaleDateString('en-US', { weekday: 'short' })}</ThemedText>
              <Icon name={d.symbol} size={22} color="#F4E9C8" />
              <ThemedText type="small" themeColor="textSecondary">
                {dt.getDate()}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {d.pct}%
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
      <ThemedText type="small" themeColor="textSecondary">
        Tides swing the most around full and new moon. Tap a day, or move the chart marker.
      </ThemedText>
    </Card>
  );
}

function Readout({ when, text }: { when: string; text: string }) {
  return (
    <ThemedText type="small">
      <ThemedText type="smallBold" style={{ color: C.accent }}>
        {when}
      </ThemedText>
      {'  '}
      {text}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  key: { flexDirection: 'row', gap: Spacing.three },
  keyItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 14, height: 3, borderRadius: 2 },
  moonNow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  moonDay: {
    alignItems: 'center',
    gap: 3,
    minWidth: 52,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.backgroundElement,
  },
});
