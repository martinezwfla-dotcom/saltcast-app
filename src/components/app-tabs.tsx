import { NativeTabs } from 'expo-router/native-tabs';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const colors = Colors.dark;

  return (
    <NativeTabs
      backgroundColor={colors.background}
      tintColor={colors.accent}
      indicatorColor={colors.backgroundSelected}
      labelStyle={{ selected: { color: colors.accent } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'sun.horizon', selected: 'sun.horizon.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="best-times">
        <NativeTabs.Trigger.Label>Best Times</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="clock" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="spots">
        <NativeTabs.Trigger.Label>Spots</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'mappin.and.ellipse', selected: 'mappin.and.ellipse' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="radar">
        <NativeTabs.Trigger.Label>Radar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="cloud.bolt.rain" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="dock-talk">
        <NativeTabs.Trigger.Label>Dock Talk</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
