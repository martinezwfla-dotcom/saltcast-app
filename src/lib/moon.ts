import type { SymbolViewProps } from 'expo-symbols';

const SYN = 29.530588853; // average days from one new moon to the next
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // a known new moon

export type MoonInfo = { name: string; pct: number; next: string; soon: boolean; symbol: SymbolViewProps['name'] };

/** Moon phase worked out from the average lunar month (good to within about half a day). */
export function moonInfo(ms: number): MoonInfo {
  const age = ((((ms - NEW_MOON) / 864e5) % SYN) + SYN) % SYN;
  const pct = Math.round(((1 - Math.cos((2 * Math.PI * age) / SYN)) / 2) * 100);
  const [name, symbol]: [string, SymbolViewProps['name']] =
    age < 1 || age > SYN - 1
      ? ['New moon', 'moonphase.new.moon']
      : age < 6.4
        ? ['Waxing crescent', 'moonphase.waxing.crescent']
        : age < 8.4
          ? ['First quarter', 'moonphase.first.quarter']
          : age < 13.8
            ? ['Waxing gibbous', 'moonphase.waxing.gibbous']
            : age < 15.8
              ? ['Full moon', 'moonphase.full.moon']
              : age < 21.1
                ? ['Waning gibbous', 'moonphase.waning.gibbous']
                : age < 23.1
                  ? ['Last quarter', 'moonphase.last.quarter']
                  : ['Waning crescent', 'moonphase.waning.crescent'];
  const toFull = (SYN / 2 - age + SYN) % SYN;
  const toNew = SYN - age;
  const full = toFull < toNew;
  const days = Math.min(toFull, toNew);
  const when = new Date(ms + days * 864e5).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return { name, pct, symbol, soon: days < 0.6, next: `${full ? 'Full' : 'New'} moon ${days < 0.6 ? 'today' : when}` };
}
