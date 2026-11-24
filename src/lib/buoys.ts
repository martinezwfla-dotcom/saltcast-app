import type { Water } from '@/lib/forecast';

/**
 * Live readings from NOAA buoys and coastal stations (National Data Buoy Center).
 * One file holds the latest reading from every station; it's public domain.
 */
const Sources = [
  'https://www.ndbc.noaa.gov/data/latest_obs/latest_obs.txt',
  // The website keeps a copy of the same file, in case NOAA's server is slow.
  'https://saltcastflorida.com/ndbc/latest_obs.txt',
];

export type Station = {
  id: string;
  lat: number;
  lon: number;
  time: number;
  /** Knots, feet, °F. */
  windDir: number | null;
  wind: number | null;
  gust: number | null;
  waves: number | null;
  period: number | null;
  waterTemp: number | null;
  /** Moored offshore buoys have 5-digit numbers; coastal, pier and bay stations have letters. */
  buoy: boolean;
};

/** Plain names for well-known Florida stations (NDBC ids). Others show their id. */
const Names: Record<string, string> = {
  VENF1: 'Venice',
  FMRF1: 'Fort Myers',
  NPSF1: 'Naples',
  KYWF1: 'Key West',
  SMKF1: 'Sombrero Key',
  MLRF1: 'Molasses Reef',
  LONF1: 'Long Key',
  VAKF1: 'Virginia Key',
  LKWF1: 'Lake Worth Pier',
  TRDF1: 'Trident Pier',
  SAUF1: 'St. Augustine',
  MYPF1: 'Mayport',
  FRDF1: 'Fernandina Beach',
  CWBF1: 'Clearwater Beach',
  SAPF1: 'St. Petersburg',
  PMAF1: 'Port Manatee',
  CDRF1: 'Cedar Key',
  APCF1: 'Apalachicola',
  PCLF1: 'Pensacola',
  '42036': 'West Tampa',
  '42099': 'Offshore St. Petersburg',
  '42098': 'Egmont Channel',
  '42013': 'West Florida Shelf C10',
  '42097': 'Pulley Ridge',
  '42003': 'East Gulf',
  '42039': 'Pensacola 115 nm SSE',
  '41114': 'Fort Pierce',
  '41113': 'Cape Canaveral Nearshore',
  '41009': 'Canaveral 20 nm East',
  '41117': 'St. Augustine',
  '41112': 'Offshore Fernandina',
  '41122': 'Hollywood Beach',
};

/** "Venice (VENF1)", or "Buoy 42013" / "Station XYZF1" when the name isn't known. */
export function stationLabel(s: Pick<Station, 'id' | 'buoy'>) {
  const id = s.id.toUpperCase();
  const name = Names[id];
  return name ? `${name} (${id})` : `${s.buoy ? 'Buoy' : 'Station'} ${id}`;
}

let cache: { at: number; stations: Station[] } | undefined;

function parse(text: string): Station[] {
  const out: Station[] = [];
  const num = (v: string) => (v === 'MM' || v == null ? null : Number(v));
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const f = line.trim().split(/\s+/);
    if (f.length < 19) continue;
    const lat = Number(f[1]);
    const lon = Number(f[2]);
    // Florida and its waters.
    if (!(lat >= 23.5 && lat <= 31.5 && lon >= -88.5 && lon <= -78.5)) continue;
    const time = Date.parse(`${f[3]}-${f[4]}-${f[5]}T${f[6]}:${f[7]}:00Z`);
    if (!time || Date.now() - time > 6 * 3600 * 1000) continue;
    const ms = num(f[9]);
    const gust = num(f[10]);
    const waves = num(f[11]);
    const water = num(f[18]);
    out.push({
      id: f[0],
      lat,
      lon,
      time,
      windDir: num(f[8]),
      wind: ms == null ? null : ms * 1.94384,
      gust: gust == null ? null : gust * 1.94384,
      waves: waves == null ? null : waves * 3.28084,
      period: num(f[12]),
      waterTemp: water == null ? null : (water * 9) / 5 + 32,
      buoy: /^\d{5}$/.test(f[0]),
    });
  }
  return out;
}

export async function loadStations(): Promise<Station[]> {
  if (cache && Date.now() - cache.at < 10 * 60 * 1000) return cache.stations;
  let last: unknown;
  for (const url of Sources) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const stations = parse(await res.text());
      if (!stations.length) throw new Error('No readings');
      cache = { at: Date.now(), stations };
      return stations;
    } catch (e) {
      last = e;
    }
  }
  throw last instanceof Error ? last : new Error('Buoy readings are unavailable');
}

export function milesBetween(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = Math.PI / 180;
  const x = Math.sin(((lat2 - lat1) * r) / 2);
  const y = Math.sin(((lon2 - lon1) * r) / 2);
  const h = x * x + Math.cos(lat1 * r) * Math.cos(lat2 * r) * y * y;
  return 2 * 3958.8 * Math.asin(Math.sqrt(h));
}

/**
 * Up to three stations for a spot, matching the website: offshore = moored buoys within 160 miles,
 * inshore = coastal and pier stations within 45 miles, nearshore = the nearest within 60 miles plus
 * the nearest buoy that measures waves.
 */
export function pickStations(all: Station[], lat: number, lon: number, water: Water) {
  const withDist = all
    .map((s) => ({ ...s, miles: milesBetween(lat, lon, s.lat, s.lon) }))
    .filter((s) => s.wind != null || s.waves != null || s.waterTemp != null)
    .sort((a, b) => a.miles - b.miles);
  if (water === 'off') return withDist.filter((s) => s.buoy && s.miles < 160).slice(0, 3);
  if (water === 'inshore') return withDist.filter((s) => !s.buoy && s.miles < 45).slice(0, 3);
  const near = withDist.filter((s) => s.miles < 60).slice(0, 2);
  const wave = withDist.find((s) => s.waves != null && s.miles < 160 && !near.includes(s));
  return wave ? [...near, wave] : withDist.filter((s) => s.miles < 60).slice(0, 3);
}
