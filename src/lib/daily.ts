import type { Activity } from '@/data/activities';
import type { Spot } from '@/data/spots';
import type { Forecast, HourForecast } from '@/lib/forecast';
import { rateHour, verdictRank, type HourVerdict } from '@/lib/verdict';

export type DaySummary = {
  /** Start of the day's first forecast hour. */
  time: number;
  high: number | null;
  low: number | null;
  /** Worst weather code during daylight, so a stormy afternoon shows as storms. */
  weatherCode: number | null;
  precipChance: number | null;
  windMin: number | null;
  windMax: number | null;
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
        weatherCode: max(pick.map((h) => h.weatherCode)),
        precipChance: max(relevant.map((h) => h.precipChance)),
        windMin: min(pick.map((h) => h.wind)),
        windMax: max(pick.map((h) => h.wind)),
        waveMax: max(pick.map((h) => h.waveHeight)),
        best,
      };
    });
}
