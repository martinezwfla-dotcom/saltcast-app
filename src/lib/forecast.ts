import type { Spot } from '@/data/spots';

/** One forecast hour. Wind in knots, waves in feet, temperatures in °F. */
export type HourForecast = {
  time: number;
  isDay: boolean;
  airTemp: number | null;
  precipChance: number | null;
  weatherCode: number | null;
  /** Cloud cover, percent. Missing in forecasts cached by older versions. */
  cloudCover?: number | null;
  cloudLow?: number | null;
  cloudMid?: number | null;
  cloudHigh?: number | null;
  wind: number | null;
  windDir: number | null;
  gusts: number | null;
  waveHeight: number | null;
  waveDir: number | null;
  wavePeriod: number | null;
  swellHeight: number | null;
  swellDir: number | null;
  swellPeriod: number | null;
  waterTemp: number | null;
  /** Inshore (bay, sound, ICW) hour: wind is the town's, so the model's gust spread over land is ignored. */
  sheltered?: boolean;
};

export type TideEvent = { time: number; height: number; type: 'high' | 'low' };

/**
 * Which water the forecast is for, as on the website:
 * inshore = bays, ICW and harbors (chop from the wind, no ocean swell),
 * near = the beach out to about 20 nm (the default), off = 20 to 60 nm out.
 */
export type Water = 'inshore' | 'near' | 'off';

export const WaterLabels: Record<Water, { label: string; desc: string }> = {
  inshore: { label: 'Inshore', desc: 'Bays, ICW, harbors' },
  near: { label: 'Nearshore', desc: 'Beach to 20 nm' },
  off: { label: 'Offshore', desc: '20 to 60 nm' },
};

/** Surf forecasts only make sense at the beach. */
export function waterFor(water: Water, activityId: string): Water {
  return activityId === 'surfing' ? 'near' : water;
}

export type Forecast = {
  spotId: string;
  water: Water;
  fetchedAt: number;
  /** Offset of the spot's local time from UTC, in seconds. */
  utcOffset: number;
  hours: HourForecast[];
  tides: TideEvent[];
  tidesError?: string;
};

const FeetPerMeter = 3.28084;
const cToF = (c: number) => (c * 9) / 5 + 32;

type OpenMeteoHourly = Record<string, (number | null)[]> & { time: string[] };

type OpenMeteoResponse = {
  utc_offset_seconds: number;
  hourly: OpenMeteoHourly;
};

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

/** Open-Meteo returns local times like "2026-10-26T14:00". Turn one into a UTC timestamp. */
function localToUtc(local: string, utcOffset: number) {
  return Date.parse(`${local}:00Z`) - utcOffset * 1000;
}

type Point = { lat: number; lon: number; timezone: string };

/**
 * Where to ask for the forecast. Offshore uses a point about 30 nm out along the way the
 * beach faces, with the land time zone named (far out, "auto" can pick a nautical zone).
 */
function forecastPoint(spot: Spot, water: Water): Point {
  if (water === 'inshore') {
    // Inside the bay or sound, behind the beach: the spot's own inshore point, or about 6 miles back from the
    // offshore point toward land (searched places use the town itself). Same idea as the website.
    if (spot.inshore) return { ...spot.inshore, timezone: 'auto' };
    const back = ((spot.facing + 180) * Math.PI) / 180;
    return {
      lat: +(spot.lat + 0.09 * Math.cos(back)).toFixed(3),
      lon: +(spot.lon + (0.09 * Math.sin(back)) / Math.cos((spot.lat * Math.PI) / 180)).toFixed(3),
      timezone: 'auto',
    };
  }
  if (water !== 'off') return { lat: spot.lat, lon: spot.lon, timezone: 'auto' };
  const rad = (spot.facing * Math.PI) / 180;
  const lat = spot.lat + 0.5 * Math.cos(rad);
  const lon = spot.lon + (0.5 * Math.sin(rad)) / Math.cos((spot.lat * Math.PI) / 180);
  return {
    lat: +lat.toFixed(3),
    lon: +lon.toFixed(3),
    timezone: spot.lon < -85.3 ? 'America/Chicago' : 'America/New_York',
  };
}

