import type { SFSymbol } from 'expo-symbols';

export type ActivityId = 'fishing' | 'surfing' | 'diving' | 'boating' | 'sailing' | 'paddling';

/**
 * Rule-of-thumb limits for one activity. Wind in knots, waves in feet.
 * `good` is the comfortable limit, `maybe` is the most a skilled person would go out in.
 */
export type ActivityRules = {
  wind: { good: number; maybe: number };
  /** Minimum wind, for sailing. */
  minWind?: { good: number; maybe: number };
  waves: { good: number; maybe: number };
  /** Minimum swell, for surfing. */
  minSwell?: { good: number; maybe: number };
  /** Surfing likes offshore wind and is hurt by strong onshore wind. */
  prefersOffshore?: boolean;
};

export type Activity = {
  id: ActivityId;
  name: string;
  icon: SFSymbol;
  rules: ActivityRules;
  tips: string[];
};

export const Activities: Activity[] = [
  {
    id: 'fishing',
    name: 'Fishing',
    icon: 'fish',
    rules: { wind: { good: 12, maybe: 18 }, waves: { good: 3, maybe: 5 } },
    tips: [
      'Fish bite best around a moving tide. Plan to be on the spot an hour either side of high or low water.',
      'A falling barometer before a front often turns the bite on. Get out ahead of it, not after.',
      'Nearshore reefs and wrecks fish well when seas are under 3 ft. Stay inshore and in the passes when it gets rougher.',
      'Check FWC rules for size limits, bag limits, and closed seasons before you keep anything.',
    ],
  },
  {
    id: 'surfing',
    name: 'Surfing',
    icon: 'figure.surfing',
    rules: {
      wind: { good: 10, maybe: 16 },
      waves: { good: 8, maybe: 12 },
      minSwell: { good: 2.5, maybe: 1.5 },
      prefersOffshore: true,
    },
    tips: [
      'Offshore wind, blowing from land toward the water, cleans up the waves. Early mornings are often glassy before the sea breeze fills in.',
      'On the Atlantic side, NE and E swell from fall nor\'easters and passing hurricanes bring the best surf.',
      'The Gulf needs a strong front or a tropical system to get rideable waves. Watch for them and go when they come.',
      'Swell period matters as much as height. 8 seconds or longer means more powerful, better shaped waves.',
    ],
  },
  {
    id: 'diving',
    name: 'Diving & Snorkeling',
    icon: 'water.waves',
    rules: { wind: { good: 10, maybe: 15 }, waves: { good: 2, maybe: 3 } },
    tips: [
      'Calm seas and light wind for a day or two before you dive usually mean better visibility.',
      'Dive near high tide on reefs close to shore. Clearer ocean water pushes in then.',
      'Always fly a dive flag. Florida law requires boats to stay 300 ft away from a flag in open water.',
      'Keys reefs are protected. Don\'t touch or stand on coral, and use reef-safe sunscreen.',
    ],
  },
  {
    id: 'boating',
    name: 'Boating',
    icon: 'ferry',
    rules: { wind: { good: 12, maybe: 20 }, waves: { good: 3, maybe: 5 } },
    tips: [
      'Wind against the tide in an inlet stacks up steep, dangerous waves. Time inlet runs with the tide.',
      'Summer afternoon storms build fast over land and drift offshore. Plan to be back at the dock by early afternoon.',
      'File a float plan with someone on shore and carry a VHF radio. Channel 16 is for distress calls.',
      'Look up the NWS Small Craft Advisory before you go. It covers wind of 20 kt or more, or seas of 7 ft or more.',
    ],
  },
  {
    id: 'sailing',
    name: 'Sailing',
    icon: 'sailboat',
    rules: {
      wind: { good: 18, maybe: 24 },
      minWind: { good: 8, maybe: 5 },
      waves: { good: 4, maybe: 6 },
    },
    tips: [
      'The afternoon sea breeze is reliable in summer, often 10 to 15 kt from the water toward land.',
      'Reef early when gusts are more than 10 kt above the steady wind.',
      'Lightning is the biggest summer threat to a sailboat. Head in when you see storms building.',
      'Fall and winter fronts bring steady north wind for a day or two after they pass. That\'s good sailing for experienced crews.',
    ],
  },
  {
    id: 'paddling',
    name: 'Kayak & SUP',
    icon: 'figure.water.fitness',
    rules: { wind: { good: 8, maybe: 12 }, waves: { good: 1.5, maybe: 2.5 } },
    tips: [
      'Paddle into the wind on the way out so it helps you on the way home, when you\'re tired.',
      'Mangrove creeks and the back bays stay calm when the open water is choppy.',
      'Wear a leash on a SUP and a PFD on both. Bring water. Florida sun drains you fast.',
      'Watch the tide in shallow flats. A falling tide can leave you dragging your board across the mud.',
    ],
  },
];

export const DefaultActivityId: ActivityId = 'fishing';

export function getActivity(id: ActivityId): Activity {
  return Activities.find((a) => a.id === id) ?? Activities[0];
}

export const SeasonalOutlook: { season: string; text: string }[] = [
  {
    season: 'Fall (Sep to Nov)',
    text: 'The first cold fronts bring north wind and cooler water. It\'s prime time for surf on the Atlantic side and for the mullet run. Hurricane season runs through November 30.',
  },
  {
    season: 'Winter (Dec to Feb)',
    text: 'Fronts come through every few days with a strong north wind behind them. The days between fronts are often calm and clear, which is best for diving and the flats.',
  },
  {
    season: 'Spring (Mar to May)',
    text: 'This is the calmest, driest stretch of the year. Water warms up, visibility is good, and tarpon and cobia show up on the Gulf coast.',
  },
  {
    season: 'Summer (Jun to Aug)',
    text: 'Mornings are calm and hot, and thunderstorms come almost every afternoon. Get out early and be back before the storms. Watch the tropics.',
  },
];
