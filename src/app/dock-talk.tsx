import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ActivityPicker, Card, Disclaimer, Header, Icon, Screen, WebsiteButton } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getActivity } from '@/data/activities';
import { currentMonth } from '@/data/monthly';
import { useSettings } from '@/state/settings';

export default function DockTalkScreen() {
  const { activityId, setActivity } = useSettings();
  const activity = getActivity(activityId);
  const month = currentMonth();

  return (
    <Screen>
      <Header title="Dock Talk" subtitle="Local know-how for Florida waters" />
      <WebsiteButton />
      <ActivityPicker value={activityId} onChange={setActivity} />

      <Card>
        <ThemedText style={styles.title}>Big picture · {month.name}</ThemedText>
        <ThemedText themeColor="textSecondary">{month.tips.general}</ThemedText>
      </Card>

      <Card>
        <View style={styles.titleRow}>
          <Icon name={activity.icon} />
          <ThemedText style={styles.title}>
            {activity.name} in {month.name}
          </ThemedText>
        </View>
        <ThemedText themeColor="textSecondary">{month.tips[activity.id]}</ThemedText>
      </Card>

      <Card>
        <View style={styles.titleRow}>
          <Icon name={activity.icon} />
          <ThemedText style={styles.title}>{activity.name} tips, all year</ThemedText>
        </View>
        {activity.tips.map((tip) => (
          <View key={tip} style={styles.tip}>
            <ThemedText themeColor="accent">•</ThemedText>
            <ThemedText style={{ flex: 1 }}>{tip}</ThemedText>
          </View>
        ))}
      </Card>

      <Disclaimer />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { fontSize: 17, lineHeight: 22, fontWeight: 700 },
  tip: { flexDirection: 'row', gap: Spacing.two },
});
