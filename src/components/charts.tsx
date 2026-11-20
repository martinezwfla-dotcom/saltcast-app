import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import type { HourForecast } from '@/lib/forecast';
import { clock, type Units } from '@/lib/format';

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
}: {
  hours: HourForecast[];
  series: Series[];
  unit: string;
  utcOffset: number;
  now: number;
  refLine?: { value: number; label: string };
}) {
  const [width, setWidth] = useState(0);
  const H = 170;
  const L = 30;
  const R = 8;
  const T = 10;
  const B = 22;
  const n = hours.length;
  const vals = series.flatMap((s) => s.values.filter((v): v is number => v != null));
  if (!n || !vals.length) return null;
  let hi = Math.max(...vals, refLine && Math.max(...vals) >= refLine.value * 0.7 ? refLine.value : 0);
  const lo = 0;
  if (hi - lo < 1) hi = lo + 1;
  const step = niceStep((hi - lo) / 4);
  hi = Math.ceil(hi / step) * step;
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
    <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} style={{ height: H }}>
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

/** Wind and seas for the next 72 hours, as on the website. */
export function ForecastCharts({
  hours,
  units,
  utcOffset,
  now,
  inshore,
}: {
  hours: HourForecast[];
  units: Units;
  utcOffset: number;
  now: number;
  inshore?: boolean;
}) {
  const metric = units === 'metric';
  const w = (v: number | null) => (v == null ? null : metric ? v * 1.852 : v);
  const h = (v: number | null) => (v == null ? null : metric ? v / 3.28084 : v);
  const windUnit = metric ? 'km/h' : 'knots';
  const seaUnit = metric ? 'meters' : 'feet';
  const gustColor = '#8FB7C0';
  return (
    <>
      <Card style={{ gap: Spacing.two }}>
        <ThemedText type="smallBold">Wind, next 72 hours ({windUnit})</ThemedText>
        <Key items={[{ color: C.accent, label: 'Sustained' }, { color: gustColor, label: 'Gusts' }]} />
        <LineChart
          hours={hours}
          unit={windUnit}
          utcOffset={utcOffset}
          now={now}
          refLine={{ value: metric ? 37 : 20, label: metric ? '37 km/h small craft' : '20 kt small craft' }}
          series={[
            { label: 'gusts', color: gustColor, values: hours.map((x) => w(x.gusts)) },
            { label: 'wind', color: C.accent, fill: true, values: hours.map((x) => w(x.wind)) },
          ]}
        />
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
          hours={hours}
          unit={seaUnit}
          utcOffset={utcOffset}
          now={now}
          series={[
            ...(inshore ? [] : [{ label: 'swell', color: C.maybe, values: hours.map((x) => h(x.swellHeight)) }]),
            { label: 'seas', color: C.go, fill: true, values: hours.map((x) => h(x.waveHeight)) },
          ]}
        />
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  key: { flexDirection: 'row', gap: Spacing.three },
  keyItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 14, height: 3, borderRadius: 2 },
});
