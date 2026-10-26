import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Header, Icon, Screen } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { Regions, Spots, type Spot } from '@/data/spots';
import type { Units } from '@/lib/format';
import { useSettings } from '@/state/settings';

const C = Colors.dark;

function SpotRow({ spot }: { spot: Spot }) {
  const { spotId, favorites, setSpot, toggleFavorite } = useSettings();
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
            Tides from {spot.tideStation.name}
          </ThemedText>
        </View>
        {selected ? <Icon name="checkmark" size={16} /> : null}
      </Pressable>
      <Pressable
        onPress={() => toggleFavorite(spot.id)}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={favorite ? `Remove ${spot.name} from favorites` : `Add ${spot.name} to favorites`}>
        <Icon name={favorite ? 'star.fill' : 'star'} size={20} color={favorite ? C.maybe : C.textSecondary} />
      </Pressable>
    </View>
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
  const { favorites } = useSettings();
  const favoriteSpots = Spots.filter((s) => favorites.includes(s.id));

  return (
    <Screen>
      <Header title="Spots" subtitle="Pick a spot to see its forecast" />

      {favoriteSpots.length ? (
        <>
          <ThemedText type="smallBold">Favorites</ThemedText>
          <Card style={styles.list}>
            {favoriteSpots.map((s) => (
              <SpotRow key={s.id} spot={s} />
            ))}
          </Card>
        </>
      ) : null}

      {Regions.map((region) => (
        <View key={region} style={{ gap: Spacing.two }}>
          <ThemedText type="smallBold">{region}</ThemedText>
          <Card style={styles.list}>
            {Spots.filter((s) => s.region === region).map((s) => (
              <SpotRow key={s.id} spot={s} />
            ))}
          </Card>
        </View>
      ))}

      <ThemedText type="smallBold">Units</ThemedText>
      <UnitsPicker />

      <ThemedText type="smallBold">About</ThemedText>
      <Card style={styles.list}>
        <Pressable style={styles.row} onPress={() => WebBrowser.openBrowserAsync('https://saltcastflorida.com')}>
          <ThemedText style={{ flex: 1 }}>saltcastflorida.com</ThemedText>
          <Icon name="chevron.right" size={14} />
        </Pressable>
        <Pressable style={styles.row} onPress={() => WebBrowser.openBrowserAsync('https://saltcastflorida.com/privacy')}>
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
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  segment: {
    flexDirection: 'row',
    backgroundColor: C.backgroundElement,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9 },
  segmentSelected: { backgroundColor: C.accent },
});
