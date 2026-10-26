export type Region = 'Atlantic' | 'Keys' | 'Gulf' | 'Panhandle';

export const Regions: Region[] = ['Gulf', 'Keys', 'Atlantic', 'Panhandle'];

export type Spot = {
  id: string;
  name: string;
  region: Region;
  /** A point just offshore, used for the marine forecast. */
  lat: number;
  lon: number;
  /** Compass bearing the beach faces, toward open water. Used to tell offshore from onshore wind. */
  facing: number;
  /** NOAA tide prediction station. */
  tideStation: { id: string; name: string };
};

const Stations = {
  fernandina: { id: '8720030', name: 'Fernandina Beach' },
  mayport: { id: '8720218', name: 'Mayport' },
  trident: { id: '8721604', name: 'Trident Pier, Port Canaveral' },
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

export const Spots: Spot[] = [
  // Atlantic
  { id: 'fernandina', name: 'Fernandina Beach', region: 'Atlantic', lat: 30.67, lon: -81.41, facing: 90, tideStation: Stations.fernandina },
  { id: 'jax-beach', name: 'Jacksonville Beach', region: 'Atlantic', lat: 30.29, lon: -81.37, facing: 90, tideStation: Stations.mayport },
  { id: 'cocoa-beach', name: 'Cocoa Beach', region: 'Atlantic', lat: 28.32, lon: -80.58, facing: 90, tideStation: Stations.trident },
  { id: 'sebastian', name: 'Sebastian Inlet', region: 'Atlantic', lat: 27.86, lon: -80.42, facing: 75, tideStation: Stations.trident },
  { id: 'palm-beach', name: 'Palm Beach', region: 'Atlantic', lat: 26.71, lon: -80.01, facing: 90, tideStation: Stations.lakeWorth },
  { id: 'miami', name: 'Miami Beach', region: 'Atlantic', lat: 25.79, lon: -80.11, facing: 90, tideStation: Stations.virginiaKey },
  // Keys
  { id: 'key-largo', name: 'Key Largo', region: 'Keys', lat: 25.08, lon: -80.36, facing: 120, tideStation: Stations.virginiaKey },
  { id: 'islamorada', name: 'Islamorada', region: 'Keys', lat: 24.9, lon: -80.6, facing: 135, tideStation: Stations.vacaKey },
  { id: 'marathon', name: 'Marathon', region: 'Keys', lat: 24.68, lon: -81.07, facing: 150, tideStation: Stations.vacaKey },
  { id: 'key-west', name: 'Key West', region: 'Keys', lat: 24.52, lon: -81.8, facing: 180, tideStation: Stations.keyWest },
  // Gulf
  { id: 'naples', name: 'Naples', region: 'Gulf', lat: 26.14, lon: -81.83, facing: 270, tideStation: Stations.naples },
  { id: 'fort-myers-beach', name: 'Fort Myers Beach', region: 'Gulf', lat: 26.43, lon: -81.96, facing: 240, tideStation: Stations.fortMyers },
  { id: 'siesta-key', name: 'Siesta Key', region: 'Gulf', lat: 27.27, lon: -82.58, facing: 260, tideStation: Stations.stPete },
  { id: 'st-pete-beach', name: 'St. Pete Beach', region: 'Gulf', lat: 27.72, lon: -82.77, facing: 260, tideStation: Stations.stPete },
  { id: 'clearwater', name: 'Clearwater Beach', region: 'Gulf', lat: 27.98, lon: -82.85, facing: 270, tideStation: Stations.clearwater },
  { id: 'cedar-key', name: 'Cedar Key', region: 'Gulf', lat: 29.12, lon: -83.08, facing: 240, tideStation: Stations.cedarKey },
  // Panhandle
  { id: 'st-george', name: 'St. George Island', region: 'Panhandle', lat: 29.6, lon: -84.88, facing: 180, tideStation: Stations.apalachicola },
  { id: 'panama-city-beach', name: 'Panama City Beach', region: 'Panhandle', lat: 30.14, lon: -85.8, facing: 180, tideStation: Stations.panamaCity },
  { id: 'destin', name: 'Destin', region: 'Panhandle', lat: 30.36, lon: -86.5, facing: 180, tideStation: Stations.panamaCity },
  { id: 'pensacola-beach', name: 'Pensacola Beach', region: 'Panhandle', lat: 30.31, lon: -87.15, facing: 180, tideStation: Stations.pensacola },
];

export const DefaultSpotId = 'cocoa-beach';

export function getSpot(id: string): Spot {
  return Spots.find((s) => s.id === id) ?? Spots.find((s) => s.id === DefaultSpotId)!;
}
