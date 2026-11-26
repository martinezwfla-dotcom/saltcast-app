import { ThemedText } from '@/components/themed-text';
import { VerdictColor } from '@/components/ui';
import type { TrendStep } from '@/lib/daily';
import { clock } from '@/lib/format';
import { VerdictLabel } from '@/lib/verdict';

/** "Favorable now, Not ideal by 12p, No Go by 3p", each part in its rating color. */
export function TrendText({ steps, utcOffset, afterPill }: { steps: TrendStep[]; utcOffset: number; afterPill?: boolean }) {
  const [first, ...rest] = steps;
  const when = first.now ? 'now' : `from ${clock(first.time, utcOffset)}`;
  return (
    <ThemedText type="small" style={{ flexShrink: 1 }}>
      {afterPill ? (
        <ThemedText type="small" themeColor="textSecondary">
          {when}
        </ThemedText>
      ) : (
        <ThemedText type="smallBold" style={{ color: VerdictColor[first.verdict] }}>
          {VerdictLabel[first.verdict]} {when}
        </ThemedText>
      )}
      {rest.map((z) => (
        <ThemedText key={z.time} type="smallBold" style={{ color: VerdictColor[z.verdict] }}>
          <ThemedText type="small" themeColor="textSecondary">
            ,{' '}
          </ThemedText>
          {VerdictLabel[z.verdict]} by {clock(z.time, utcOffset)}
        </ThemedText>
      ))}
    </ThemedText>
  );
}
