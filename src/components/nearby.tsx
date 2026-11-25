import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import type { ActivityId } from '@/data/activities';
import type { Spot } from '@/data/spots';
import { icon, ICONS, loadNearby, matches, miles, modeFor, order, RADIUS_MI, type Place } from '@/lib/nearby';

const C = Colors.dark;
const MAX = 12;

export function nearbyLabel(activityId: ActivityId) {
  return `Nearby ${modeFor(activityId).label}`;
}

// Directions open Apple Maps on iPhone (the phone's own maps app elsewhere). No Google links.
function directions(p: Place) {
  const ll = `${p.lat.toFixed(5)},${p.lon.toFixed(5)}`;
  const url = Platform.OS === 'ios' ? `https://maps.apple.com/?daddr=${ll}&q=${encodeURIComponent(p.name)}` : `geo:${ll}?q=${ll}(${encodeURIComponent(p.name)})`;
  Linking.openURL(url).catch(() => {});
}

/** Give it key={spot + activity} so the filters and list start fresh when either changes.
 * Marinas, fuel, bait and food (or surf/dive shops and rentals, by activity) near the spot. Same list as the website. */
export function NearbyPanel({ spot, activityId }: { spot: Spot; activityId: ActivityId }) {
  const mode = modeFor(activityId);
  const [list, setList] = useState<Place[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState('all');
  const [all, setAll] = useState(false);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    let live = true;
    loadNearby(spot.lat, spot.lon, activityId)
      .then((l) => live && setList(l))
      .catch(() => live && (setFailed(true), setList([])));
    return () => {
      live = false;
    };
  }, [spot.lat, spot.lon, activityId, tries]);

  const shown = (list || []).filter((p) => matches(p, filter));
  const cut = all ? shown : shown.slice(0, MAX);
  const present = ICONS.filter(([o]) => (list || []).some((p) => p.offers.includes(o)));

  return (
    <View style={styles.wrap}>
      <ThemedText type="small" themeColor="textSecondary">
        {mode.title} within {RADIUS_MI} mi of {spot.name}
      </ThemedText>
      <View style={styles.row}>
        {mode.filters.map(([id, label]) => (
          <Pressable key={id} onPress={() => setFilter(id)} style={[styles.chip, filter === id && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: filter === id }}>
            <ThemedText type="smallBold" style={{ color: filter === id ? C.background : C.text }}>
              {label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
      {present.length ? (
        <View style={styles.legend}>
          {present.map(([o, g]) => (
            <ThemedText key={o} type="small" themeColor="textSecondary">
              {g} {o}
            </ThemedText>
          ))}
        </View>
      ) : null}

      {list === null ? (
        <View style={styles.row}>
          <ActivityIndicator color={C.accent} />
          <ThemedText type="small" themeColor="textSecondary">
            Finding places near {spot.name}…
          </ThemedText>
        </View>
      ) : !cut.length ? (
        <View style={{ gap: 6 }}>
          <ThemedText type="small" themeColor="textSecondary">
            {failed || !list.length ? "Couldn't load the list. Check your connection and try again." : 'None of the places nearby list that. Try All.'}
          </ThemedText>
          {!list.length ? (
            <Pressable
              onPress={() => {
                setList(null);
                setFailed(false);
                setTries((t) => t + 1);
              }}
              accessibilityRole="button">
              <ThemedText type="smallBold" themeColor="accent">
                Try again
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      ) : (
        cut.map((p) => <PlaceRow key={`${p.name}${p.lat}`} p={p} spot={spot} boat={!mode.keep} />)
      )}
      {shown.length > cut.length ? (
        <Pressable onPress={() => setAll(true)} accessibilityRole="button">
          <ThemedText type="smallBold" themeColor="accent">
            Show all {shown.length}
          </ThemedText>
        </Pressable>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary">
        Not every place lists everything it offers, and hours change, so call ahead. Listings from OpenStreetMap contributors
        {(list || []).some((p) => p.fsq) ? ' and Foursquare' : ''}. Own {mode.own}?
      </ThemedText>
      <Pressable onPress={() => WebBrowser.openBrowserAsync('https://saltcastflorida.com/advertise/')} accessibilityRole="link">
        <ThemedText type="smallBold" themeColor="accent">
          Get featured here
        </ThemedText>
      </Pressable>
    </View>
  );
}

function PlaceRow({ p, spot, boat }: { p: Place; spot: Spot; boat: boolean }) {
  const d = miles(spot.lat, spot.lon, p.lat, p.lon);
  const dine = boat && !p.fsq && /^(Restaurant|Bar)$/.test(p.kind) ? ' · by the docks, call about tie-up' : '';
  return (
    <View style={styles.place}>
      <View style={styles.top}>
        <ThemedText type="smallBold" style={{ flex: 1, fontSize: 16 }}>
          {p.name}
        </ThemedText>
        {p.checked ? (
          <ThemedText type="small" style={styles.checked}>
            ✓ Checked
          </ThemedText>
        ) : null}
        <ThemedText type="small" themeColor="textSecondary">
          {d < 10 ? d.toFixed(1) : Math.round(d)} mi
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {p.kind}
        {dine}
        {p.addr ? ` · ${p.addr}` : ''}
      </ThemedText>
      {p.offers.length ? (
        <View style={styles.legend}>
          {order(p.offers).map((o) => (
            <View key={o} style={styles.ic} accessible accessibilityLabel={o}>
              <ThemedText style={{ fontSize: 17, lineHeight: 22 }}>{icon(o)}</ThemedText>
            </View>
          ))}
        </View>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          Services not listed. Call ahead.
        </ThemedText>
      )}
      <View style={styles.links}>
        <Pressable onPress={() => directions(p)} accessibilityRole="link" style={styles.link}>
          <Icon name="arrow.triangle.turn.up.right.diamond" size={14} />
          <ThemedText type="smallBold" themeColor="accent">
            Directions
          </ThemedText>
        </Pressable>
        {p.phone ? (
          <Pressable onPress={() => Linking.openURL(`tel:${p.phone.replace(/[^\d+]/g, '')}`).catch(() => {})} accessibilityRole="link" style={styles.link}>
            <Icon name="phone" size={14} />
            <ThemedText type="smallBold" themeColor="accent">
              Call
            </ThemedText>
          </Pressable>
        ) : null}
        {p.web ? (
          <Pressable onPress={() => WebBrowser.openBrowserAsync(/^https?:\/\//i.test(p.web) ? p.web : `https://${p.web}`)} accessibilityRole="link" style={styles.link}>
            <Icon name="safari" size={14} />
            <ThemedText type="smallBold" themeColor="accent">
              Website
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two, paddingTop: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: C.accent },
  chipOn: { backgroundColor: C.accent },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, columnGap: 12 },
  place: { gap: 5, padding: 12, borderRadius: 12, backgroundColor: C.backgroundSelected },
  top: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  checked: { color: C.go, fontSize: 11 },
  ic: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: C.backgroundElement, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, paddingTop: 2 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 36 },
});
