/**
 * Home — E5.4.
 *
 * Today's session, the streak, the current tier. Nothing else: no XP, no
 * shop, no mascot, no badge shelf. The button that starts a session is the
 * only thing here with any weight.
 */
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import WeekStrip from '@/board/WeekStrip';
import { localDate, previousDate } from '@/content/dates';
import {
  streakStatus,
  weekStrip,
  type StreakStatus,
  type WeekDay,
} from '@/content/progression';
import { loadPlayedDates, loadProgress } from '@/content/repository';
import {
  a11y,
  display,
  explanation,
  gloss,
  heading,
  palette,
  radius,
  space,
} from '@/theme';

/** What each tier is called on the board — design.md §2. */
const TIER_NAME = [
  '',
  'Position zwei',
  'Die Klammer',
  'Das Mittelfeld',
  'Der Nebensatz',
  'Das Nachfeld',
];

export default function HomeScreen() {
  const router = useRouter();

  const [tier, setTier] = useState(1);
  const [days, setDays] = useState<WeekDay[]>([]);
  const [streak, setStreak] = useState<StreakStatus | null>(null);

  const refresh = useCallback(async () => {
    const now = new Date();
    const today = localDate(now);

    const [progress, played] = await Promise.all([
      loadProgress(),
      loadPlayedDates(),
    ]);

    setTier(progress?.tier ?? 1);
    setDays(weekStrip(played, today, now));

    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);

    setStreak(
      streakStatus({
        streakDays: progress?.streakDays ?? 0,
        lastSessionDate: progress?.lastSessionDate ?? null,
        sessionsToday: progress?.sessionsToday ?? 0,
        today,
        yesterday: previousDate(now),
        dayBeforeYesterday: previousDate(yesterdayDate),
      }),
    );
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Klammer</Text>
        <Text style={styles.subtitle}>Deutsche Wortstellung, Satz für Satz.</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.tier}>
          <Text style={styles.tierLabel}>Stufe {tier}</Text>
          <Text style={styles.tierName}>{TIER_NAME[tier] ?? ''}</Text>
        </View>

        <WeekStrip
          days={days}
          {...(streak?.repairable
            ? { repairSessionsNeeded: streak.repairSessionsNeeded }
            : {})}
        />
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={() => router.push('/(game)/session')}
          accessibilityRole="button"
          accessibilityLabel="Sitzung starten, zehn Sätze"
          style={styles.action}
        >
          <Text style={styles.actionLabel}>Sitzung starten</Text>
        </Pressable>

        <Text style={styles.hint}>Zehn Sätze, etwa zwölf Minuten.</Text>

        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Einstellungen"
          style={styles.secondary}
        >
          <Text style={styles.secondaryLabel}>Einstellungen</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.schiefer,
    justifyContent: 'space-between',
  },
  header: {
    padding: space.lg,
    gap: space.xs,
  },
  title: display,
  subtitle: gloss,
  body: {
    padding: space.lg,
    gap: space.xl,
  },
  tier: {
    gap: space.xs,
  },
  tierLabel: gloss,
  tierName: heading,
  footer: {
    padding: space.lg,
    gap: space.sm,
  },
  action: {
    backgroundColor: palette.messing,
    borderRadius: radius.tile,
    minHeight: a11y.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    ...explanation,
    color: palette.schiefer,
  },
  hint: gloss,
  secondary: {
    minHeight: a11y.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: gloss,
});
