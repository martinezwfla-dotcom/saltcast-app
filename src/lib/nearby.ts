/**
 * "Nearby" list for the Today screen, same data and rules as the website's Nearby button (marinas.js):
 * - saved OpenStreetMap lists the website makes at each deploy (/marinas/<id>.json) for marinas, fuel, bait,
 *   waterside food and ramps,
 * - Foursquare places by activity through the website's /api/places (surf shops, dive shops, rentals...),
 * - CHECKED: amenities we confirmed by hand (keep in step with marinas.js on the website).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ActivityId } from '@/data/activities';

const SITE = 'https://saltcastflorida.com';
export const RADIUS_MI = 15;

export type Place = {
  name: string;
  kind: string;
  lat: number;
  lon: number;
  offers: string[];
  phone: string;
  web: string;
  addr: string;
  hours: string;
  checked?: boolean;
  fsq?: boolean;
};

type Checked = { area?: string; name: string; match: RegExp; kind?: string; lat?: number; lon?: number; offers?: string[]; phone?: string; addr?: string };

// Confirmed amenities (copied from marinas.js CHECKED on the website).
const CHECKED: Checked[] = [
  {name:"Gasparilla Marina",match:/gasparilla marina/i,kind:"Marina",lat:26.834,lon:-82.2593,
   offers:["Fuel","Beer & drinks","Ice","Bait & tackle"],phone:"941-697-2280",addr:"15001 Gasparilla Rd, Placida"},
  {name:"Smokin' Jerry's Tiki Bar & Grill",match:/smokin.? jerry|waterside grill/i,kind:"Restaurant",lat:26.8342,lon:-82.2594,
   offers:["Food","Beer & drinks"],phone:"941-697-0724",addr:"15001 Gasparilla Rd, Placida (at Gasparilla Marina)"},
  {area:"bgr",name:"Eldred's Marina",match:/eldred/i,kind:"Marina",offers:["Bait & tackle","Ice","Boat ramp"]},
  // Researched Nov 2026 from each marina's own site and/or two marina directories that agree. No pin of their own
  // (no checked coordinates): they only add offers to the same-named place on the map within ~30 mi of their area spot.
  {area:"clw",name:"Anclote Village Marina",match:/anclote village/i,kind:"Marina",offers:["Fuel", "Bait & tackle"]},
  {area:"clw",name:"Port Tarpon Marina",match:/port tarpon/i,kind:"Marina",offers:["Bait & tackle", "Ice"]},
  {area:"tpa",name:"Pass-A-Grille Marina",match:/pass.?a.?grille marina/i,kind:"Marina",offers:["Fuel", "Bait & tackle", "Ice"]},
  {area:"tpa",name:"Madeira Beach Municipal Marina",match:/madeira beach (municipal )?marina/i,kind:"Marina",offers:["Fuel", "Bait & tackle", "Beer & drinks", "Ice", "Pump-out", "Restrooms", "Showers"]},
  {area:"srq",name:"Safe Harbor Siesta Key",match:/siesta key marina|safe harbor siesta/i,kind:"Marina",offers:["Fuel", "Bait & tackle", "Ice"]},
  {area:"srq",name:"Marina Jack",match:/marina jack/i,kind:"Marina",offers:["Fuel"]},
  {area:"srq",name:"MarineMax Venice",match:/marinemax venice/i,kind:"Marina",offers:["Fuel", "Ice"]},
  {area:"srq",name:"Crow's Nest Marina",match:/crow.?s nest/i,kind:"Marina",offers:["Fuel", "Bait & tackle", "Ice"]},
  {area:"srq",name:"Fisherman's Wharf Marina",match:/fisherman.?s wharf/i,kind:"Marina",offers:["Fuel", "Bait & tackle", "Ice"]},
  {area:"bgr",name:"Boca Grande Marina",match:/boca grande marina/i,kind:"Marina",offers:["Fuel", "Bait & tackle", "Ice"]},
  {area:"bgr",name:"Cape Haze Marina",match:/cape haze marina/i,kind:"Marina",offers:["Fuel", "Ice"]},
  {area:"bgr",name:"Stump Pass Marina",match:/stump pass marina/i,kind:"Marina",offers:["Fuel", "Bait & tackle"]},
  {area:"fmb",name:"Salty Sam's Marina",match:/salty sam/i,kind:"Marina",offers:["Fuel", "Ice"]},
  {area:"fmb",name:"Moss Marina",match:/moss marina/i,kind:"Marina",offers:["Fuel", "Bait & tackle", "Ice"]},
  {area:"fmb",name:"Diversified Yacht Services",match:/diversified yacht/i,kind:"Marina",offers:["Fuel", "Bait & tackle", "Ice", "Beer & drinks"]},
  {area:"fmb",name:"Snook Bight Marina",match:/snook bight/i,kind:"Marina",offers:["Fuel"]},
  {area:"npl",name:"Naples City Dock",match:/naples city dock|city dock/i,kind:"Marina",offers:["Fuel", "Bait & tackle", "Ice", "Pump-out"]},
  {area:"kwt",name:"Garrison Bight Marina",match:/garrison bight marina/i,kind:"Marina",offers:["Fuel", "Bait & tackle"]},
  {area:"kwt",name:"Oceans Edge Marina",match:/ocean.?s edge/i,kind:"Marina",offers:["Fuel", "Bait & tackle", "Ice"]},
  {area:"kwt",name:"Sunset Marina",match:/sunset marina/i,kind:"Marina",offers:["Fuel"]},
  {area:"isl",name:"IslaMarina",match:/islamarina/i,kind:"Marina",offers:["Fuel", "Bait & tackle"]},
  {area:"mth",name:"Sea Bird Marina",match:/sea ?bird marina/i,kind:"Marina",offers:["Fuel", "Bait & tackle"]},
  {area:"mth",name:"Grassy Key Marina",match:/grassy key marina/i,kind:"Marina",offers:["Bait & tackle"]},
  {area:"mia",name:"Haulover Marina",match:/haulover|bill bird/i,kind:"Marina",offers:["Fuel", "Bait & tackle", "Ice", "Restrooms", "Showers"]},
  {area:"mia",name:"Crandon Park Marina",match:/crandon/i,kind:"Marina",offers:["Fuel", "Bait & tackle", "Ice"]},
  {area:"jup",name:"Loggerhead Marina",match:/loggerhead marina/i,kind:"Marina",offers:["Fuel", "Pump-out", "Restrooms", "Showers"]},
  {area:"seb",name:"Sebastian Inlet Marina",match:/sebastian inlet marina/i,kind:"Marina",offers:["Fuel", "Bait & tackle", "Ice", "Pump-out"]},
  {area:"coc",name:"Sunrise Marina",match:/sunrise marina/i,kind:"Marina",offers:["Fuel", "Bait & tackle", "Ice"]},
  {area:"coc",name:"Cape Marina",match:/^cape marina/i,kind:"Marina",offers:["Fuel", "Ice"]},
  {area:"coc",name:"Bluepoints Marina",match:/bluepoints/i,kind:"Marina",offers:["Fuel", "Bait & tackle", "Ice"]},
  {area:"coc",name:"Ocean Club at Port Canaveral",match:/ocean club/i,kind:"Marina",offers:["Fuel", "Ice"]},
  {area:"nsb",name:"New Smyrna Marina",match:/new smyrna marina/i,kind:"Marina",offers:["Fuel", "Bait & tackle", "Ice"]},
  {area:"nsb",name:"River Deck Marina",match:/river deck/i,kind:"Marina",offers:["Fuel", "Bait & tackle"]},
  {area:"sta",name:"Cat's Paw Marina",match:/cat.?s paw/i,kind:"Marina",offers:["Bait & tackle", "Ice"]},
  {area:"sta",name:"Marineland Marina",match:/marineland marina/i,kind:"Marina",offers:["Fuel"]},
  {area:"jax",name:"Morningstar Marina Mayport",match:/morningstar|mayport marina/i,kind:"Marina",offers:["Fuel", "Bait & tackle", "Ice"]},
  {area:"dst",name:"Destin Marina",match:/^destin marina/i,kind:"Marina",offers:["Fuel", "Bait & tackle", "Ice"]},
  {area:"dst",name:"MarineMax Pensacola",match:/marinemax pensacola/i,kind:"Marina",offers:["Fuel", "Ice"]},
  {area:"dst",name:"Pensacola Shipyard Marina",match:/pensacola shipyard/i,kind:"Marina",offers:["Fuel", "Bait & tackle", "Ice"]},
  {area:"pcb",name:"Treasure Island Marina",match:/treasure island marina/i,kind:"Marina",offers:["Fuel", "Bait & tackle", "Ice"]},
  {area:"pcb",name:"MarineMax Panama City Beach",match:/marinemax panama city/i,kind:"Marina",offers:["Fuel", "Bait & tackle", "Ice"]},
  {area:"cdk",name:"Cedar Key Marina II",match:/cedar key marina/i,kind:"Marina",offers:["Fuel", "Bait & tackle", "Ice"]}
 ];

// The website's 20 spots (window.SALTCAST_BASE): saved lists exist for each.
const BASE: Record<string, [number, number]> = {"cdk": [29.14, -83.04], "clw": [27.977, -82.827], "tpa": [27.76, -82.63], "srq": [27.27, -82.56], "bgr": [26.75, -82.26], "fmb": [26.45, -81.95], "npl": [26.14, -81.8], "kwt": [24.555, -81.8], "mth": [24.71, -81.09], "isl": [24.92, -80.63], "mia": [25.73, -80.16], "jup": [26.94, -80.07], "seb": [27.86, -80.45], "mlb": [28.07, -80.56], "coc": [28.32, -80.61], "nsb": [29.03, -80.9], "sta": [29.86, -81.26], "jax": [30.29, -81.39], "dst": [30.38, -86.5], "pcb": [30.18, -85.8]};

export const ICONS: [string, string][] = [
  ['Fuel', '⛽'], ['Food', '🍽️'], ['Beer & drinks', '🍺'], ['Ice', '🧊'], ['Bait & tackle', '🎣'], ['Boat ramp', '🚤'],
  ['Pump-out', '🚽'], ['Restrooms', '🚻'], ['Showers', '🚿'], ['Surf shop', '🏄'], ['Dive shop', '🤿'], ['Rentals', '🛶'],
  ['Lessons & tours', '🧭'],
];
export function icon(o: string) {
  return ICONS.find((x) => x[0] === o)?.[1] ?? '•';
}
export function order(o: string[]) {
  const i = (x: string) => ICONS.findIndex((y) => y[0] === x);
  return o.slice().sort((a, b) => i(a) - i(b));
}

type Mode = {
  label: string;
  title: string;
  filters: [string, string][];
  keep: string[] | null;
  own: string;
};
const BOAT: Mode = {
  label: 'marinas/fuel/restaurants',
  title: 'Marinas, fuel, bait & food',
  filters: [['all', 'All'], ['fuel', 'Fuel'], ['food', 'Food & drinks'], ['bait', 'Bait']],
  keep: null,
  own: 'a marina, fuel dock or bait shop',
};
const MODES: Record<ActivityId, Mode> = {
  fishing: BOAT,
  boating: BOAT,
  sailing: BOAT,
  surfing: { label: 'surf shops/food', title: 'Surf shops, lessons & food', filters: [['all', 'All'], ['surf', 'Surf shops'], ['lessons', 'Lessons'], ['food', 'Food & drinks']], keep: ['Food', 'Beer & drinks'], own: 'a surf shop, surf school or beach bar' },
  diving: { label: 'dive shops/food', title: 'Dive shops, charters & food', filters: [['all', 'All'], ['dive', 'Dive shops'], ['tours', 'Charters & tours'], ['food', 'Food & drinks']], keep: ['Food', 'Beer & drinks'], own: 'a dive shop or dive charter' },
  paddling: { label: 'rentals/launches/food', title: 'Kayak & SUP rentals, launches & food', filters: [['all', 'All'], ['rent', 'Rentals'], ['launch', 'Launches'], ['food', 'Food & drinks']], keep: ['Food', 'Beer & drinks', 'Boat ramp'], own: 'a kayak or paddleboard rental' },
};
export function modeFor(a: ActivityId) {
  return MODES[a] ?? BOAT;
}
const FIL: Record<string, string[]> = {
  fuel: ['Fuel'], food: ['Food', 'Beer & drinks'], bait: ['Bait & tackle'], surf: ['Surf shop'], lessons: ['Lessons & tours'],
  dive: ['Dive shop'], tours: ['Lessons & tours'], rent: ['Rentals'], launch: ['Boat ramp'],
};
const hasAny = (p: Place, l: string[]) => l.some((o) => p.offers.includes(o));
export function matches(p: Place, filter: string) {
  return !FIL[filter] || hasAny(p, FIL[filter]);
}

export function miles(a: number, b: number, c: number, d: number) {
  const R = 3958.8, r = Math.PI / 180, x = (d - b) * r * Math.cos(((a + c) / 2) * r), y = (c - a) * r;
  return Math.sqrt(x * x + y * y) * R;
}

// ---- OpenStreetMap tags (same as marinas.js) ----
type Tags = Record<string, string | undefined>;
const yes = (v?: string) => !!v && v !== 'no';
function offers(t: Tags) {
  const o: string[] = [], has = (x: string) => { if (!o.includes(x)) o.push(x); };
  const sc = t['seamark:small_craft_facility:category'] || '';
  const fuelKeys = Object.keys(t).filter((k) => /^fuel(:|$)/.test(k) && yes(t[k]));
  if (t.amenity === 'fuel' || t.waterway === 'fuel' || /fuel/.test(sc) || fuelKeys.length) has('Fuel');
  if (t.shop === 'fishing' || yes(t.bait) || /bait/i.test(t.name || '') || /bait/i.test(t.description || '')) has('Bait & tackle');
  if (yes(t.ice) || /ice/.test(t.vending || '') || /\bice\b/i.test(t.description || '')) has('Ice');
  if (/^(restaurant|pub|cafe|fast_food)$/.test(t.amenity || '') || yes(t.restaurant) || yes(t.food)) has('Food');
  if (/^(convenience|alcohol|beverages)$/.test(t.shop || '') || /^(bar|pub|biergarten)$/.test(t.amenity || '') || yes(t.bar) || yes(t['drink:beer']) || yes(t.beer)) has('Beer & drinks');
  if (t.shop === 'convenience') has('Ice');
  if (t.leisure === 'slipway' || yes(t.slipway) || yes(t.boat_ramp) || /slipway/.test(sc)) has('Boat ramp');
  if (yes(t.sanitary_dump_station) || yes(t['pump-out']) || yes(t.pump_out) || /pump/.test(sc)) has('Pump-out');
  if (yes(t.toilets)) has('Restrooms');
  if (yes(t.shower) || yes(t.showers)) has('Showers');
  return o;
}
function kind(t: Tags) {
  if (t.shop === 'fishing') return 'Bait & tackle shop';
  if (t.amenity === 'restaurant' || t.amenity === 'cafe' || t.amenity === 'fast_food') return 'Restaurant';
  if (/^(bar|pub|biergarten)$/.test(t.amenity || '')) return 'Bar';
  if (t.shop === 'convenience') return 'Store near the docks';
  if (t.shop === 'alcohol' || t.shop === 'beverages') return 'Beer & wine store';
  if (t.leisure === 'marina') return 'Marina';
  if (t.waterway === 'fuel' || t.amenity === 'fuel') return 'Fuel dock';
  if (t['seamark:type'] === 'small_craft_facility') return 'Boating facility';
  if (t.leisure === 'slipway') return 'Boat ramp / launch';
  return 'Shop';
}
type El = { lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Tags };
function parse(els: El[]) {
  const list: Place[] = [];
  els.forEach((el) => {
    const t = el.tags || {}, lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon;
    const name = t.name || t['seamark:name'];
    if (!name || lat == null || lon == null || t.access === 'private' || t.disused === 'yes') return;
    const a = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ');
    list.push({
      name, kind: kind(t), lat, lon, offers: offers(t), phone: String(t.phone || t['contact:phone'] || '').split(';')[0].trim(),
      web: t.website || t['contact:website'] || '', addr: [a, t['addr:city']].filter(Boolean).join(', '), hours: t.opening_hours || '',
    });
  });
  const out: Place[] = [];
  list.forEach((p) => {
    const dup = out.find((q) => q.name.toLowerCase() === p.name.toLowerCase() && miles(q.lat, q.lon, p.lat, p.lon) < 1);
    if (!dup) return out.push(p);
    p.offers.forEach((o) => { if (!dup.offers.includes(o)) dup.offers.push(o); });
    dup.phone ||= p.phone; dup.web ||= p.web; dup.addr ||= p.addr; dup.hours ||= p.hours;
    if (p.kind === 'Marina') dup.kind = 'Marina';
  });
  return out;
}

// ---- Foursquare (through the website's /api/places) ----
type FsqPlace = { name: string; lat: number; lon: number; cats?: string[]; addr?: string; phone?: string; web?: string; q?: string };
function fsqOffers(p: FsqPlace) {
  const s = (p.cats || []).join(' | ') + ' | ' + p.name, q = p.q || '', o: string[] = [];
  const has = (x: string) => { if (!o.includes(x)) o.push(x); };
  if (/restaurant|food|grill|seafood|caf[eé]|diner|pizza|taco|burger|sandwich|eatery|kitchen|bistro|oyster|crab/i.test(s)) has('Food');
  if (/\bbars?\b|pub|brew|beer|tiki|lounge|saloon|liquor|wine|tavern|cantina/i.test(s)) has('Beer & drinks');
  if (/bait|tackle|fishing (store|shop)/i.test(s)) has('Bait & tackle');
  if (/fuel dock|marine fuel/i.test(s)) has('Fuel');
  if (/surf ?(shop|store|boards?|co\b|company|outfitter)|surf store/i.test(s) || (q === 'surf shop' && /surf/i.test(s) && !/Food|Beer/.test(o.join()))) has('Surf shop');
  if ((/scuba|dive (shop|center|centre|store)|diving|snorkel/i.test(s) || (q === 'dive shop' && /dive|scuba/i.test(s))) && !/dive bar/i.test(s)) has('Dive shop');
  if (/rental|rent\b|rentals|outfitter|kayak|paddle ?board|\bsup\b|canoe/i.test(s)) has('Rentals');
  if (/lesson|school|instruct|tour|charter|excursion|academy|guide|camp/i.test(s)) has('Lessons & tours');
  return o;
}
function fsqKind(p: FsqPlace, o: string[]) {
  const c = (p.cats || []).join(' | ');
  if (/marina|harbor|yacht club/i.test(c) || /marina/i.test(p.name)) return 'Marina';
  if (o.includes('Dive shop')) return 'Dive shop';
  if (o.includes('Surf shop')) return 'Surf shop';
  if (o.includes('Bait & tackle')) return 'Bait & tackle shop';
  if (o.includes('Rentals')) return 'Rentals';
  if (o.includes('Lessons & tours')) return /charter/i.test(c + p.name) ? 'Charter' : 'Lessons & tours';
  if (o.includes('Food')) return 'Restaurant';
  if (o.includes('Beer & drinks')) return 'Bar';
  return p.cats?.[0] || 'Place';
}
const norm = (n: string) => n.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').replace(/\b(the|inc|llc)\b/g, '').trim();

async function getJSON(url: string, ms = 15000) {
  const ctl = new AbortController();
  const tm = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally {
    clearTimeout(tm);
  }
}

async function osmList(lat: number, lon: number): Promise<Place[]> {
  const ids = Object.keys(BASE)
    .map((id) => ({ id, d: miles(lat, lon, BASE[id][0], BASE[id][1]) }))
    .filter((x) => x.d <= RADIUS_MI + 15)
    .sort((a, b) => a.d - b.d)
    .slice(0, 3);
  const arrs = await Promise.all(ids.map((x) => getJSON(`${SITE}/marinas/${x.id}.json`).then((j) => (j.elements || []) as El[]).catch(() => [] as El[])));
  return parse(arrs.flat()).filter((p) => miles(lat, lon, p.lat, p.lon) <= RADIUS_MI + 1);
}

async function fsqList(lat: number, lon: number, act: ActivityId): Promise<Place[]> {
  const a = act === 'paddling' ? 'paddle' : act;
  try {
    const j = await getJSON(`${SITE}/api/places?t=${lat.toFixed(2)},${lon.toFixed(2)},${a}`);
    return ((j.places || []) as FsqPlace[])
      .filter((p) => p && p.name && p.lat != null && miles(lat, lon, p.lat, p.lon) <= RADIUS_MI + 1)
      .map((p) => {
        const o = fsqOffers(p);
        return { name: p.name, kind: fsqKind(p, o), lat: p.lat, lon: p.lon, offers: o, phone: p.phone || '', web: p.web || '', addr: p.addr || '', hours: '', fsq: true };
      });
  } catch {
    return [];
  }
}

function combine(lat: number, lon: number, act: ActivityId, osm: Place[], fs: Place[]): Place[] {
  const out = osm.map((p) => ({ ...p, offers: p.offers.slice() }));
  fs.forEach((p) => {
    const n = norm(p.name);
    const dup = out.find((q) => { const m = norm(q.name); return miles(q.lat, q.lon, p.lat, p.lon) < 0.4 && (m === n || m.startsWith(n) || n.startsWith(m)); });
    if (!dup) return out.push(p);
    p.offers.forEach((o) => { if (!dup.offers.includes(o)) dup.offers.push(o); });
    dup.phone ||= p.phone; dup.web ||= p.web; dup.addr ||= p.addr; dup.fsq = true;
  });
  // Add what we've checked to matching places; checked places with their own pin are added if missing.
  const used: Checked[] = [];
  let list = out.map((p) => {
    const c = CHECKED.find((x) => {
      const a = x.area ? BASE[x.area] : null;
      return x.match.test(p.name) && (x.lat == null || miles(x.lat, x.lon!, p.lat, p.lon) < 2) && (!a || miles(a[0], a[1], p.lat, p.lon) < 30);
    });
    if (!c) return p;
    used.push(c);
    return { ...p, name: c.name, kind: c.kind || p.kind, checked: true, offers: p.offers.concat((c.offers || []).filter((o) => !p.offers.includes(o))), phone: c.phone || p.phone, addr: c.addr || p.addr };
  });
  CHECKED.filter((c) => c.lat != null && !used.includes(c) && miles(lat, lon, c.lat, c.lon!) <= RADIUS_MI).forEach((c) =>
    list.push({ name: c.name, kind: c.kind || 'Marina', lat: c.lat!, lon: c.lon!, offers: c.offers || [], phone: c.phone || '', web: '', addr: c.addr || '', hours: '', checked: true }),
  );
  const seen = new Set<string>();
  list = list.filter((p) => { const k = p.name.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  // For surfing, diving and kayak/SUP keep the shops/rentals found for that activity plus food and ramps.
  const keep = modeFor(act).keep;
  list = list.filter((p) => !keep || (p.fsq && p.offers.length) || (p.kind !== 'Marina' ? hasAny(p, keep) : act === 'paddling' && hasAny(p, ['Boat ramp'])));
  return list.sort((a, b) => miles(lat, lon, a.lat, a.lon) - miles(lat, lon, b.lat, b.lon));
}

/** Nearby places for a spot and activity. Cached on the phone for a day; works offline from the cache. */
export async function loadNearby(lat: number, lon: number, act: ActivityId): Promise<Place[]> {
  const key = `nearby:v1:${act}:${lat.toFixed(3)},${lon.toFixed(3)}`;
  try {
    const c = JSON.parse((await AsyncStorage.getItem(key)) || 'null');
    if (c && Date.now() - c.t < 864e5 && c.list.length) return c.list;
  } catch {}
  const [osm, fs] = await Promise.all([osmList(lat, lon), fsqList(lat, lon, act)]);
  const list = combine(lat, lon, act, osm, fs);
  if (list.length) AsyncStorage.setItem(key, JSON.stringify({ t: Date.now(), list })).catch(() => {});
  return list;
}