/**
 * Wind chop in feet in a sheltered bay or sound: Shore Protection Manual shallow-water formula over about
 * 2.5 miles of open water 5 ft deep (Gasparilla Sound, Lemon Bay, the ICW). Same as the website.
 * The old deep-water 5-mile version gave about 1.9 ft at 20 kt, far rougher than these sounds get.
 */
export function chopFeet(kt: number | null) {
  if (kt == null) return null;
  const u = Math.max(kt, 1) * 0.5144;
  const ua = 0.71 * Math.pow(u, 1.23);
  const g = 9.81;
  const fetchMeters = 4000;
  const depth = 1.5;
  const k = (ua * ua) / g;
  const a = Math.tanh(0.53 * Math.pow((g * depth) / (ua * ua), 0.75));
  return Math.min(0.283 * k * a * Math.tanh((0.00565 * Math.sqrt((g * fetchMeters) / (ua * ua))) / a) * FeetPerMeter, 3);
}

function fetchWeather(p: Point, days: number) {
  const params = new URLSearchParams({
    latitude: String(p.lat),
    longitude: String(p.lon),
    hourly: [
      'temperature_2m',
      'precipitation_probability',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'is_day',
      'cloud_cover',
      'cloud_cover_low',
      'cloud_cover_mid',
      'cloud_cover_high',
    ].join(','),
    wind_speed_unit: 'kn',
    temperature_unit: 'fahrenheit',
    timezone: p.timezone,
    forecast_days: String(days),
  });
  return getJson<OpenMeteoResponse>(`https://api.open-meteo.com/v1/forecast?${params}`);
}

function fetchMarine(p: Point, days: number) {
  const params = new URLSearchParams({
    latitude: String(p.lat),
    longitude: String(p.lon),
    hourly: [
      'wave_height',
      'wave_direction',
      'wave_period',
      'swell_wave_height',
      'swell_wave_direction',
      'swell_wave_period',
      'sea_surface_temperature',
    ].join(','),
    timezone: p.timezone,
    forecast_days: String(days),
  });
  return getJson<OpenMeteoResponse>(`https://marine-api.open-meteo.com/v1/marine?${params}`);
}

type NoaaResponse = {
  predictions?: { t: string; v: string; type: 'H' | 'L' }[];
  error?: { message: string };
};

function yyyymmdd(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}

async function fetchTides(spot: Spot): Promise<TideEvent[]> {
  // Start a day back so "last tide" is known early in the morning.
  const begin = new Date(Date.now() - 24 * 3600 * 1000);
  const params = new URLSearchParams({
    product: 'predictions',
    station: spot.tideStation.id,
    datum: 'MLLW',
    units: 'english',
    time_zone: 'gmt',
    interval: 'hilo',
    format: 'json',
    begin_date: yyyymmdd(begin),
    range: '96',
    application: 'saltcast',
  });
  const data = await getJson<NoaaResponse>(
    `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?${params}`,
  );
  if (!data.predictions) throw new Error(data.error?.message ?? 'No tide data');
  return data.predictions.map((p) => ({
    time: Date.parse(`${p.t.replace(' ', 'T')}:00Z`),
    height: Number(p.v),
    type: p.type === 'H' ? 'high' : 'low',
  }));
}

/** Asks for 10 days; if the marine service won't give that many, 8; offshore falls back to the automatic time zone. */
async function fetchWeatherAndMarine(spot: Spot, water: Water) {
  const p = forecastPoint(spot, water);
  const tries: [Point, number][] = [
    [p, 10],
    [p, 8],
  ];
  if (p.timezone !== 'auto') tries.push([{ ...p, timezone: 'auto' }, 8]);
  let last: unknown;
  for (const [point, days] of tries) {
    try {
      return await Promise.all([fetchWeather(point, days), fetchMarine(point, days)]);
    } catch (e) {
      last = e;
    }
  }
  throw last;
}

