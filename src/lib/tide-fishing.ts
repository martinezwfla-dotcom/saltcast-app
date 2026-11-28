import { getActivity } from '@/data/activities';
import type { Spot } from '@/data/spots';
import type { Forecast } from '@/lib/forecast';
import { rateHour, verdictRank, type Verdict } from '@/lib/verdict';

/** A daylight stretch of moving tide, the way the website's "Best fishing times" box shows it. */
export type TideStretch = {
  start: number;
  end: number;
  direction: 'Incoming' | 'Outgoing';
  /** Feet between the two tides. */
  range: number;
  verdict?: Verdict;
  reasons: string[];
  prime?: 'Sunrise bite' | 'Sunset bite';
  best?: boolean;
};

export type TideDay = { day: number; stretches: TideStretch[] };

const Hour = 3600 * 1000;

/** Local day key (YYYY-MM-DD) of a time at the spot. */
const dayKey = (t: number, offset: number) => new Date(t + offset * 1000).toISOString().slice(0, 10);

/**
 * Fish feed best while the tide is moving. For today and the next two days, lists the incoming and
 * outgoing stretches in daylight, skipping about an hour of slack water around each high and low,
 * and rates each by its roughest hour for fishing.
 */
export function tideFishing(forecast: Forecast, spot: Spot, now: number, days = 3): TideDay[] {
  const tides = forecast.tides;
  if (tides.length < 2) return [];
  const fishing = getActivity('fishing');
  const offset = forecast.utcOffset;

  // Daylight per local day, from the forecast's day/night hours.
  const daylight = new Map<string, { rise: number; set: number }>();
  for (const h of forecast.hours) {
    if (!h.isDay) continue;
    const k = dayKey(h.time, offset);
    const d = daylight.get(k);
    if (!d) daylight.set(k, { rise: h.time, set: h.time + Hour });
    else d.set = h.time + Hour;
  }

  const out: TideDay[] = [];
  for (const [k, { rise, set }] of [...daylight.entries()].slice(0, days)) {
    if (set < now) continue;
    const stretches: TideStretch[] = [];
    for (let i = 0; i < tides.length - 1; i++) {
      const a0 = tides[i];
      const b0 = tides[i + 1];
      const start = Math.max(a0.time + Hour, rise - Hour / 2, now);
      const end = Math.min(b0.time - Hour, set + Hour / 2);
      if (end - start < Hour) continue;
      const rated = forecast.hours
        .filter((h) => h.time + Hour > start && h.time < end)
        .map((h) => rateHour(h, fishing, spot));
      const worst = rated.length ? rated.reduce((w, r) => (verdictRank(r.verdict) < verdictRank(w.verdict) ? r : w)) : undefined;
      const prime =
        rise >= start - Hour && rise <= end + Hour ? 'Sunrise bite' : set >= start - Hour && set <= end + Hour ? 'Sunset bite' : undefined;
      stretches.push({
        start,
        end,
        direction: a0.type === 'high' ? 'Outgoing' : 'Incoming',
        range: Math.abs(b0.height - a0.height),
        verdict: worst?.verdict,
        reasons: worst?.reasons ?? [],
        prime,
      });
    }
    let top: { s: TideStretch; score: number } | undefined;
    for (const s of stretches) {
      if (!s.verdict || s.verdict === 'nogo') continue;
      const score = verdictRank(s.verdict) * 100 + (s.prime ? 10 : 0) + s.range;
      if (!top || score > top.score) top = { s, score };
    }
    if (top) top.s.best = true;
    out.push({ day: Date.parse(`${k}T12:00:00Z`) - offset * 1000, stretches });
  }
  return out;
}
