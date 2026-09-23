/**
 * Home — E5.4.
 *
 * What you are practising and one button to practise it. Nothing else: no
 * XP, no shop, no mascot, no badge shelf, and no streak. The point of opening
 * the app is to do a few sentences, so the screen gets out of the way of that.
 *
 * A first-time learner is sent to the one-sentence introduction; everyone
 * else to a session, which resumes if one was left unfinished — and the
 * button says so, rather than dropping them on "Satz 3 von 10" unexplained.
 */
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import {
  loadProgress,
  loadSessionAttempts,
  loadUnfinishedSessionId,
} from '@/content/repository';
import { SESSION_LENGTH } from '@/content/selection';
import { useSettingsStore } from '@/store/settings';
import { display, explanation, gloss, heading, palette, space } from '@/theme';

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
  /** Sentences already answered in an unfinished session, or 0. */
  const [resumeAt, setResumeAt] = useState(0);

  const showGloss = useSettingsStore((s) => s.showGloss);
  const guideDone = useSettingsStore((s) => s.guideDone);
  const summary = TIER_SUMMARY[tier];

  // On focus, not on mount: Home stays mounted under the session, and coming
  // back from "Pause" must show the resume label straight away.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      void (async () => {
        const progress = await loadProgress();
        const unfinished = await loadUnfinishedSessionId(SESSION_LENGTH);
        const answered = unfinished
          ? (await loadSessionAttempts(unfinished)).length
          : 0;

        if (cancelled) return;
        setTier(progress?.tier ?? 1);
        setResumeAt(answered);
      })();

      return () => {
        cancelled = true;
      };
    }, []),
  );

  const start = () =>
    router.push(guideDone ? '/(game)/session' : '/(game)/intro');

  let label = 'Üben';
  let hint = 'Zehn Sätze, etwa zwölf Minuten.';
  if (!guideDone) {
    label = 'Los geht’s';
    hint = 'Ein Übungssatz zeigt dir, wie es geht.';
  } else if (resumeAt > 0) {
    label = `Weitermachen · Satz ${resumeAt + 1} von ${SESSION_LENGTH}`;
    hint = 'Du machst da weiter, wo du aufgehört hast.';
  }

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
        <Text style={styles.tierLabel}>Stufe {tier}</Text>
        <Text style={styles.tierName}>{TIER_NAME[tier] ?? ''}</Text>
        {summary ? (
          <>
            <Text style={styles.tierSummary}>{summary.de}</Text>
            {showGloss ? <Text style={styles.tierGloss}>{summary.en}</Text> : null}
          </>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Button label={label} onPress={start} />
        <Text style={styles.hint}>{hint}</Text>

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
    gap: space.xs,
  },
  tierLabel: gloss,
  tierName: heading,
  tierSummary: {
    ...explanation,
    marginTop: space.sm,
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
