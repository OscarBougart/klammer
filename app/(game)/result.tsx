/**
 * End of session — E4.3.
 *
 * design.md §7: finishing shows the five sentences you built, tappable to
 * review. No score shouted at you, no XP, no streak fireworks — the sentences
 * are the reward, and re-reading the one you got wrong is the useful thing to
 * do next. So the wrong ones come first, and the first of them is open.
 */
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { advanceTierIfEarned } from '@/content/repository';
import { explainRule } from '@/engine/rules';
import type { Verdict } from '@/engine/validate';
import {
  correctCount,
  useSessionStore,
  type SessionAttempt,
} from '@/store/session';
import { useSettingsStore } from '@/store/settings';
import Button from '@/components/Button';
import { border, makeStyles, radius, space } from '@/theme';

/** How each verdict reads in the list. Shape and word, never colour alone. */
/** List order: what needs another look first, then the rest as played. */
const RANK: Record<Verdict, number> = {
  falsch: 0,
  ungewoehnlich: 1,
  gueltig: 2,
  kanonisch: 2,
};

const MARK: Record<Verdict, string> = {
  kanonisch: '●',
  gueltig: '●',
  ungewoehnlich: '◐',
  falsch: '○',
};

export default function ResultScreen() {
  const styles = useStyles();
  const router = useRouter();

  const sentences = useSessionStore((s) => s.sentences);
  const attempts = useSessionStore((s) => s.attempts);
  const clear = useSessionStore((s) => s.clear);
  const showGloss = useSettingsStore((s) => s.showGloss);

  // Array.prototype.sort is stable, so ties keep the order they were played in.
  const ordered = useMemo(
    () => [...attempts].sort((a, b) => RANK[a.verdict] - RANK[b.verdict]),
    [attempts],
  );

  const firstWrong = ordered[0]?.verdict === 'falsch' ? ordered[0].sentenceId : null;
  const [expandedId, setExpandedId] = useState<string | null>(firstWrong);
  const [unlockedTier, setUnlockedTier] = useState<number | null>(null);

  // Tier advancement is decided once the session is in the books, not during
  // it — three sessions at 4/5 is a fact about finished sessions.
  useEffect(() => {
    void advanceTierIfEarned().then(setUnlockedTier);
  }, []);

  const byId = useMemo(
    () => new Map(sentences.map((s) => [s.id, s])),
    [sentences],
  );

  const correct = correctCount(attempts);

  const finish = () => {
    clear();
    // A new zone earns its own moment before the learner returns home.
    if (unlockedTier !== null) {
      router.replace(`/(game)/unlock?tier=${unlockedTier}`);
      return;
    }
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Fertig</Text>
        <Text style={styles.summary}>
          {correct} von {attempts.length} richtig
        </Text>
        <Text style={styles.tapHint}>
          Tippe einen Satz an, um die neutrale Form und die Regel zu sehen.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {ordered.map((attempt) => {
          const sentence = byId.get(attempt.sentenceId);
          if (!sentence) return null;

          const expanded = expandedId === attempt.sentenceId;

          return (
            <Pressable
              key={attempt.sentenceId}
              onPress={() =>
                setExpandedId(expanded ? null : attempt.sentenceId)
              }
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              accessibilityLabel={`${describe(attempt.verdict)}: ${render(sentence, attempt)}`}
              style={styles.row}
            >
              <View style={styles.rowHead}>
                <Text
                  style={[
                    styles.mark,
                    attempt.verdict === 'falsch' && styles.markWrong,
                    attempt.verdict === 'ungewoehnlich' && styles.markMarked,
                  ]}
                >
                  {MARK[attempt.verdict]}
                </Text>

                <View style={styles.rowText}>
                  <Text style={styles.built}>{render(sentence, attempt)}</Text>
                  {showGloss ? <Text style={styles.gloss}>{sentence.gloss}</Text> : null}
                </View>
              </View>

              {expanded ? (
                <View style={styles.detail}>
                  {/* The canonical order, so a wrong answer has something to
                      be read against rather than merely being marked wrong. */}
                  <Text style={styles.detailLabel}>Die neutrale Reihenfolge</Text>
                  <Text style={styles.built}>
                    {renderOrder(sentence, sentence.canonical)}
                  </Text>

                  <Text style={styles.detailLabel}>Regel</Text>
                  <Text style={styles.german}>
                    {explainRule(sentence.ruleId).de}
                  </Text>
                  {showGloss ? (
                    <Text style={styles.gloss}>{explainRule(sentence.ruleId).en}</Text>
                  ) : null}
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={unlockedTier !== null ? 'Neues Feld ansehen' : 'Zurück zum Start'}
          onPress={finish}
        />
      </View>
    </SafeAreaView>
  );
}

/** German, matching the rest of the app's spoken labels. */
function describe(verdict: Verdict): string {
  switch (verdict) {
    case 'kanonisch':
      return 'Richtig';
    case 'gueltig':
      return 'Auch richtig';
    case 'ungewoehnlich':
      return 'Möglich, aber ungewöhnlich';
    case 'falsch':
      return 'So nicht';
  }
}

/** The sentence as the learner built it. */
type Renderable = {
  matrix?: string;
  chunks: { id: string; surface: string; neutralSurface: string }[];
};

function render(sentence: Renderable, attempt: SessionAttempt): string {
  return renderOrder(sentence, attempt.submittedOrder);
}

/**
 * Renders an order in real surface forms — this is the review screen, so the
 * sentence should read as German rather than as neutral tray tokens. The
 * first word takes its capitalised form because it is sentence-initial.
 */
function renderOrder(sentence: Renderable, order: readonly string[]): string {
  const byId = new Map(sentence.chunks.map((c) => [c.id, c]));
  // A played subclause follows its lead-in: `Ich weiß nicht, ob …`. The
  // lead-in ends in an ellipsis on the board; here it joins the sentence.
  const leadIn = sentence.matrix?.replace(/\s*…\s*$/, '');

  const body = order
    .map((id, i) => {
      const chunk = byId.get(id);
      if (!chunk) return id;
      if (i === 0 && !leadIn) {
        const text = chunk.neutralSurface;
        return text.charAt(0).toUpperCase() + text.slice(1);
      }
      return chunk.neutralSurface;
    })
    .join(' ');

  return leadIn ? `${leadIn} ${body}` : body;
}

const useStyles = makeStyles(({ palette, type }) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: palette.schiefer,
    },
    header: {
      padding: space.lg,
      gap: space.xs,
    },
    title: type.heading,
    summary: type.explanation,
    tapHint: type.gloss,
    list: {
      paddingHorizontal: space.lg,
      paddingBottom: space.lg,
      gap: space.sm,
    },
    row: {
      backgroundColor: palette.feld,
      borderRadius: radius.field,
      padding: space.md,
      gap: space.sm,
    },
    rowHead: {
      flexDirection: 'row',
      gap: space.md,
      alignItems: 'flex-start',
    },
    mark: {
      ...type.explanation,
      color: palette.messing,
    },
    markMarked: {
      color: palette.grau,
    },
    markWrong: {
      color: palette.ziegel,
    },
    rowText: {
      flex: 1,
      gap: space.xs,
    },
    built: type.explanation,
    gloss: type.gloss,
    german: type.explanation,
    detail: {
      gap: space.xs,
      borderTopWidth: border.hairline,
      borderTopColor: palette.kante,
      paddingTop: space.sm,
    },
    detailLabel: type.fieldLabel,
    footer: {
      padding: space.lg,
    },
  }),
);
