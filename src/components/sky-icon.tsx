import Svg, { Circle, G, Line, Path } from 'react-native-svg';

import type { DaySummary } from '@/lib/daily';
import { effectiveCloud, isWetHour, type HourForecast } from '@/lib/forecast';

/** Our own weather icons, same drawings as the website's 10-day outlook. */
export type SkyKind =
  | 'sun'
  | 'mostly'
  | 'part'
  | 'mostlycloudy'
  | 'cloud'
  | 'sunrain'
  | 'rain'
  | 'storm'
  | 'fog'
  | 'moon'
  | 'mooncloud';

const C = { sun: '#F2B53A', cl: '#A9BBC8', cl2: '#8299AA', rain: '#3E8FD0', moon: '#E9D9A6' };
const CloudPath = 'M4 14h11.5a3.5 3.5 0 0 0 .3-7A5 5 0 0 0 6.2 6.6 3.7 3.7 0 0 0 4 14z';

function Sun({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <G>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const t = (a * Math.PI) / 180;
        return (
          <Line
            key={a}
            x1={cx + Math.cos(t) * (r + 2)}
            y1={cy + Math.sin(t) * (r + 2)}
            x2={cx + Math.cos(t) * (r + 4)}
            y2={cy + Math.sin(t) * (r + 4)}
            stroke={C.sun}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        );
      })}
      <Circle cx={cx} cy={cy} r={r} fill={C.sun} />
    </G>
  );
}

function Moon({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <Path
      d={`M${cx + r * 0.35} ${cy - r} a${r} ${r} 0 1 0 ${r * 0.65} ${r * 1.55} a${r * 0.8} ${r * 0.8} 0 0 1 ${-r * 0.65} ${-r * 1.55}z`}
      fill={C.moon}
    />
  );
}

function Cloud({ x, y, s, dark }: { x: number; y: number; s: number; dark?: boolean }) {
  return <Path d={CloudPath} transform={`translate(${x} ${y}) scale(${s})`} fill={dark ? C.cl2 : C.cl} />;
}

function Drops() {
  return (
    <G stroke={C.rain} strokeWidth={1.8} strokeLinecap="round">
      <Line x1={8} y1={18} x2={7} y2={21} />
      <Line x1={12} y1={18} x2={11} y2={21} />
      <Line x1={16} y1={18} x2={15} y2={21} />
    </G>
  );
}

function Body({ kind }: { kind: SkyKind }) {
  switch (kind) {
    case 'sun':
      return <Sun cx={12} cy={12} r={4.5} />;
    case 'mostly':
      return (
        <>
          <Sun cx={10} cy={9} r={4} />
          <Cloud x={9} y={10} s={0.62} />
        </>
      );
    case 'part':
      return (
        <>
          <Sun cx={9} cy={8} r={4} />
          <Cloud x={3} y={7} s={0.95} />
        </>
      );
    case 'mostlycloudy':
      return (
        <>
          <Sun cx={8} cy={6} r={3} />
          <Cloud x={1} y={5} s={1} dark />
          <Cloud x={4} y={9} s={0.92} />
        </>
      );
    case 'cloud':
      return (
        <>
          <Cloud x={4} y={3} s={0.85} dark />
          <Cloud x={0} y={7} s={1.05} />
        </>
      );
    case 'sunrain':
      return (
        <>
          <Sun cx={9} cy={6} r={3.5} />
          <Cloud x={3} y={3.5} s={0.95} />
          <Drops />
        </>
      );
    case 'rain':
      return (
        <>
          <Cloud x={1} y={1} s={1.1} dark />
          <Drops />
        </>
      );
    case 'storm':
      return (
        <>
          <Cloud x={1} y={1} s={1.1} dark />
          <Path d="M12.5 15l-3 4.5h2.6l-1.3 3.5 4-5h-2.7l1.4-3z" fill={C.sun} />
        </>
      );
    case 'fog':
      return (
        <>
          <Cloud x={2} y={1} s={1} />
          <G stroke={C.cl2} strokeWidth={1.8} strokeLinecap="round">
            <Line x1={4} y1={17.5} x2={20} y2={17.5} />
            <Line x1={6} y1={21} x2={18} y2={21} />
          </G>
        </>
      );
    case 'moon':
      return <Moon cx={12} cy={12} r={6} />;
    case 'mooncloud':
      return (
        <>
          <Moon cx={10} cy={9} r={4.5} />
          <Cloud x={3} y={8} s={0.9} />
        </>
      );
  }
}

export function SkyIcon({ kind, size = 24 }: { kind: SkyKind | null; size?: number }) {
  if (!kind) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      <Body kind={kind} />
    </Svg>
  );
}

const Levels: SkyKind[] = ['sun', 'mostly', 'part', 'mostlycloudy', 'cloud'];

/** Icon for a day's daylight sky. Falls back to null when there is no sky data. */
export function dayKind(d: DaySummary): SkyKind | null {
  if (d.storm) return 'storm';
  const k = d.sky;
  if (!k) return null;
  if (k.rain === 2) return 'rain';
  if (k.rain === 1) return k.level != null && k.level <= 2 ? 'sunrain' : 'rain';
  return k.level == null ? null : Levels[k.level];
}

/** Icon for the sky in one hour (night shows the moon). */
export function hourKind(h: HourForecast): SkyKind | null {
  const code = h.weatherCode;
  if (code != null && code >= 95) return 'storm';
  if (code != null && code >= 45 && code <= 48) return 'fog';
  if (isWetHour(h)) return 'rain';
  const cover = effectiveCloud(h);
  if (cover == null) return null;
  const level = cover < 15 ? 0 : cover < 35 ? 1 : cover < 65 ? 2 : cover < 85 ? 3 : 4;
  if (!h.isDay) return level <= 1 ? 'moon' : level <= 3 ? 'mooncloud' : 'cloud';
  return Levels[level];
}
