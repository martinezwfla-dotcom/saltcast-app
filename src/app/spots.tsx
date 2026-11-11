import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Header, Icon, Screen } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { Activities } from '@/data/activities';
import { requestAlertPermission } from '@/lib/alerts';
import { makeCustomSpot, Regions, searchPlaces, Spots, type Place, type Spot } from '@/data/spots';
import type { Units } from '@/lib/format';
import { useSettings } from '@/state/settings';

const C = Colors.dark;

function SpotRow({ spot, editing }: { spot: Spot; editing?: boolean }) {
  const { spotId, favorites, setSpot, toggleFavorite, hideSpot } = useSettings();
  const selected = spot.id === spotId;
  const favorite = favorites.includes(spot.id);

  return (
    <View style={styles.row}>
      <Pressable
        style={styles.rowMain}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={() => {
          setSpot(spot.id);
          router.navigate('/');
        }}>
        <View style={{ flex: 1 }}>
          <ThemedText type="smallBold">{spot.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {spot.custom
              ? `Searched place · tides from ${spot.tideStation.name}`
              : `Tides from ${spot.tideStation.name}`}
          </ThemedText>
        </View>
        {selected ? <Icon name="checkmark" size={16} /> : null}
      </Pressable>
      {editing ? (
        <Pressable
          onPress={() => hideSpot(spot.id)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${spot.name} from the list`}>
          <Icon name="minus.circle.fill" size={22} color={C.noGo} />
        </Pressable>
      ) : (
        <Pressable
          onPress={() => toggleFavorite(spot.id)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={favorite ? `Remove ${spot.name} from favorites` : `Add ${spot.name} to favorites`}>
          <Icon name={favorite ? 'star.fill' : 'star'} size={20} color={favorite ? C.maybe : C.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

function PlaceSearch() {
  const { addCustomSpot } = useSettings();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function search() {
    const q = query.trim();
    if (q.length < 2) return;
    setBusy(true);
    setMessage(null);
    setResults(null);
    try {
      const found = await searchPlaces(q);
      setResults(found);
      if (!found.length) setMessage(`No Florida places found for "${q}". Try a nearby town or beach name.`);
    } catch {
      setMessage("Search isn't available right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function pick(place: Place) {
    addCustomSpot(makeCustomSpot(place));
    setQuery('');
    setResults(null);
    router.navigate('/');
  }

  return (
    <Card style={{ gap: Spacing.two }}>
      <View style={styles.searchRow}>
        <Icon name="magnifyingglass" size={16} color={C.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          placeholder="Search any Florida beach or town"
          placeholderTextColor={C.textSecondary}
          returnKeyType="search"
          autoCorrect={false}
          style={styles.searchInput}
          accessibilityLabel="Search any Florida beach or town"
        />
        {busy ? <ActivityIndicator color={C.accent} /> : null}
      </View>
      {message ? (
        <ThemedText type="small" themeColor="textSecondary">
          {message}
        </ThemedText>
      ) : null}
      {results?.map((p) => (
        <Pressable key={p.id} onPress={() => pick(p)} style={styles.row} accessibilityRole="button">
          <View style={{ flex: 1 }}>
            <ThemedText type="smallBold">{p.name}</ThemedText>
            {p.admin2 ? (
              <ThemedText type="small" themeColor="textSecondary">
                {p.admin2}
              </ThemedText>
            ) : null}
          </View>
          <Icon name="chevron.right" size={14} />
        </Pressable>
      ))}
    </Card>
  );
}

function GoAlerts() {
  const { alerts, setAlerts, favorites } = useSettings();
  const [denied, setDenied] = useState(false);

  async function toggle(on: boolean) {
    if (on) {
      const ok = await requestAlertPermission();
      setDenied(!ok);
      if (!ok) return;
    }
    setAlerts({ ...alerts, enabled: on });
  }

  return (
    <Card style={{ gap: Spacing.two }}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <ThemedText type="smallBold">Favorable alerts</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Get a heads-up when conditions look favorable at your favorite spots.
          </ThemedText>
        </View>
        <Switch
          value={alerts.enabled}
          onValueChange={toggle}
          trackColor={{ true: C.accent, false: C.backgroundElement }}
          accessibilityLabel="Favorable alerts"
        />
      </View>
      {denied ? (
        <Pressable onPress={() => Linking.openSettings()}>
          <ThemedText type="small" themeColor="accent">
            Notifications are off for Saltcast. Tap to turn them on in Settings.
          </ThemedText>
        </Pressable>
      ) : null}
      {alerts.enabled ? (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            Alert me for:
          </ThemedText>
          <View style={styles.chips}>
            {Activities.map((a) => {
              const on = alerts.activities.includes(a.id);
              return (
                <Pressable
                  key={a.id}
                  onPress={() =>
                    setAlerts({
                      ...alerts,
                      activities: on ? alerts.activities.filter((x) => x !== a.id) : [...alerts.activities, a.id],
                    })
                  }
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  style={[styles.chip, on && styles.chipOn]}>
                  <ThemedText type="small" style={{ color: on ? C.background : C.text, fontWeight: 600 }}>
                    {a.name}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {!favorites.length
              ? 'Tap the star on a spot to add it to your favorites. Alerts are for favorites only.'
              : !alerts.activities.length
                ? 'Pick at least one activity.'
                : 'Alerts come at 6am on a favorable day, or the evening before for an early start. They use the latest forecast your phone has, so open the app now and then to keep them fresh.'}
          </ThemedText>
        </>
      ) : null}
    </Card>
  );
}

function UnitsPicker() {
  const { units, setUnits } = useSettings();
  const options: { value: Units; label: string }[] = [
    { value: 'imperial', label: 'ft, kt, °F' },
    { value: 'metric', label: 'm, km/h, °C' },
  ];
  return (
    <View style={styles.segment}>
      {options.map((o) => {
        const selected = o.value === units;
        return (
          <Pressable
            key={o.value}
            onPress={() => setUnits(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[styles.segmentItem, selected && styles.segmentSelected]}>
            <ThemedText type="smallBold" style={{ color: selected ? C.background : C.text }}>
              {o.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SpotsScreen() {
  const { favorites, customSpots, spotId, hidden, showSpot } = useSettings();
  const [editing, setEditing] = useState(false);
  const removed = Spots.filter((s) => hidden.includes(s.id));
  const allSpots = [...Spots, ...customSpots];
  const favoriteSpots = favorites.map((id) => allSpots.find((s) => s.id === id)).filter((s): s is Spot => !!s);
  const recent = customSpots.find((s) => s.id === spotId && !favorites.includes(s.id));

  return (
    <Screen>
      <Header
        title="Spots"
        subtitle="Pick a spot or search for any Florida beach or town"
        right={
          <Pressable
            onPress={() => setEditing(!editing)}
            hitSlop={10}
            accessibilityRole="button"
            style={styles.editButton}>
            <ThemedText type="smallBold" themeColor="accent">
              {editing ? 'Done' : 'Edit'}
            </ThemedText>
          </Pressable>
        }
      />

      {editing ? (
        <ThemedText type="small" themeColor="textSecondary">
          Tap the red button to remove a spot from your list. Searched places are deleted. Tap Done when you&apos;re
          finished.
        </ThemedText>
      ) : null}

      <PlaceSearch />

      {recent ? (
        <>
          <ThemedText type="smallBold">Searched place</ThemedText>
          <Card style={styles.list}>
            <SpotRow spot={recent} editing={editing} />
          </Card>
          <ThemedText type="small" themeColor="textSecondary">
            Tap the star to keep it. Otherwise it&apos;s replaced by your next search.
          </ThemedText>
        </>
      ) : null}

      {favoriteSpots.length ? (
        <>
          <ThemedText type="smallBold">Favorites</ThemedText>
          <Card style={styles.list}>
            {favoriteSpots.map((s) => (
              <SpotRow key={s.id} spot={s} editing={editing} />
            ))}
          </Card>
        </>
      ) : null}

      <GoAlerts />

      {Regions.map((region) => {
        const list = Spots.filter((s) => s.region === region && !hidden.includes(s.id));
        if (!list.length) return null;
        return (
          <View key={region} style={{ gap: Spacing.two }}>
            <ThemedText type="smallBold">{region}</ThemedText>
            <Card style={styles.list}>
              {list.map((s) => (
                <SpotRow key={s.id} spot={s} editing={editing} />
              ))}
            </Card>
          </View>
        );
      })}

      {removed.length ? (
        <>
          <ThemedText type="smallBold">Removed spots</ThemedText>
          <Card style={styles.list}>
            {removed.map((s) => (
              <Pressable
                key={s.id}
                style={styles.row}
                onPress={() => showSpot(s.id)}
                accessibilityRole="button"
                accessibilityLabel={`Add ${s.name} back`}>
                <ThemedText style={{ flex: 1 }} themeColor="textSecondary">
                  {s.name}
                </ThemedText>
                <Icon name="plus.circle.fill" size={22} color={C.go} />
              </Pressable>
            ))}
            {removed.length > 1 ? (
              <Pressable style={styles.row} onPress={() => showSpot()} accessibilityRole="button">
                <ThemedText type="smallBold" themeColor="accent">
                  Show all spots
                </ThemedText>
              </Pressable>
            ) : null}
          </Card>
        </>
      ) : null}

      <ThemedText type="smallBold">Units</ThemedText>
      <UnitsPicker />

      <ThemedText type="smallBold">About</ThemedText>
      <Card style={styles.list}>
        <Pressable style={styles.row} onPress={() => WebBrowser.openBrowserAsync('https://saltcastflorida.com')}>
          <ThemedText style={{ flex: 1 }}>saltcastflorida.com</ThemedText>
          <Icon name="chevron.right" size={14} />
        </Pressable>
        <Pressable
          style={styles.row}
          onPress={() => WebBrowser.openBrowserAsync('https://saltcastflorida.com/privacy')}>
          <ThemedText style={{ flex: 1 }}>Privacy policy</ThemedText>
          <Icon name="chevron.right" size={14} />
        </Pressable>
        <ThemedText type="small" themeColor="textSecondary">
          Weather and marine data by Open-Meteo.com (CC BY 4.0). Tide predictions from NOAA CO-OPS.
        </ThemedText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 0, paddingVertical: Spacing.one },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: 10,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: C.backgroundElement,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, color: C.text, fontSize: 16, paddingVertical: 10 },
  editButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: C.border },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipOn: { backgroundColor: C.accent, borderColor: C.accent },
  segment: {
    flexDirection: 'row',
    backgroundColor: C.backgroundElement,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  segmentSelected: { backgroundColor: C.accent },
});
