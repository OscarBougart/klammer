/**
 * Home — E5.4.
 *
 * What the app is, where the learner stands, and one button to practise. A
 * sample sentence shows the board's look at a glance; the level path shows
 * the five Stufen and how to move up; the button is always at the bottom,
 * under the thumb. Still no XP, no shop, no mascot and no streak.
 *
 * A first-time learner is sent to the one-sentence introduction; everyone
 * else to a session at the selected Stufe, which resumes if one was left
 * unfinished there — and the button says so.
 */
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import GearIcon from '@/components/GearIcon';
import LevelPath from '@/components/LevelPath';
import SampleSentence from '@/components/SampleSentence';
import { loadTierProgress, loadUnfinishedSession } from '@/content/repository';
import { SESSION_LENGTH } from '@/content/selection';
import { HIGHEST_PLAYABLE_TIER } from '@/content/tiers';
import { useSessionStore } from '@/store/session';
import { useSettingsStore } from '@/store/settings';
import { makeStyles, space } from '@/theme';

type Unfinished = { answered: number; tier: number } | null;

export default function HomeScreen() {
  const styles = useStyles();
  const router = useRouter();

  const [tier, setTier] = useState(1);
  const [goodRounds, setGoodRounds] = useState(0);
  /** The Stufe the button plays. Follows the learner's Stufe until tapped. */
  const [picked, setPicked] = useState<number | null>(null);
  const [unfinished, setUnfinished] = useState<Unfinished>(null);

  const showGloss = useSettingsStore((s) => s.showGloss);
  const guideDone = useSettingsStore((s) => s.guideDone);

  // On focus, not on mount: Home stays mounted under the session, and coming
  // back from "Pause" or a finished session must show the new state.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      void (async () => {
        const progress = await loadTierProgress();
        const open = await loadUnfinishedSession(SESSION_LENGTH, progress.tier);
        if (cancelled) return;
        setTier(progress.tier);
        setGoodRounds(progress.goodRounds);
        setUnfinished(open ? { answered: open.answered, tier: open.tier } : null);
      })();

      return () => {
        cancelled = true;
      };
    }, []),
  );

  const selected = picked !== null && picked <= tier ? picked : tier;
  const isPractice = selected < tier;
  const resumeAt = unfinished && unfinished.tier === selected ? unfinished.answered : 0;

  const start = () => {
    if (!guideDone) {
      router.push('/(game)/intro');
      return;
    }
    // A session still in memory for another Stufe (paused mid-practice) must
    // not be continued under this one's button.
    const session = useSessionStore.getState();
    if (session.sessionId && session.tier !== selected) session.clear();
    router.push({ pathname: '/(game)/session', params: { tier: String(selected) } });
  };

  let label = 'Üben';
  let hint = 'Zehn Sätze, etwa zwölf Minuten.';
  if (!guideDone) {
    label = 'Los geht’s';
    hint = 'Ein Übungssatz zeigt dir, wie es geht.';
  } else if (resumeAt > 0) {
    label = `Weitermachen · Satz ${resumeAt + 1} von ${SESSION_LENGTH}`;
    hint = 'Du machst da weiter, wo du aufgehört hast.';
  } else if (isPractice) {
    label = `Stufe ${selected} wiederholen`;
    hint = 'Zum Üben. Zählt nicht für den Aufstieg.';
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title} accessibilityRole="header">
            Klammer
          </Text>
          <Text style={styles.subtitle}>Deutsche Wortstellung, Satz für Satz.</Text>
          {showGloss ? (
            <Text style={styles.subtitleGloss}>German word order, one sentence at a time.</Text>
          ) : null}
        </View>
        <GearIcon onPress={() => router.push('/settings')} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <SampleSentence tier={selected} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Deine Stufen</Text>
          <LevelPath
            current={tier}
            selected={selected}
            highestPlayable={HIGHEST_PLAYABLE_TIER}
            goodRounds={goodRounds}
            showGloss={showGloss}
            onSelect={setPicked}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label={label} onPress={start} />
        <Text style={styles.hint}>{hint}</Text>
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ palette, type }) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: palette.schiefer,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: space.lg,
      paddingTop: space.lg,
      paddingBottom: space.md,
      gap: space.md,
    },
    headerText: {
      flex: 1,
      gap: space.xs,
    },
    title: type.heading,
    subtitle: type.explanation,
    subtitleGloss: type.gloss,
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: space.lg,
      paddingBottom: space.lg,
      gap: space.xl,
    },
    section: {
      gap: space.sm,
    },
    sectionLabel: type.gloss,
    footer: {
      paddingHorizontal: space.lg,
      paddingTop: space.md,
      paddingBottom: space.md,
      gap: space.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: palette.kante,
    },
    hint: {
      ...type.gloss,
      textAlign: 'center',
    },
  }),
);
