import type { Activity } from '@/data/activities';
import type { Spot } from '@/data/spots';
import type { HourForecast } from '@/lib/forecast';

export type Verdict = 'go' | 'maybe' | 'nogo';

export type HourVerdict = {
  verdict: Verdict;
  /** 0 to 100, higher is better. Used to rank hours that share a verdict. */
  score: number;
  /** Short plain-language reasons, worst first. */
  reasons: string[];
};

const Thunderstorm = (code: number | null) => code != null && code >= 95;

/** Smallest angle between two compass bearings, 0 to 180. */
function angleBetween(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Wind direction is where wind comes FROM. Offshore wind comes from the land,
 * so it is opposite to the way the beach faces.
 */
export function windRelation(windDir: number, facing: number): 'offshore' | 'onshore' | 'cross' {
  const fromSea = angleBetween(windDir, facing);
  if (fromSea <= 60) return 'onshore';
  if (fromSea >= 120) return 'offshore';
  return 'cross';
}

/** 1 at or under `good`, 0 at `maybe`, below 0 past it. */
function under(value: number, good: number, maybe: number) {
  if (value <= good) return 1;
  return 1 - (value - good) / (maybe - good);
}

/** 1 at or over `good`, 0 at `maybe`, below 0 under it. */
function over(value: number, good: number, maybe: number) {
  if (value >= good) return 1;
  return 1 - (good - value) / (good - maybe);
}

const Rank: Record<Verdict, number> = { go: 2, maybe: 1, nogo: 0 };

export function rateHour(hour: HourForecast, activity: Activity, spot: Spot): HourVerdict {
  const r = activity.rules;
  const checks: { name: string; value: number; reason: string }[] = [];

  if (hour.wind != null) {
    checks.push({
      name: 'wind',
      value: under(hour.wind, r.wind.good, r.wind.maybe),
      reason: `Wind ${Math.round(hour.wind)} kt`,
    });
    if (r.minWind) {
      checks.push({
        name: 'light wind',
        value: over(hour.wind, r.minWind.good, r.minWind.maybe),
        reason: `Light wind, ${Math.round(hour.wind)} kt`,
      });
    }
  }
  if (hour.gusts != null) {
    checks.push({
      name: 'gusts',
      value: under(hour.gusts, r.wind.maybe + 4, r.wind.maybe + 12),
      reason: `Gusts to ${Math.round(hour.gusts)} kt`,
    });
  }
  if (hour.waveHeight != null) {
    checks.push({
      name: 'waves',
      value: under(hour.waveHeight, r.waves.good, r.waves.maybe),
      reason: `Seas ${hour.waveHeight.toFixed(1)} ft`,
    });
  }
  if (r.minSwell) {
    const swell = hour.swellHeight ?? hour.waveHeight;
    if (swell != null) {
      checks.push({
        name: 'swell',
        value: over(swell, r.minSwell.good, r.minSwell.maybe),
        reason: `Small surf, ${swell.toFixed(1)} ft`,
      });
    }
  }
  if (r.prefersOffshore && hour.wind != null && hour.windDir != null) {
    const rel = windRelation(hour.windDir, spot.facing);
    if (rel === 'onshore' && hour.wind > 6) {
      checks.push({ name: 'onshore', value: under(hour.wind, 6, 14), reason: 'Onshore wind, choppy surf' });
    }
    if (rel === 'offshore') {
      checks.push({ name: 'offshore', value: 1, reason: 'Offshore wind' });
    }
  }

  let worst = Math.min(1, ...checks.map((c) => c.value));
  const reasons = [...checks].filter((c) => c.value < 1).sort((a, b) => a.value - b.value).map((c) => c.reason);

  if (Thunderstorm(hour.weatherCode)) {
    worst = -1;
    reasons.unshift('Thunderstorms');
  } else if (hour.precipChance != null && hour.precipChance >= 60) {
    worst = Math.min(worst, 0.4);
    reasons.push(`${hour.precipChance}% chance of rain`);
  }

  const verdict: Verdict = worst >= 0.75 ? 'go' : worst >= 0 ? 'maybe' : 'nogo';
  const avg = checks.length ? checks.reduce((s, c) => s + Math.max(-1, c.value), 0) / checks.length : 0;
  const score = Math.round(Math.max(0, Math.min(100, (worst * 0.6 + avg * 0.4) * 100)));

  return { verdict, score, reasons: reasons.slice(0, 3) };
}

export function betterVerdict(a: Verdict, b: Verdict) {
  return Rank[a] >= Rank[b] ? a : b;
}

export function verdictRank(v: Verdict) {
  return Rank[v];
}

export const VerdictLabel: Record<Verdict, string> = { go: 'Go', maybe: 'Maybe', nogo: 'No Go' };
