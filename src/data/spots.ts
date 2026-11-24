export type Region = 'Atlantic' | 'Keys' | 'Gulf' | 'Panhandle';

export const Regions: Region[] = ['Gulf', 'Keys', 'Atlantic', 'Panhandle'];

export type TideStation = { id: string; name: string; backup?: { id: string; name: string } };

export type Spot = {
  id: string;
  name: string;
  region: Region;
  /** A point just offshore, used for the marine forecast. */
  lat: number;
  lon: number;
  /** Compass bearing the beach faces, toward open water. Used to tell offshore from onshore wind. */
  facing: number;
  /** NOAA tide prediction station at or next to the spot. backup is a nearby NOAA reference station, used if the first one has no predictions. */
  tideStation: TideStation;
  /** True for a place the user found with search. */
  custom?: boolean;
  /** NWS tropical warnings and watches in force here, attached by useTropical. */
  tropical?: { event: string; level: 'warn' | 'watch'; until: number }[];
};

// NOAA CO-OPS tide prediction stations. Each spot uses the station at (or right next to) its own
// beach or inlet, not just the nearest big harbor. Checked against NOAA station names and ids, Nov 2026.
const Ref = {
  fernandina: { id: '8720030', name: 'Fernandina Beach' },
  mayport: { id: '8720218', name: 'Mayport' },
  trident: { id: '8721604', name: 'Port Canaveral (Trident Pier)' },
  lakeWorth: { id: '8722670', name: 'Lake Worth Pier' },
  virginiaKey: { id: '8723214', name: 'Virginia Key' },
  vacaKey: { id: '8723970', name: 'Vaca Key' },
  keyWest: { id: '8724580', name: 'Key West' },
  naples: { id: '8725110', name: 'Naples' },
  fortMyers: { id: '8725520', name: 'Fort Myers' },
  stPete: { id: '8726520', name: 'St. Petersburg' },
  clearwater: { id: '8726724', name: 'Clearwater Beach' },
  cedarKey: { id: '8727520', name: 'Cedar Key' },
  apalachicola: { id: '8728690', name: 'Apalachicola' },
  panamaCity: { id: '8729108', name: 'Panama City' },
  pensacola: { id: '8729840', name: 'Pensacola' },
};

const Stations = {
  fernandina: Ref.fernandina,
  jaxBeach: { id: '8720291', name: 'Jacksonville Beach', backup: Ref.mayport },
  stAugustineBeach: { id: '8720587', name: 'St. Augustine Beach', backup: Ref.mayport },
  ponceInlet: { id: '8721147', name: 'Ponce de Leon Inlet', backup: Ref.trident },
  cocoaBeach: { id: '8721649', name: 'Cocoa Beach', backup: Ref.trident },
  canovaBeach: { id: '8721804', name: 'Canova Beach', backup: Ref.trident },
  sebastianInlet: { id: '8722004', name: 'Sebastian Inlet', backup: Ref.trident },
  jupiterInlet: { id: '8722495', name: 'Jupiter Inlet', backup: Ref.lakeWorth },
  lakeWorth: Ref.lakeWorth,
  miamiHarbor: { id: '8723170', name: 'Miami Harbor Entrance', backup: Ref.virginiaKey },
  tavernier: { id: '8723747', name: 'Tavernier Harbor', backup: Ref.virginiaKey },
  upperMatecumbe: { id: '8723814', name: 'Upper Matecumbe Key', backup: Ref.vacaKey },
  vacaKey: Ref.vacaKey,
  keyWest: Ref.keyWest,
  naples: Ref.naples,
  fortMyersBeach: { id: '8725366', name: 'Fort Myers Beach (Matanzas Pass)', backup: Ref.fortMyers },
  bocaGrande: { id: '8725577', name: 'Port Boca Grande', backup: Ref.fortMyers },
  siestaKey: { id: '8726034', name: 'Siesta Key (Big Sarasota Pass)', backup: Ref.stPete },
  johnsPass: { id: '8726533', name: "John's Pass", backup: Ref.stPete },
  clearwater: Ref.clearwater,
  cedarKey: Ref.cedarKey,
  stGeorge: { id: '8728486', name: 'St. George Island', backup: Ref.apalachicola },
  pcb: { id: '8729210', name: 'Panama City Beach', backup: Ref.panamaCity },
  destin: { id: '8729511', name: 'Destin (East Pass)', backup: Ref.pensacola },
  pensacolaBeach: { id: '8729807', name: 'Pensacola Beach', backup: Ref.pensacola },
} satisfies Record<string, TideStation>;

