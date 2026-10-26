import type { Activity } from '@/data/activities';
import type { Spot } from '@/data/spots';
import type { Forecast, HourForecast } from '@/lib/forecast';
import { rateHour, verdictRank, type HourVerdict } from '@/lib/verdict';

export type DaySummary = {
  /** Start of the day's first forecast hour. */
  time: number;
  high: number | null;
  low: number | null;
  /** Storms if any daylight hour has them, otherwise the most common daylight weather. */
  weatherCode: number | null;
  precipChance: number | null;
  windMin: number | null;
  windMax: number | null;
  /** Average daylight wind direction, weighted by speed. */
  windDir: number | null;
  waveMax: number | null;
  /** The best daylight hour for the activity. */
  best?: { hour: HourForecast; rating: HourVerdict };
};

const max = (xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => x != null);
  return v.length ? Math.max(...v) : null;
};
const min = (xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => x != null);
  return v.length ? Math.min(...v) : null;
};

function averageDirection(hours: HourForecast[]) {
  let x = 0;
  let y = 0;
  for (const h of hours) {
    if (h.windDir == null || h.wind == null) continue;
    const r = (h.windDir * Math.PI) / 180;
    x += Math.sin(r) * h.wind;
    y += Math.cos(r) * h.wind;
  }
  if (x === 0 && y === 0) return null;
  return ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360;
}

function dayWeather(hours: HourForecast[]) {
  const codes = hours.map((h) => h.weatherCode).filter((c): c is number => c != null);
  if (!codes.length) return null;
  if (codes.some((c) => c >= 95)) return Math.max(...codes);
  const counts = new Map<number, number>();
  for (const c of codes) counts.set(c, (counts.get(c) ?? 0) + 1);
  // Most common code; ties go to the wetter or cloudier one.
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
}

/** Groups the forecast into the spot's local days, starting with today. */
export function summarizeDays(forecast: Forecast, activity: Activity, spot: Spot, now: number, days = 7): DaySummary[] {
  const dayOf = (t: number) => Math.floor((t + forecast.utcOffset * 1000) / 86400000);
  const today = dayOf(now);
  const groups = new Map<number, HourForecast[]>();
  for (const h of forecast.hours) {
    const d = dayOf(h.time);
    if (d < today) continue;
    if (!groups.has(d)) groups.set(d, []);
    groups.get(d)!.push(h);
  }

  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .slice(0, days)
    .map(([d, hours]) => {
      // Today only counts the hours still ahead.
      const relevant = d === today ? hours.filter((h) => h.time + 3600 * 1000 > now) : hours;
      const daylight = relevant.filter((h) => h.isDay);
      const pick = daylight.length ? daylight : relevant;

      let best: DaySummary['best'];
      for (const hour of daylight) {
        const rating = rateHour(hour, activity, spot);
        if (
          !best ||
          verdictRank(rating.verdict) > verdictRank(best.rating.verdict) ||
          (rating.verdict === best.rating.verdict && rating.score > best.rating.score)
        ) {
          best = { hour, rating };
        }
      }

      return {
        time: hours[0].time,
        high: max(hours.map((h) => h.airTemp)),
        low: min(hours.map((h) => h.airTemp)),
        weatherCode: dayWeather(pick),
        precipChance: max(relevant.map((h) => h.precipChance)),
        windMin: min(pick.map((h) => h.wind)),
        windMax: max(pick.map((h) => h.wind)),
        windDir: averageDirection(pick),
        waveMax: max(pick.map((h) => h.waveHeight)),
        best,
      };
    });
}
