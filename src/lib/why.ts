import type { ActivityId } from '@/data/activities';
import type { DaySummary } from '@/lib/daily';
import { compass, dayLabel, height, windSpeed, type Units } from '@/lib/format';
import { effectiveCloud, isWetHour, type HourForecast, type Water } from '@/lib/forecast';
import { verdictRank, VerdictLabel } from '@/lib/verdict';

/** A day's note: an optional bold lead ("Worse than Wed:") and the plain-English reason. */
export type DayWhy = { lead?: string; text: string };

/** Smallest angle between two compass bearings, 0 to 180. */
function angle(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

type Factor = 'storm' | 'trop' | 'gust' | 'rain' | 'seas' | 'onshore' | 'wind' | 'other';

function factorOf(reason: string): Factor {
  const r = reason.toLowerCase();
  if (r.includes('thunder')) return 'storm';
  if (r.includes(' in effect')) return 'trop';
  if (r.startsWith('gust')) return 'gust';
  if (r.includes('rain')) return 'rain';
  if (r.startsWith('seas') || r.startsWith('small surf')) return 'seas';
  if (r.startsWith('onshore')) return 'onshore';
  if (r.includes('wind')) return 'wind';
  return 'other';
}

const SkyWords = ['sunny', 'mostly sunny', 'partly cloudy', 'mostly cloudy', 'cloudy'];

function skyWord(k: DaySummary['sky']) {
  if (!k) return null;
  if (k.rain === 2) return 'showers';
  if (k.rain === 1) return k.level != null && k.level <= 2 ? `${SkyWords[k.level]}, a few showers` : 'cloudy with a few showers';
  return k.level == null ? null : SkyWords[k.level];
}

/** The sky line for a day, worded as a change from the day before when it changed a lot. Same as the website. */
function skyLine(d: DaySummary, p?: DaySummary) {
  const k = d.sky;
  const word = skyWord(k);
  if (!k || !word || d.storm) return '';
  const q = p?.sky;
  if (q && skyWord(q) && !p.storm && k.level != null) {
    if (!k.rain && k.level <= 1 && (q.rain || (q.level != null && q.level - k.level >= 2))) {
      return k.level === 0 ? 'The sun comes back out.' : `The sun comes back out, ${word}.`;
    }
    if (!k.rain && q.level != null && q.level - k.level >= 2) return `Brighter skies, ${word}.`;
    if (!k.rain && q.level != null && k.level - q.level >= 2) return k.level >= 3 ? 'Clouds move in.' : `More clouds, ${word}.`;
  }
  if (q && k.rain && !q.rain && !p.storm) return k.rain === 2 ? 'Showers move in.' : 'A few showers pop up.';
  return `${word.charAt(0).toUpperCase()}${word.slice(1)}.`;
}

/** A big wind shift with building wind: the classic sign of a front passing. */
function isFront(d: DaySummary, p?: DaySummary) {
  return !!(
    p &&
    d.windDir != null &&
    p.windDir != null &&
    angle(d.windDir, p.windDir) >= 60 &&
    (d.windMax ?? 0) - (p.windMax ?? 0) >= 4 &&
    (d.windMax ?? 0) >= 12
  );
}

/**
 * Plain-English notes on why each day's rating is what it is, comparing with the day before:
 * what got worse or better (wind building or easing, a wind shift, seas, gusts, rain, storms),
 * what is holding a Not ideal or No Go day back, and a hint when the wind shift looks like a front.
 * Same wording as the website's 10-day outlook.
 */
export function explainDays(
  days: DaySummary[],
  activity: ActivityId,
  units: Units,
  water: Water,
  utcOffset: number,
  now: number,
): (DayWhy | null)[] {
  const sea = water === 'inshore' ? 'chop' : activity === 'surfing' ? 'surf' : 'seas';
  const plural = sea === 'seas';
  const num = (s: string) => s.split(' ')[0];
  const ft = (v: number | null) => height(v, units);

  return days.map((d, i) => {
    if (!d.verdict) return null;
    const prev = i > 0 && days[i - 1].verdict ? days[i - 1] : undefined;
    const prevName = prev ? dayLabel(prev.time, utcOffset, now) : '';
    const pName = prevName === 'Today' || prevName === 'Tomorrow' ? prevName.toLowerCase() : prevName;
    const wind =
      d.windMin != null && d.windMax != null && Math.round(d.windMin) !== Math.round(d.windMax)
        ? `${num(windSpeed(d.windMin, units))} to ${windSpeed(d.windMax, units)}`
        : windSpeed(d.windMax, units);
    const dir = compass(d.windDir);

    // +1 makes the day worse, -1 better. A worse day only lists what got worse, and the other way round.
    const change = prev ? Math.sign(verdictRank(d.verdict) - verdictRank(prev.verdict!)) : 0;
    const bits: string[] = [];
    const has = new Set<Factor>();
    const add = (f: Factor, text: string, effect: number) => {
      if (has.has(f) || (change < 0 && effect < 0) || (change > 0 && effect > 0)) return;
      bits.push(text);
      has.add(f);
    };

    if (prev) {
      const dWind = (d.windMax ?? 0) - (prev.windMax ?? 0);
      const dSeas = (d.waveMax ?? 0) - (prev.waveMax ?? 0);
      const turn =
        d.windDir != null && prev.windDir != null && angle(d.windDir, prev.windDir) >= 60 && (d.windMax ?? 0) >= 6;
      if (d.storm && !prev.storm) add('storm', 'thunderstorms move in', 1);
      if (dWind >= 4) add('wind', `wind ${turn ? `turns ${dir} and ` : ''}builds to ${wind}`, 1);
      else if (dWind <= -4) add('wind', `wind ${turn ? `turns ${dir} and ` : ''}eases to ${wind}`, -1);
      else if (turn) add('wind', `wind turns ${dir}, ${wind}`, 0);
      if (d.waveMax != null && prev.waveMax != null) {
        if (dSeas >= 0.4) add('seas', `${sea} ${plural ? 'build' : 'builds'} to ${ft(d.waveMax)}`, 1);
        else if (dSeas <= -0.4) add('seas', `${sea} ${plural ? 'drop' : 'drops'} to ${ft(d.waveMax)}`, -1);
      }
      if (d.gustMax != null && d.windMax != null && d.gustMax - d.windMax >= 10 && d.gustMax - (prev.gustMax ?? 0) >= 4) {
        add('gust', `gusts up to ${windSpeed(d.gustMax, units)} (wind ${wind})`, 1);
      }
      if (!d.storm && d.precipChance != null && d.precipChance >= 50 && d.precipChance - (prev.precipChance ?? 0) >= 20) {
        add('rain', `rain chance rises to ${d.precipChance}%`, 1);
      }
      if (prev.storm && !d.storm) add('storm', 'storms clear out', -1);
      else if (prev.precipChance != null && prev.precipChance >= 50 && (d.precipChance ?? 0) < 30) {
        add('rain', 'rain clears out', -1);
      }
    }

    // Always name what is holding the day back.
    if (d.verdict !== 'go') {
      const r = d.reasons[0] ?? '';
      const f = factorOf(r);
      const text: Record<Factor, string> = {
        storm: 'thunderstorms in the forecast',
        trop: r,
        gust: `gusts up to ${windSpeed(d.gustMax, units)} (wind ${wind})`,
        rain: `${d.precipChance ?? '--'}% rain chance`,
        seas: activity === 'surfing' ? `surf too small, ${ft(d.waveMax)} at most` : `${sea} up to ${ft(d.waveMax)}`,
        onshore: 'onshore wind chops up the surf',
        wind: /light/i.test(r) ? `light wind, ${wind}` : `wind ${wind}${dir ? ` from the ${dir}` : ''}`,
        other: r.charAt(0).toLowerCase() + r.slice(1),
      };
      if (!has.has(f) && text[f]) {
        if (change <= 0) bits.unshift(text[f]);
        else bits.push(text[f]);
        has.add(f);
      }
    }

    const calm = `${dir ? `${dir} ` : ''}wind ${wind}${d.waveMax != null ? `, ${sea} to ${ft(d.waveMax)}` : ''}`;
    const list = (x: string[]) => (x.length < 2 ? x.join('') : `${x.slice(0, -1).join(', ')} and ${x[x.length - 1]}`);
    const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

    let why: DayWhy;
    if (!prev) why = { text: `${cap(d.verdict === 'go' ? calm : list(bits))}.` };
    else if (change < 0) why = { lead: `Worse than ${pName}:`, text: `${list(bits.length ? bits : [calm])}.` };
    else if (change > 0) why = { lead: `Better than ${pName}:`, text: `${list(bits.length ? bits : [calm])}.` };
    else if (d.verdict === 'go') why = { text: `Steady: ${calm}.` };
    else why = { text: `Still ${VerdictLabel[d.verdict].toLowerCase()}: ${list(bits)}.` };

    const sky = skyLine(d, prev);
    if (sky) why.text += ` ${sky}`;

    if (isFront(d, prev)) {
      why.text +=
        d.windDir != null && angle(d.windDir, 315) <= 70
          ? ' A wind shift to the west or north like this usually means a cold front is coming through.'
          : ' A big wind shift with stronger wind usually means a weather system is moving through.';
    } else if (prev && isFront(prev, days[i - 2]) && prev.windDir != null && angle(prev.windDir, 315) <= 70 && change > 0) {
      why.text += ' Calmer behind the front.';
    }
    return why;
  });
}

/** The sky right now, for the line under the rating: Sunny / Mostly sunny / Partly cloudy..., Clear at night. */
export function skyNow(hour: HourForecast) {
  const code = hour.weatherCode;
  if (code != null && code >= 95) return '';
  if (code != null && code >= 45 && code <= 48) return 'Foggy';
  if (isWetHour(hour) && code != null) return code <= 57 ? 'Drizzle' : code <= 67 ? 'Rain' : 'Showers';
  const cover = effectiveCloud(hour);
  if (cover == null) return '';
  const level = cover < 15 ? 0 : cover < 35 ? 1 : cover < 65 ? 2 : cover < 85 ? 3 : 4;
  return (hour.isDay ? DayWords : NightWords)[level];
}

const DayWords = ['Sunny', 'Mostly sunny', 'Partly cloudy', 'Mostly cloudy', 'Cloudy'];
const NightWords = ['Clear', 'Mostly clear', 'Partly cloudy', 'Mostly cloudy', 'Cloudy'];

/** The rating's reason line, led by the sky: "Mostly sunny, wind 16 kt · Seas 1.8 ft". */
export function nowLine(hour: HourForecast, reasons: string[]) {
  const sky = skyNow(hour);
  if (!reasons.length) return sky ? `${sky}. Conditions look good.` : 'Conditions look good.';
  if (!sky) return reasons.join(' · ');
  const [first, ...rest] = reasons;
  const lead = /^[A-Z][a-z]/.test(first) ? first.charAt(0).toLowerCase() + first.slice(1) : first;
  return [`${sky}, ${lead}`, ...rest].join(' · ');
}
