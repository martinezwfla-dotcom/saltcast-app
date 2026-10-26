export type Units = 'imperial' | 'metric';

const Compass = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

export function compass(deg: number | null) {
  if (deg == null) return '';
  return Compass[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
}

export function windSpeed(kt: number | null, units: Units) {
  if (kt == null) return '--';
  return units === 'metric' ? `${Math.round(kt * 1.852)} km/h` : `${Math.round(kt)} kt`;
}

export function height(ft: number | null, units: Units) {
  if (ft == null) return '--';
  return units === 'metric' ? `${(ft / 3.28084).toFixed(1)} m` : `${ft.toFixed(1)} ft`;
}

export function temperature(f: number | null, units: Units) {
  if (f == null) return '--';
  return units === 'metric' ? `${Math.round(((f - 32) * 5) / 9)}°C` : `${Math.round(f)}°F`;
}

/**
 * Times are shown in the spot's own time zone. Shifting by the spot's UTC offset and
 * reading UTC fields avoids depending on time zone support in the JS engine.
 */
function shifted(time: number, utcOffset: number) {
  return new Date(time + utcOffset * 1000);
}

const Days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function clock(time: number, utcOffset: number) {
  const d = shifted(time, utcOffset);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = h < 12 ? 'am' : 'pm';
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`;
}

export function dayLabel(time: number, utcOffset: number, now: number) {
  const d = shifted(time, utcOffset);
  const today = shifted(now, utcOffset);
  const dayIndex = (x: Date) => Math.floor(x.getTime() / 86400000);
  const diff = dayIndex(d) - dayIndex(today);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return Days[d.getUTCDay()];
}

export function timeRange(start: number, end: number, utcOffset: number, now: number) {
  return `${dayLabel(start, utcOffset, now)} ${clock(start, utcOffset)} to ${clock(end, utcOffset)}`;
}

/** WMO weather codes, as used by Open-Meteo. */
export function weatherText(code: number | null) {
  if (code == null) return 'Unknown';
  if (code === 0) return 'Clear';
  if (code <= 2) return 'Partly cloudy';
  if (code === 3) return 'Cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow showers';
  return 'Thunderstorms';
}

export function weatherSymbol(code: number | null, isDay: boolean) {
  if (code == null) return 'questionmark' as const;
  if (code === 0) return isDay ? ('sun.max.fill' as const) : ('moon.stars.fill' as const);
  if (code <= 2) return isDay ? ('cloud.sun.fill' as const) : ('cloud.moon.fill' as const);
  if (code === 3) return 'cloud.fill' as const;
  if (code <= 48) return 'cloud.fog.fill' as const;
  if (code <= 67) return 'cloud.rain.fill' as const;
  if (code <= 86) return 'cloud.heavyrain.fill' as const;
  return 'cloud.bolt.rain.fill' as const;
}
