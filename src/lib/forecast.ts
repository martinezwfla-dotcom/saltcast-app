import type { Spot } from '@/data/spots';

/** One forecast hour. Wind in knots, waves in feet, temperatures in °F. */
export type HourForecast = {
  time: number;
  isDay: boolean;
  airTemp: number | null;
  precipChance: number | null;
  weatherCode: number | null;
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
};

export type TideEvent = { time: number; height: number; type: 'high' | 'low' };

export type Forecast = {
  spotId: string;
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

function fetchWeather(spot: Spot) {
  const params = new URLSearchParams({
    latitude: String(spot.lat),
    longitude: String(spot.lon),
    hourly: [
      'temperature_2m',
      'precipitation_probability',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'is_day',
    ].join(','),
    wind_speed_unit: 'kn',
    temperature_unit: 'fahrenheit',
    timezone: 'auto',
    forecast_days: '7',
  });
  return getJson<OpenMeteoResponse>(`https://api.open-meteo.com/v1/forecast?${params}`);
}

function fetchMarine(spot: Spot) {
  const params = new URLSearchParams({
    latitude: String(spot.lat),
    longitude: String(spot.lon),
    hourly: [
      'wave_height',
      'wave_direction',
      'wave_period',
      'swell_wave_height',
      'swell_wave_direction',
      'swell_wave_period',
      'sea_surface_temperature',
    ].join(','),
    timezone: 'auto',
    forecast_days: '7',
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

export async function fetchForecast(spot: Spot): Promise<Forecast> {
  const [weather, marine, tides] = await Promise.all([
    fetchWeather(spot),
    fetchMarine(spot),
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

  return {
    spotId: spot.id,
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
