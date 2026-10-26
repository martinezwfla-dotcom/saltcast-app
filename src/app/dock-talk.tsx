import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ActivityPicker, Card, Disclaimer, Header, Icon, Screen, WebsiteButton } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getActivity, SeasonalOutlook } from '@/data/activities';
import { useSettings } from '@/state/settings';

/** Index into SeasonalOutlook for the current month. */
function currentSeason(month = new Date().getMonth()) {
  if (month >= 8 && month <= 10) return 0;
  if (month === 11 || month <= 1) return 1;
  if (month <= 4) return 2;
  return 3;
}

export default function DockTalkScreen() {
  const { activityId, setActivity } = useSettings();
  const activity = getActivity(activityId);
  const season = currentSeason();

  return (
    <Screen>
      <Header title="Dock Talk" subtitle="Local know-how for Florida waters" />
      <WebsiteButton />
      <ActivityPicker value={activityId} onChange={setActivity} />

      <Card>
        <View style={styles.titleRow}>
          <Icon name={activity.icon} />
          <ThemedText style={styles.title}>{activity.name} tips</ThemedText>
        </View>
        {activity.tips.map((tip) => (
          <View key={tip} style={styles.tip}>
            <ThemedText themeColor="accent">•</ThemedText>
            <ThemedText style={{ flex: 1 }}>{tip}</ThemedText>
          </View>
        ))}
      </Card>

      <ThemedText type="smallBold">The big picture</ThemedText>
      {SeasonalOutlook.map((s, i) => (
        <Card key={s.season}>
          <ThemedText style={styles.title}>
            {s.season}
            {i === season ? '  (now)' : ''}
          </ThemedText>
          <ThemedText themeColor="textSecondary">{s.text}</ThemedText>
        </Card>
      ))}

      <Disclaimer />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { fontSize: 17, lineHeight: 22, fontWeight: 700 },
  tip: { flexDirection: 'row', gap: Spacing.two },
});
