/**
 * Saltcast colors. The app always uses its dark teal look, matching saltcastflorida.com,
 * so the light and dark palettes are the same.
 */

import { Platform } from 'react-native';

const Brand = {
  text: '#EAF4F4',
  background: '#0E2A33',
  backgroundElement: '#153B47',
  backgroundSelected: '#1F4F5E',
  textSecondary: '#9BB8BE',
  accent: '#3FC1C9',
  go: '#3DDC84',
  maybe: '#F5B841',
  noGo: '#F0605D',
  border: '#24505E',
} as const;

export const Colors = {
  light: Brand,
  dark: Brand,
} as const;

export type ThemeColor = keyof typeof Brand;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