export async function fetchForecast(spot: Spot, water: Water = 'near'): Promise<Forecast> {
  const [[weather, marine], tides] = await Promise.all([
    fetchWeatherAndMarine(spot, water),
    fetchTides(spot).then(
      (t) => ({ ok: true as const, tides: t }),
      (e: Error) => ({ ok: false as const, error: e.message }),
    ),
  ]);

  const offset = weather.utc_offset_seconds;
  const w = weather.hourly;
  const m = marine.hourly;
  const marineIndex = new Map(m.time.map((t, i) => [t, i]));

  const meters = (v: number | null | undefined) => (v == null ? null : v * FeetPerMeter);
  const celsius = (v: number | null | undefined) => (v == null ? null : cToF(v));

  const hours: HourForecast[] = w.time.map((t, i) => {
    const j = marineIndex.get(t);
    const mv = (key: string) => (j == null ? null : (m[key]?.[j] ?? null));
    return {
      time: localToUtc(t, offset),
      isDay: w.is_day?.[i] === 1,
      airTemp: w.temperature_2m?.[i] ?? null,
      precipChance: w.precipitation_probability?.[i] ?? null,
      weatherCode: w.weather_code?.[i] ?? null,
      cloudCover: w.cloud_cover?.[i] ?? null,
      cloudLow: w.cloud_cover_low?.[i] ?? null,
      cloudMid: w.cloud_cover_mid?.[i] ?? null,
      cloudHigh: w.cloud_cover_high?.[i] ?? null,
      wind: w.wind_speed_10m?.[i] ?? null,
      windDir: w.wind_direction_10m?.[i] ?? null,
      gusts: w.wind_gusts_10m?.[i] ?? null,
      waveHeight: meters(mv('wave_height')),
      waveDir: mv('wave_direction'),
      wavePeriod: mv('wave_period'),
      swellHeight: meters(mv('swell_wave_height')),
      swellDir: mv('swell_wave_direction'),
      swellPeriod: mv('swell_wave_period'),
      waterTemp: celsius(mv('sea_surface_temperature')),
    };
  });

  // Inshore: protected water, so the waves are wind chop and there is no ocean swell.
  if (water === 'inshore') {
    for (const h of hours) {
      h.waveHeight = chopFeet(h.wind);
      h.sheltered = true;
      h.waveDir = h.windDir;
      h.wavePeriod = null;
      h.swellHeight = null;
      h.swellDir = null;
      h.swellPeriod = null;
    }
  }

  return {
    spotId: spot.id,
    water,
    fetchedAt: Date.now(),
    utcOffset: offset,
    hours,
    tides: tides.ok ? tides.tides : [],
    tidesError: tides.ok ? undefined : tides.error,
  };
}

/** The forecast hour that contains `now`, or the first one after it. */
export function currentHourIndex(forecast: Forecast, now: number) {
  const i = forecast.hours.findIndex((h) => h.time + 3600 * 1000 > now);
  return i === -1 ? forecast.hours.length - 1 : i;
}

/**
 * How cloudy the sky looks, 0 to 100: low and mid clouds count fully, thin high cirrus counts 40%
 * (it still looks sunny). Falls back to total cloud cover, then the weather code. Same as the website.
 */
export function effectiveCloud(h: HourForecast): number | null {
  if (h.cloudLow != null || h.cloudMid != null || h.cloudHigh != null) {
    return Math.max(h.cloudLow ?? 0, h.cloudMid ?? 0, 0.4 * (h.cloudHigh ?? 0));
  }
  if (h.cloudCover != null) return h.cloudCover;
  const code = h.weatherCode;
  return code == null ? null : code === 0 ? 5 : code === 1 ? 25 : code === 2 ? 50 : 95;
}

/** A rain weather code with a real (35%+) chance of rain, so a stray model drizzle code doesn't count. */
export function isWetHour(h: HourForecast) {
  const code = h.weatherCode;
  return code != null && code >= 51 && code <= 82 && (h.precipChance == null || h.precipChance >= 35);
}
