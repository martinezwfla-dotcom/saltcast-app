import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import type { Spot } from '@/data/spots';
import { useLightning, Watch } from '@/lib/lightning';

/**
 * Live lightning near the spot from NOAA's GOES satellite: red within 10 miles (get off the water),
 * yellow within 30 miles. Same banner as the website's spot outlook. Tapping it opens the radar.
 */
export function LightningBanner({ spot, onRadar }: { spot: Spot; onRadar: () => void }) {
  const h = useLightning(spot);
  if (!h) return null;
  const near = h.level === 'near';
  const d = Math.max(1, Math.round(h.miles));
  const mins = h.minutesAgo;
  const strikes = `${h.count} strike${h.count > 1 ? 's' : ''}`;
  const fg = near ? '#FFFFFF' : '#1A1200';
  return (
    <Pressable
      onPress={onRadar}
      style={({ pressed }) => [styles.box, { backgroundColor: near ? '#E0312B' : '#FFD23F' }, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityHint="Opens the radar">
      <Icon name="bolt.fill" size={22} color={fg} />
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText type="smallBold" style={{ color: fg }}>
          Lightning {d} mi from {spot.name}
        </ThemedText>
        <ThemedText type="small" style={{ color: fg }}>
          {near
            ? `${strikes} in the last 15 minutes, latest ${mins} min ago. Get off the water and find shelter.`
            : `${strikes} within ${Watch} miles in the last 15 minutes. Storms can move in fast, so watch the sky.`}{' '}
          <ThemedText type="smallBold" style={{ color: fg, textDecorationLine: 'underline' }}>
            See radar
          </ThemedText>
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two, padding: 12, borderRadius: 12 },
});
