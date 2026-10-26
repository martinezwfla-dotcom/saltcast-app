import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={refreshControl}
          contentInsetAdjustmentBehavior="automatic">
          {content}
        </ScrollView>
      ) : (
        content
      )}
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

export function Disclaimer() {
  return (
    <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
      Verdicts are rules of thumb, not official guidance. Always check the National Weather Service marine forecast
      and use your own judgment on the water.
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
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
  pillLarge: { paddingHorizontal: 20, paddingVertical: 6 },
  pillText: { color: C.background, fontWeight: 700, fontSize: 13, lineHeight: 18 },
  pillTextLarge: { fontSize: 28, lineHeight: 34 },
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
  disclaimer: { textAlign: 'center', paddingHorizontal: Spacing.two },
});
