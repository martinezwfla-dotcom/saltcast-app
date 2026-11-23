import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import * as WebBrowser from 'expo-web-browser';
import { type ReactNode, useRef, useState } from 'react';
import { Pressable, ScrollView, type ScrollViewInstance, StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { Activities, type ActivityId } from '@/data/activities';
import { VerdictLabel, type Verdict } from '@/lib/verdict';

const C = Colors.dark;

export const VerdictColor: Record<Verdict, string> = { go: C.go, maybe: C.maybe, nogo: C.noGo };

export function Screen({
  children,
  scroll = true,
  refreshControl,
}: {
  children: ReactNode;
  scroll?: boolean;
  refreshControl?: React.ComponentProps<typeof ScrollView>['refreshControl'];
}) {
  const content = <View style={styles.content}>{children}</View>;
  const ref = useRef<ScrollViewInstance>(null);
  const [showTop, setShowTop] = useState(false);
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      {scroll ? (
        <ScrollView
          ref={ref}
          contentContainerStyle={styles.scroll}
          refreshControl={refreshControl}
          contentInsetAdjustmentBehavior="automatic"
          scrollEventThrottle={100}
          onScroll={(e) => {
            // Same as the website: the Top button shows after scrolling about a screen down.
            const down = e.nativeEvent.contentOffset.y > 700;
            if (down !== showTop) setShowTop(down);
          }}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
      {scroll && showTop ? (
        <Pressable
          onPress={() => ref.current?.scrollTo({ y: 0, animated: true })}
          style={({ pressed }) => [styles.toTop, { bottom: insets.bottom + BottomTabInset + Spacing.three }, pressed && { opacity: 0.7 }]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back to top">
          <Icon name="arrow.up" size={16} color={C.background} />
          <ThemedText type="smallBold" style={{ color: C.background }}>
            Top
          </ThemedText>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

export function Card({ style, ...rest }: ViewProps) {
  return <View style={[styles.card, style]} {...rest} />;
}

export function Icon({ name, size = 20, color = C.accent }: { name: SymbolViewProps['name']; size?: number; color?: string }) {
  return <SymbolView name={name} size={size} tintColor={color} />;
}

export function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <ThemedText style={styles.headerTitle}>{title}</ThemedText>
        {subtitle ? <ThemedText themeColor="textSecondary">{subtitle}</ThemedText> : null}
      </View>
      {right}
    </View>
  );
}

export function VerdictPill({ verdict, large }: { verdict: Verdict; large?: boolean }) {
  return (
    <View style={[styles.pill, large && styles.pillLarge, { backgroundColor: VerdictColor[verdict] }]}>
      <ThemedText style={[styles.pillText, large && styles.pillTextLarge]}>{VerdictLabel[verdict]}</ThemedText>
    </View>
  );
}

export function ActivityPicker({ value, onChange }: { value: ActivityId; onChange: (id: ActivityId) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {Activities.map((a) => {
        const selected = a.id === value;
        return (
          <Pressable
            key={a.id}
            onPress={() => onChange(a.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[styles.chip, selected && styles.chipSelected]}>
            <Icon name={a.icon} size={16} color={selected ? C.background : C.accent} />
            <ThemedText type="smallBold" style={{ color: selected ? C.background : C.text }}>
              {a.name}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** ?app=1 tells the website it was opened from the app (its Alerts button then points back to the app's own switch). */
export const WebsiteUrl = 'https://saltcastflorida.com/?app=1';

export function openWebsite() {
  WebBrowser.openBrowserAsync(WebsiteUrl);
}

/** A full-width button that opens saltcastflorida.com. */
export function WebsiteButton() {
  return (
    <Pressable
      onPress={openWebsite}
      accessibilityRole="link"
      accessibilityLabel="Visit saltcastflorida.com"
      style={({ pressed }) => [styles.website, pressed && { opacity: 0.8 }]}>
      <Icon name="globe" size={20} color={C.background} />
      <View style={{ flex: 1 }}>
        <ThemedText type="smallBold" style={{ color: C.background }}>
          Visit saltcastflorida.com
        </ThemedText>
        <ThemedText type="small" style={{ color: C.background, opacity: 0.8 }}>
          Full outlook, radar, and more
        </ThemedText>
      </View>
      <Icon name="arrow.up.right" size={16} color={C.background} />
    </Pressable>
  );
}

export function Disclaimer() {
  return (
    <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
      Ratings are general guidance, not an official forecast. Florida weather changes fast. Check the National
      Weather Service marine forecast, follow small craft advisories and other alerts, and use your own judgment.
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  toTop: {
    position: 'absolute',
    right: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: C.accent,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  scroll: { paddingBottom: BottomTabInset + Spacing.four },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  card: {
    backgroundColor: C.backgroundElement,
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: Spacing.three, gap: Spacing.two },
  headerTitle: { fontSize: 30, lineHeight: 36, fontWeight: 700 },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2, alignSelf: 'flex-start' },
  pillLarge: { paddingHorizontal: 14, paddingVertical: 4, alignSelf: 'center' },
  pillText: { color: C.background, fontWeight: 700, fontSize: 13, lineHeight: 18 },
  pillTextLarge: { fontSize: 16, lineHeight: 22 },
  chips: { gap: Spacing.two, paddingVertical: Spacing.one },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: C.backgroundElement,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  chipSelected: { backgroundColor: C.accent, borderColor: C.accent },
  website: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: C.accent,
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  disclaimer: { textAlign: 'center', paddingHorizontal: Spacing.two },
});
