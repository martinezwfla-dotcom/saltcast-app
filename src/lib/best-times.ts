import type { Activity } from '@/data/activities';
import type { Spot } from '@/data/spots';
import { currentHourIndex, type Forecast, type HourForecast } from '@/lib/forecast';
import { rateHour, verdictRank, type HourVerdict, type Verdict } from '@/lib/verdict';

export type Window = {
  start: number;
  end: number;
  verdict: Verdict;
  score: number;
  hours: { hour: HourForecast; rating: HourVerdict }[];
};

const MaxWindowHours = 6;

/**
 * Finds the best daylight windows in the next 48 hours. A window is a run of
 * daylight hours that share the same verdict, at least 2 and at most 6 hours long.
 */
export function findBestWindows(
  forecast: Forecast,
  activity: Activity,
  spot: Spot,
  now: number,
  limit = 4,
): Window[] {
  const first = currentHourIndex(forecast, now);
  const hours = forecast.hours.slice(first, first + 48);
  const rated = hours.map((hour) => ({ hour, rating: rateHour(hour, activity, spot) }));

  const windows: Window[] = [];
  let run: typeof rated = [];
  const flush = () => {
    if (run.length) {
      const score = Math.round(run.reduce((s, h) => s + h.rating.score, 0) / run.length);
      windows.push({
        start: run[0].hour.time,
        end: run[run.length - 1].hour.time + 3600 * 1000,
        verdict: run[0].rating.verdict,
        score,
        hours: run,
      });
    }
    run = [];
  };

  for (const h of rated) {
    const fits = h.hour.isDay && h.rating.verdict !== 'nogo';
    if (!fits || (run.length && run[0].rating.verdict !== h.rating.verdict) || run.length >= MaxWindowHours) {
      flush();
    }
    if (fits) run.push(h);
  }
  flush();

  return windows
    .filter((w) => w.hours.length >= 2)
    .sort((a, b) => verdictRank(b.verdict) - verdictRank(a.verdict) || b.score - a.score)
    .slice(0, limit)
    .sort((a, b) => a.start - b.start);
}
