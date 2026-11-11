import type { ActivityId } from '@/data/activities';

/**
 * Dock Talk tips for each month, the same as on saltcastflorida.com.
 * `general` is the big picture; the rest are per activity. January first.
 */
export type MonthTips = { general: string } & Record<ActivityId, string>;

export const MonthlyTips: MonthTips[] = [
  // January
  {
    general:
      'January is the coldest month. Strong fronts come through every few days, with a day or two of hard north wind and chilly mornings, then calm, sunny days behind them. Water drops into the 60s up north and near 70 in the Keys. Plan around the calm days between fronts.',
    fishing:
      'Fish the warmest part of the afternoon. Sheepshead are thick around docks, bridges and jetties, and trout and redfish stack up in deep creeks, canals and residential basins on cold days. Big low tides after a front show you exactly where the fish will be.',
    surfing:
      "Fronts and nor'easters bring the most consistent east coast surf of winter. You'll want a full wetsuit north of the Cape. Gulf surf pops up for a day as a strong front arrives.",
    diving:
      'The water is at its coolest, so bring a thicker wetsuit. Springs have great visibility. On the reefs, wait two or three calm days after a front for the water to clear. Lobster season stays open through March.',
    boating:
      'Go on the calm days between fronts and be back early, because the next front can come in fast. North wind over 15 knots makes inlets and open bays rough, especially against an outgoing tide. Dress warm, since wind chill on the water is real.',
    sailing:
      'Winter fronts bring the strongest, steadiest wind of the year, often 15 to 25 knots from the north for a day or two. Great for experienced crews who reef early. The lighter days as each front fades are easy sailing.',
    paddling:
      'The water is cold, so dress for falling in, not for the air. Springs stay about 72 degrees all year and fill up with manatees, so give them space. Paddle sheltered creeks and rivers on windy days.',
  },
  // February
  {
    general:
      'February is still winter, with fronts every few days, but the days get longer and warmer by the end of the month. The calm, sunny stretches between fronts are some of the nicest days of the year.',
    fishing:
      'Sheepshead are at their peak around docks, bridges and jetties. Trout and reds sit in deeper water on cold mornings and slide onto shallow, dark-bottom flats to warm up in the afternoon. Late in the month, warming water starts to wake up the snook.',
    surfing:
      "Fronts and nor'easters keep sending swell to the east coast, and the water is cold, so wear a full suit up north. Gulf surf only shows up with strong fronts. Check the morning after a front, when the wind turns offshore.",
    diving:
      'Springs have excellent visibility, and the reefs clear up after a few calm days. The water is still cool, so a thicker suit helps. Lobster season stays open through March.',
    boating:
      'Plan around the fronts. The days right after a front are windy and cold, and the days before the next one are often calm and warm. Low winter tides can leave channels and ramps shallow, so check the tide before you go.',
    sailing:
      'Fronts still bring strong north wind, and some days a steady 10 to 15 knot breeze returns as it warms. Reef early on post-front days. Regatta season is in full swing.',
    paddling:
      'Clear, calm water between fronts makes for great sight paddling. Manatees are still in the springs and warm-water outflows. Dress for cold water, and paddle into the wind first so it carries you home.',
  },
  // March
  {
    general:
      'March is the turn to spring. Fronts get weaker and less frequent, and windy stretches from the east and southeast become more common. The water warms fast and the bite picks up everywhere. Expect crowds during spring break.',
    fishing:
      'Spring is one of the best times of the year. Snook move from the backcountry toward the passes and beaches, and cobia start running along both coasts. Pompano and Spanish mackerel show up on the beaches as the water warms past 70.',
    surfing:
      "Swell gets less frequent as fronts fade. East coast surf comes from late nor'easters and windy east wind days. A spring suit is usually enough in South and Central Florida.",
    diving:
      'The water is warming into the mid 70s. Keys reefs are great after a few calm days, but windy east wind stretches stir them up. Lobster season closes March 31.',
    boating:
      'Spring brings windy stretches from the east and southeast, often 15 knots or more for several days. Mornings are calmest. Spring break makes ramps and sandbars crowded, so go early on weekdays.',
    sailing:
      "March is often the windiest month, with steady east and southeast breezes and the last fronts. Good sailing most days for experienced crews. Reef early when it's gusty.",
    paddling:
      'The water is warming and the wind is up, so pick sheltered mangrove tunnels and back bays on breezy days. Early mornings are often calm. Manatees leave the springs as the water warms.',
  },
  // April
  {
    general:
      "April is one of the best months on the water. Fronts are mostly gone, the water is warm, and the air is dry and sunny. Mornings are light, and a sea breeze builds most afternoons. The rainy season hasn't started yet.",
    fishing:
      'Tarpon start showing up in the Keys and along the Gulf coast late in the month. Snook are on the beaches and passes, cobia are running, and Spanish mackerel and kingfish are thick near the beaches. Fish early, before the sea breeze.',
    surfing:
      'Surf gets smaller and less frequent as the wind settles. East coast swell comes from occasional east wind events. Go at dawn before the sea breeze turns it choppy.',
    diving:
      'Calm seas and warm, clear water make April one of the best dive months. Keys reefs and wrecks are often at their best. Watch for the afternoon sea breeze kicking up chop.',
    boating:
      'Mornings are usually calm, with a sea breeze building to 10 to 15 knots by afternoon. A great month for offshore runs on calm days. Afternoon storms are still rare.',
    sailing:
      'The sea breeze sets up most afternoons, often a steady 10 to 15 knots. Great sailing on Tampa Bay, Biscayne Bay and the Indian River. Mornings are often light.',
    paddling:
      'Warm, calm mornings are perfect for paddling. Stay in the back bays when the afternoon sea breeze comes up. Watch for nesting birds on mangrove islands and give them space.',
  },
  // May
  {
    general:
      'May is the last dry month before summer. Mornings are calm and hot, and the afternoon sea breeze is reliable. Late in the month the rainy season starts and afternoon storms return. Hurricane season begins June 1.',
    fishing:
      'Tarpon season is in full swing along both coasts and in the Keys. Snook are spawning on the beaches and passes. Offshore, mahi are running off the Atlantic coast and the Keys.',
    surfing:
      'Surf is usually small. Watch for east wind swells and early tropical systems. Dawn sessions are the cleanest, before the sea breeze.',
    diving:
      'Warm water and calm seas make for great diving, and the Keys are near 80 degrees. Watch the afternoon weather and be off the water before storms build.',
    boating:
      'Get out early. Calm mornings give way to a sea breeze by midday, and by late May afternoon storms can build fast. Plan to be back by early afternoon and keep an eye on the sky.',
    sailing:
      'Steady afternoon sea breezes make for good sailing. By late May, watch for afternoon storms with sudden strong gusts and lightning, and head in when you see them building.',
    paddling:
      "Go at sunrise while it's glassy and cooler. Bring plenty of water and sun protection. Head in before afternoon storms, which come faster later in the month.",
  },
  // June
  {
    general:
      'June starts summer and hurricane season. Mornings are calm and hot, and afternoon storms with lightning build almost every day. Plan to be off the water by early afternoon, and keep an eye on the tropics.',
    fishing:
      "Tarpon are still around on both coasts. Snook are on the beaches, and snook season is closed, so it's catch and release. Fish at dawn and dusk when it's cooler. Offshore, mahi are a good bet.",
    surfing:
      'Summer surf is usually flat. Watch for tropical systems that can send swell to the east coast, and go early before the sea breeze.',
    diving:
      'Calm seas and warm water make summer prime dive season, and Keys visibility is often excellent. Dive in the morning, before afternoon storms build.',
    boating:
      'Get out early and be back before afternoon storms build, usually by 1 or 2 p.m. Lightning is the biggest danger, so head in at the first rumble of thunder. Seas are usually calm in the mornings.',
    sailing:
      'Mornings can be light and afternoons stormy. Storms bring sudden strong gusts and wind shifts, so watch the sky. The sea breeze between storms makes for nice sailing.',
    paddling:
      'Paddle at sunrise for calm water and cooler air. Bring lots of water and sun protection. Lightning is the biggest risk, so be off the water by early afternoon.',
  },
  // July
  {
    general:
      'July is peak summer: hot and humid, with afternoon storms most days. Mornings are the calmest part of the day. The tropics are getting more active, so check the hurricane outlook before planning trips.',
    fishing:
      "Fish early and late, when it's cooler and the fish are feeding. Snook are on the beaches and passes, and tarpon are still around. Scallop season is open in parts of the Big Bend. Offshore, mahi and grouper are good.",
    surfing:
      'Mostly flat, except for swell from tropical systems. When one sends swell, go early before the wind turns onshore.',
    diving:
      'Calm, warm water and great visibility. Lobster mini season in late July brings lots of people out. Dive early and be done before afternoon storms.',
    boating:
      'Get out at dawn and be back by early afternoon. Afternoon storms bring lightning, sudden gusts and heavy rain. Mornings are usually calm and great for offshore runs.',
    sailing:
      'Light mornings and stormy afternoons. The sea breeze between storms can be nice, but storms bring sudden 30-plus knot gusts. Keep a close eye on the sky.',
    paddling:
      'Sunrise paddles are best, before the heat and storms. Bring lots of water. Stay close to shore and head in when storms build.',
  },
  // August
  {
    general:
      'August is hot and stormy, and the peak of hurricane season is close. Afternoon storms are almost daily and mornings are calm. Watch the tropics closely and have a plan if a storm heads your way.',
    fishing:
      "Fish early and late, when it's cooler. Snook are still on the beaches and passes. Redfish start schooling on the flats late in the month. Offshore, mahi and grouper are good on calm mornings.",
    surfing:
      'Mostly flat unless a tropical system sends swell. Hurricane swell can be big and dangerous, so know your limits and watch for rip currents.',
    diving:
      'Lobster season opens in early August, and the water is the warmest of the year. Visibility is usually good. Dive in the morning, before afternoon storms.',
    boating:
      'Get out at dawn and be back before afternoon storms. Check the tropical outlook before you go. Seas are usually calm in the mornings.',
    sailing:
      'Light, hot mornings and stormy afternoons. Watch for sudden squalls, and check the tropics before any longer trip.',
    paddling:
      'Go at sunrise and finish early. The heat is intense, so bring lots of water and take breaks. Head in when storms start building.',
  },
  // September
  {
    general:
      "September is the peak of hurricane season, so watch the tropics closely. It's still hot, with afternoon storms, but the first hints of fall arrive late in the month. Mornings are the calmest part of the day.",
    fishing:
      'The fall mullet run starts along the Atlantic coast, and snook, tarpon and jacks chase the bait. Redfish are schooling on the Gulf flats. Fish the moving tide early in the day.',
    surfing:
      "Hurricane season brings the best chance for big swell on the east coast, and late-month nor'easters can start the fall surf season. Watch for rip currents.",
    diving:
      'The water is still very warm and visibility is good on calm days. Storms in the tropics can send swell and stir things up, so check the forecast.',
    boating:
      'Check the tropical outlook every day. Mornings are calm, and afternoon storms still build. Late in the month, the first fronts can bring windy days from the northeast.',
    sailing:
      'Light wind and stormy afternoons, with northeast wind picking up late in the month. Keep a close eye on the tropics.',
    paddling:
      "Go at sunrise, since it's still hot, and bring lots of water. The mullet run brings tons of action to the inlets and beaches.",
  },
  // October
  {
    general:
      'October is when Florida starts to turn. The first cool fronts bring a day or two of north wind and choppy water, then a few calm, clear days behind them. Those post-front days are the ones to plan around. Still hurricane season, so keep an eye on the tropics.',
    fishing:
      'Fish the moving tide, and the first two hours after sunrise beat the middle of the day. The fall mullet run along the Atlantic side gets snook, tarpon and jacks fired up. On the Gulf side, redfish are schooling on the flats in Tampa Bay.',
    surfing:
      'Fall is the best surf season on the east coast. Watch for a northeast swell with a period of 8 seconds or more, and go early before the sea breeze turns it onshore. Gulf surf needs a real front or a storm in the Gulf, so check after a front comes through.',
    diving:
      'The Keys reefs are best after a few calm days in a row. Visibility drops after a front or heavy rain, so give it a couple of days to clear.',
    boating:
      'Mornings are usually calmer. Afternoon sea breezes and storms build fast, so plan to be heading in by early afternoon. Skip the day after a front if the north wind is still blowing over 15 knots.',
    sailing:
      'The afternoon sea breeze is your friend on Tampa Bay, often a steady 10 to 15 knots. Post-front days can be gusty, so reef early.',
    paddling:
      "Get out at sunrise while it's glassy. Stay in the mangroves and back bays when the wind picks up, and paddle into the wind first so it carries you home.",
  },
  // November
  {
    general:
      'November is when fall fronts take over. A cold front comes through about once a week, bringing a day or two of north wind, rough water and cooler air. The calm, clear days behind each front are the ones to plan around. The water is cooling, sunset is before 6 now, and hurricane season ends November 30.',
    fishing:
      'Fish the moving tide, and the warmest part of the day gets better as the water cools. Snook are moving into rivers and back bays, and trout and redfish slide into deeper holes and creeks after a front. Kingfish and pompano are running along the beaches on both coasts.',
    surfing:
      "Fronts and nor'easters send northeast swell down the east coast, so watch for a period of 8 seconds or more. Go early before the wind gets strong. The water is cooling, so a spring suit helps up north. Gulf surf shows up right as a front comes through.",
    diving:
      'Lobster season is open. The Keys reefs are best after a few calm days in a row. Each front stirs up the water, so give it a couple of days to clear. The water is cooling, so bring a thicker wetsuit.',
    boating:
      'The afternoon sea breeze is weaker now, so plan around the fronts instead. Skip the day or two after a front while the north wind is still blowing over 15 knots, and go on the calm days behind it. Sunset comes early, so plan to be back before dark.',
    sailing:
      "Fronts bring a steady north to northeast breeze, often 15 to 25 knots for a day or two. That's good sailing for experienced crews. Reef early, and pick the lighter days as the front fades for an easy sail.",
    paddling:
      "The water is getting colder, so dress for falling in. Springs and rivers are clear and calm when it's windy on the coast. Paddle into the wind first so it carries you home. Manatees start moving into warm springs late in the month.",
  },
  // December
  {
    general:
      'December brings real winter fronts, often every few days, with cold, windy days right behind them and calm, sunny days before the next one. The water keeps cooling. Hurricane season is over, so the tropics are quiet.',
    fishing:
      'Sheepshead are moving onto docks, bridges and jetties. Trout and redfish move into deeper creeks, canals and residential basins on cold days. On warm, sunny afternoons after a front, the flats can be great.',
    surfing:
      "Fronts and nor'easters keep the east coast surf going, and you'll need a wetsuit up north. Gulf surf shows up as strong fronts come through.",
    diving:
      'The water is cooling, so bring a thicker wetsuit. Springs have great visibility, and the reefs clear up after a few calm days between fronts. Lobster season is open.',
    boating:
      'Plan around the fronts. Skip the cold, windy days right after a front and go on the calm days before the next one. Sunset is around 5:30, so plan to be back early.',
    sailing:
      'Fronts bring strong north wind, often 15 to 25 knots. Reef early. Lighter days between fronts are easy sailing, and holiday boat parades light up the bays.',
    paddling:
      'Dress for cold water. Manatees move into the springs and warm-water outflows, so watch for them and give them space. Springs are clear and warm all year.',
  },
];

export const MonthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Tips for the current month in Florida (Eastern time). */
export function currentMonth(now = new Date()) {
  // Florida's Panhandle is on Central time, but the month is the same either way except at midnight.
  const month = new Date(now.getTime() - 5 * 3600 * 1000).getUTCMonth();
  return { name: MonthNames[month], tips: MonthlyTips[month] };
}