export const Spots: Spot[] = [
  // Atlantic
  { id: 'fernandina', name: 'Fernandina Beach', region: 'Atlantic', lat: 30.67, lon: -81.41, facing: 90, tideStation: Stations.fernandina },
  { id: 'jax-beach', name: 'Jacksonville Beach', region: 'Atlantic', lat: 30.29, lon: -81.37, facing: 90, tideStation: Stations.jaxBeach },
  { id: 'st-augustine', name: 'St. Augustine', region: 'Atlantic', lat: 29.86, lon: -81.18, facing: 90, tideStation: Stations.stAugustineBeach },
  { id: 'new-smyrna', name: 'New Smyrna Beach', region: 'Atlantic', lat: 29.03, lon: -80.88, facing: 75, tideStation: Stations.ponceInlet },
  { id: 'cocoa-beach', name: 'Cocoa Beach', region: 'Atlantic', lat: 28.32, lon: -80.58, facing: 90, tideStation: Stations.cocoaBeach },
  { id: 'melbourne-beach', name: 'Melbourne Beach', region: 'Atlantic', lat: 28.07, lon: -80.48, facing: 90, tideStation: Stations.canovaBeach },
  { id: 'sebastian', name: 'Sebastian Inlet', region: 'Atlantic', lat: 27.86, lon: -80.42, facing: 75, tideStation: Stations.sebastianInlet },
  { id: 'jupiter', name: 'Jupiter Inlet', region: 'Atlantic', lat: 26.94, lon: -79.98, facing: 90, tideStation: Stations.jupiterInlet },
  { id: 'palm-beach', name: 'Palm Beach', region: 'Atlantic', lat: 26.71, lon: -80.01, facing: 90, tideStation: Stations.lakeWorth },
  { id: 'miami', name: 'Miami Beach', region: 'Atlantic', lat: 25.79, lon: -80.11, facing: 90, tideStation: Stations.miamiHarbor },
  // Keys
  { id: 'key-largo', name: 'Key Largo', region: 'Keys', lat: 25.08, lon: -80.36, facing: 120, tideStation: Stations.tavernier },
  { id: 'islamorada', name: 'Islamorada', region: 'Keys', lat: 24.9, lon: -80.6, facing: 135, tideStation: Stations.upperMatecumbe },
  { id: 'marathon', name: 'Marathon', region: 'Keys', lat: 24.68, lon: -81.07, facing: 150, tideStation: Stations.vacaKey },
  { id: 'key-west', name: 'Key West', region: 'Keys', lat: 24.52, lon: -81.8, facing: 180, tideStation: Stations.keyWest },
  // Gulf
  { id: 'naples', name: 'Naples', region: 'Gulf', lat: 26.14, lon: -81.83, facing: 270, tideStation: Stations.naples },
  { id: 'fort-myers-beach', name: 'Fort Myers Beach', region: 'Gulf', lat: 26.43, lon: -81.96, facing: 240, tideStation: Stations.fortMyersBeach },
  { id: 'boca-grande', name: 'Boca Grande', region: 'Gulf', lat: 26.72, lon: -82.36, facing: 255, tideStation: Stations.bocaGrande },
  { id: 'siesta-key', name: 'Siesta Key', region: 'Gulf', lat: 27.27, lon: -82.58, facing: 260, tideStation: Stations.siestaKey },
  { id: 'st-pete-beach', name: 'St. Pete Beach', region: 'Gulf', lat: 27.72, lon: -82.77, facing: 260, tideStation: Stations.johnsPass },
  { id: 'clearwater', name: 'Clearwater Beach', region: 'Gulf', lat: 27.98, lon: -82.85, facing: 270, tideStation: Stations.clearwater },
  { id: 'cedar-key', name: 'Cedar Key', region: 'Gulf', lat: 29.12, lon: -83.08, facing: 240, tideStation: Stations.cedarKey },
  // Panhandle
  { id: 'st-george', name: 'St. George Island', region: 'Panhandle', lat: 29.6, lon: -84.88, facing: 180, tideStation: Stations.stGeorge },
  { id: 'panama-city-beach', name: 'Panama City Beach', region: 'Panhandle', lat: 30.14, lon: -85.8, facing: 180, tideStation: Stations.pcb },
  { id: 'destin', name: 'Destin', region: 'Panhandle', lat: 30.36, lon: -86.5, facing: 180, tideStation: Stations.destin },
  { id: 'pensacola-beach', name: 'Pensacola Beach', region: 'Panhandle', lat: 30.31, lon: -87.15, facing: 180, tideStation: Stations.pensacolaBeach },
];

export const DefaultSpotId = 'cocoa-beach';

/** Places the user found with search. Kept in sync by the settings provider. */
let customSpots: Spot[] = [];

export function setCustomSpots(spots: Spot[]) {
  customSpots = spots;
}

export function getSpot(id: string): Spot {
  return Spots.find((s) => s.id === id) ?? customSpots.find((s) => s.id === id) ?? Spots.find((s) => s.id === DefaultSpotId)!;
}

/** A place from the Open-Meteo geocoding search. */
export type Place = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  admin2?: string;
};

/** Rough guess of which way the coast faces and which region a Florida place is in. */
function guessCoast(lat: number, lon: number): { facing: number; region: Region } {
  if (lat < 25.35) return { facing: 150, region: 'Keys' };
  if (lon < -84.2) return { facing: 180, region: 'Panhandle' };
  if (lat >= 28.9 && lon < -82.4) return { facing: 225, region: 'Gulf' };
  if (lon < -81.3) return { facing: 260, region: 'Gulf' };
  return { facing: 90, region: 'Atlantic' };
}

/** Florida places that match the search text, best matches first. */
export async function searchPlaces(query: string): Promise<Place[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=20&language=en&format=json&countryCode=US`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Search is not available right now');
  const data = (await res.json()) as { results?: Place[] };
  return (data.results ?? []).filter((p) => p.admin1 === 'Florida').slice(0, 8);
}

/** Turns a searched place into a spot, with its forecast point a few miles offshore and the nearest tide station. */
export function makeCustomSpot(place: Place): Spot {
  const { facing, region } = guessCoast(place.latitude, place.longitude);
  const rad = (facing * Math.PI) / 180;
  const off = 0.08;
  const lat = +(place.latitude + off * Math.cos(rad)).toFixed(3);
  const lon = +(place.longitude + (off * Math.sin(rad)) / Math.cos((place.latitude * Math.PI) / 180)).toFixed(3);
  let nearest = Spots[0];
  let best = Infinity;
  for (const s of Spots) {
    const d = (s.lat - lat) ** 2 + (s.lon - lon) ** 2;
    if (d < best) {
      best = d;
      nearest = s;
    }
  }
  return {
    id: `place-${place.id}`,
    name: place.name,
    region,
    lat,
    lon,
    facing,
    tideStation: nearest.tideStation,
    custom: true,
  };
}
