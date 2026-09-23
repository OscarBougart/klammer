/**
 * Home — E5.4.
 *
 * Today's session, the streak, the current tier. Nothing else: no XP, no
 * shop, no mascot, no badge shelf. The button that starts a session is the
 * only thing here with any weight.
 */
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import WeekStrip from '@/board/WeekStrip';
import { localDate, previousDate } from '@/content/dates';
import {
  streakStatus,
  weekStrip,
  type StreakStatus,
  type WeekDay,
} from '@/content/progression';
import { loadPlayedDates, loadProgress } from '@/content/repository';
import { useSettingsStore } from '@/store/settings';
import {
  display,
  explanation,
  gloss,
  heading,
  palette,
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

/**
 * What the tier trains, in one line. The tier's name is the grammar's; this
 * is what it means for the learner about to press start.
 */
const TIER_SUMMARY: { de: string; en: string }[] = [
  { de: '', en: '' },
  { de: 'Das Verb steht an Position 2.', en: 'The verb goes in position 2.' },
  {
    de: 'Das Verb teilt sich: ein Teil vorn, der Rest am Ende.',
    en: 'The verb splits: one part early, the rest at the end.',
  },
  {
    de: 'Die Ordnung in der Mitte: Pronomen, Zeit, Grund, Art, Ort.',
    en: 'The order in the middle: pronouns, time, reason, manner, place.',
  },
  {
    de: 'Im Nebensatz steht das Verb am Ende.',
    en: 'In a subordinate clause the verb goes last.',
  },
  {
    de: 'Was hinter der Klammer stehen darf.',
    en: 'What may come after the bracket.',
  },
];

export default function HomeScreen() {
  const router = useRouter();

  const [tier, setTier] = useState(1);
  const [days, setDays] = useState<WeekDay[]>([]);
  const [streak, setStreak] = useState<StreakStatus | null>(null);

  const showGloss = useSettingsStore((s) => s.showGloss);
  const guideDone = useSettingsStore((s) => s.guideDone);
  const summary = TIER_SUMMARY[tier];

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
        {showGloss ? (
          <Text style={styles.subtitleGloss}>
            German word order, one sentence at a time.
          </Text>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.tier}>
          <Text style={styles.tierLabel}>Stufe {tier}</Text>
          <Text style={styles.tierName}>{TIER_NAME[tier] ?? ''}</Text>
          {summary ? (
            <>
              <Text style={styles.tierSummary}>{summary.de}</Text>
              {showGloss ? <Text style={styles.tierGloss}>{summary.en}</Text> : null}
            </>
          ) : null}
        </View>

        <WeekStrip
          days={days}
          {...(streak?.repairable
            ? { repairSessionsNeeded: streak.repairSessionsNeeded }
            : {})}
        />
      </View>

      <View style={styles.footer}>
        <Button
          // The very first session opens with a guided sentence; saying so
          // tells a new learner they will not be dropped in cold.
          label={guideDone ? 'Sitzung starten' : 'Los geht’s'}
          accessibilityLabel={
            guideDone ? 'Sitzung starten, zehn Sätze' : 'Los geht’s, mit Einführung'
          }
          onPress={() => router.push('/(game)/session')}
        />

        <Text style={styles.hint}>
          {guideDone
            ? 'Zehn Sätze, etwa zwölf Minuten.'
            : 'Der erste Satz zeigt dir Schritt für Schritt, wie es geht.'}
        </Text>

        <Button
          variant="secondary"
          label="Einstellungen"
          onPress={() => router.push('/settings')}
        />
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
  subtitle: explanation,
  subtitleGloss: gloss,
  body: {
    padding: space.lg,
    gap: space.xl,
  },
  tier: {
    gap: space.xs,
  },
  tierLabel: gloss,
  tierName: heading,
  tierSummary: {
    ...explanation,
    marginTop: space.xs,
  },
  tierGloss: gloss,
  footer: {
    padding: space.lg,
    gap: space.md,
  },
  hint: {
    ...gloss,
    textAlign: 'center',
  },
});
