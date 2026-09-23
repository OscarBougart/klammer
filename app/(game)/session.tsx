/**
 * The session — ten sentences, one board — E4.1 / E4.2 / E4.4 / E4.6.
 *
 * design.md §7: ten sentences, fixed, and no timer during a puzzle. The
 * progress indicator says how far through you are and nothing about how fast.
 *
 * After a wrong answer the learner may try again. Only the first attempt is
 * recorded (score, tier progress, review queue); the retry exists because
 * fixing it yourself is the most useful moment in the whole loop.
 */
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import Board from '@/board/Board';
import { DragProvider } from '@/board/dragContext';
import { boardFields, isVerbFinal, type FieldId, type Tier } from '@/board/fields';
import { guideLine } from '@/board/guide';
import VerdictPanel from '@/board/VerdictPanel';
import { localDate, previousDate } from '@/content/dates';
import {
  completeSession,
  loadProgress,
  loadReviewQueue,
  loadSeenIds,
  loadSentences,
  loadSessionAttempts,
  loadUnfinishedSessionId,
  recordAttempt,
} from '@/content/repository';
import { seed } from '@/content/seed';
import { selectSession, SESSION_LENGTH } from '@/content/selection';
import { diagnoseRule } from '@/engine/diagnose';
import { explainAlternative, explainRule, type Explanation } from '@/engine/rules';
import {
  findSingleTileCorrection,
  isCorrect,
  validate,
  type Verdict,
} from '@/engine/validate';
import { isComplete, useBoardStore } from '@/store/board';
import { useSettingsStore } from '@/store/settings';
import {
  currentSentence,
  isSessionComplete,
  newSessionId,
  useSessionStore,
} from '@/store/session';
import {
  a11y,
  explanation,
  fieldLabel,
  gloss,
  numeral,
  palette,
  space,
} from '@/theme';

/** Fisher–Yates. The tray must not hand the answer over in order. */
function shuffle<T>(values: readonly T[]): T[] {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = out[i];
    const b = out[j];
    if (a !== undefined && b !== undefined) {
      out[i] = b;
      out[j] = a;
    }
  }
  return out;
}

type Result = {
  verdict: Verdict;
  message: Explanation;
  emphasis?: string;
  correctionTileId?: string;
  /** The order one move away — E3.5. */
  correctedOrder?: string[];
};

export default function SessionScreen() {
  const router = useRouter();

  const sessionId = useSessionStore((s) => s.sessionId);
  const sentences = useSessionStore((s) => s.sentences);
  const index = useSessionStore((s) => s.index);
  const startSession = useSessionStore((s) => s.start);
  const resumeSession = useSessionStore((s) => s.resume);
  const record = useSessionStore((s) => s.record);
  const advance = useSessionStore((s) => s.advance);

  const loadBoard = useBoardStore((s) => s.load);
  const tray = useBoardStore((s) => s.tray);
  const fields = useBoardStore((s) => s.fields);
  const selectedTileId = useBoardStore((s) => s.selectedTileId);

  const showGloss = useSettingsStore((s) => s.showGloss);

  const [result, setResult] = useState<Result | null>(null);
  const [shakeNonce, setShakeNonce] = useState(0);
  const [starting, setStarting] = useState(true);
  /** How many times this sentence has been checked. Only the first counts. */
  const [checks, setChecks] = useState(0);

  // ─── Start or resume ────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionId) {
      setStarting(false);
      return;
    }

    let cancelled = false;

    const begin = async () => {
      // An interrupted session resumes with the same ten sentences rather
      // than dealing a fresh set — design.md's session is a unit of work, and
      // restarting it would punish closing the app.
      const unfinished = await loadUnfinishedSessionId(SESSION_LENGTH);

      if (unfinished) {
        const attempts = await loadSessionAttempts(unfinished);
        const played = await loadSentences(attempts.map((a) => a.sentenceId));

        // The rest of the session is re-selected around what was answered.
        const [progress, reviews, seen] = await Promise.all([
          loadProgress(),
          loadReviewQueue(),
          loadSeenIds(),
        ]);

        const answered = new Set(attempts.map((a) => a.sentenceId));
        const remainder = selectSession({
          sentences: seed.sentences.filter((s) => !answered.has(s.id)),
          tier: progress?.tier ?? 1,
          reviews,
          seen,
          now: Math.floor(Date.now() / 1000),
          shuffle,
        }).slice(0, SESSION_LENGTH - attempts.length);

        if (cancelled) return;
        resumeSession(unfinished, [...played, ...remainder], attempts);
        setStarting(false);
        return;
      }

      const [progress, reviews, seen] = await Promise.all([
        loadProgress(),
        loadReviewQueue(),
        loadSeenIds(),
      ]);

      const chosen = selectSession({
        sentences: seed.sentences,
        tier: progress?.tier ?? 1,
        reviews,
        seen,
        now: Math.floor(Date.now() / 1000),
        shuffle,
      });

      if (cancelled) return;
      startSession(newSessionId(), chosen);
      setStarting(false);
    };

    void begin();
    return () => {
      cancelled = true;
    };
  }, [sessionId, startSession, resumeSession]);

  const sentence = currentSentence({ sentences, index });

  const tiles = useMemo(
    () =>
      (sentence?.chunks ?? []).map((c) => ({
        id: c.id,
        neutralSurface: c.neutralSurface,
        role: c.role,
      })),
    [sentence],
  );

  // ─── Deal the current sentence ──────────────────────────────────────────
  useEffect(() => {
    if (tiles.length === 0) return;
    loadBoard(tiles, shuffle(tiles.map((t) => t.id)));
    setResult(null);
    setChecks(0);
  }, [tiles, loadBoard]);

  // ─── Finish ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (starting) return;
    if (!isSessionComplete({ sentences, index })) return;
    if (!sessionId) return;

    const now = new Date();
    void completeSession({
      sessionId,
      today: localDate(now),
      yesterday: previousDate(now),
    }).then(() => router.replace('/(game)/result'));
  }, [starting, sentences, index, sessionId, router]);

  const fieldOrder = useMemo<FieldId[]>(() => {
    if (!sentence) return [];
    const shape = { verbFinal: isVerbFinal(tiles.map((t) => t.role)) };
    return boardFields(sentence.tier as Tier, shape).map((f) => f.id);
  }, [sentence, tiles]);

  const check = useCallback(() => {
    if (!sentence || !sessionId) return;

    const order = useBoardStore.getState().submittedOrder(fieldOrder);
    const verdict = validate(order, sentence);

    // Only the first answer to a sentence counts. A retry is for learning,
    // and letting it overwrite the first result would turn every wrong
    // answer into a free second chance at the score.
    if (checks === 0) {
      record({ sentenceId: sentence.id, submittedOrder: order, verdict });
      void recordAttempt({
        sessionId,
        sentenceId: sentence.id,
        submittedOrder: order,
        verdict,
        now: Math.floor(Date.now() / 1000),
      });
    }
    setChecks((n) => n + 1);

    if (verdict === 'falsch') {
      const correction = findSingleTileCorrection(order, sentence);
      // Name the rule the learner actually broke, not merely the one this
      // sentence was written to practise.
      const rule = diagnoseRule({
        fields: useBoardStore.getState().fields,
        fieldOrder,
        tiles,
        sentenceRuleId: sentence.ruleId,
      });
      setResult({
        verdict,
        message: explainRule(rule),
        ...(correction
          ? {
              correctionTileId: correction.tileId,
              correctedOrder: correction.resultingOrder,
            }
          : {}),
      });
      // When no single move fixes it, the rule text stands alone and nothing
      // shakes — a board-wide shake would only say "everything is wrong".
      if (correction) setShakeNonce((n) => n + 1);
      return;
    }

    if (verdict === 'kanonisch') {
      setResult({
        verdict,
        message: { de: 'Genau so sagt man das.', en: 'That is how you say it.' },
      });
      return;
    }

    const fronted = tiles.find((t) => t.id === order[0]);
    const note = explainAlternative(
      fronted?.neutralSurface ?? '',
      fronted?.role ?? '',
      verdict === 'ungewoehnlich',
    );

    setResult({
      verdict,
      message: { de: note.de, en: note.en },
      ...(note.emphasis ? { emphasis: note.emphasis } : {}),
    });
  }, [sentence, sessionId, fieldOrder, tiles, record, checks]);

  if (starting || !sentence) {
    return (
      <SafeAreaView style={styles.empty}>
        <Text style={styles.emptyText}>Wird vorbereitet …</Text>
      </SafeAreaView>
    );
  }

  const ready = isComplete({ tray });
  const closed = result !== null && isCorrect(result.verdict);
  const wrong = result?.verdict === 'falsch';

  /**
   * Shows the fix by making it — one tile travels, the rest reflow around it.
   * design.md §5 asks for the delta, not a new sentence appearing, which is
   * why this moves the board the learner built rather than replacing it.
   */
  const showCorrection = () => {
    if (!result?.correctedOrder) return;
    useBoardStore.getState().applyOrder(fieldOrder, result.correctedOrder);

    // Drop the corrected order so the button does not offer to show a fix
    // that has already been made.
    const { correctedOrder: _shown, ...rest } = result;
    setResult(rest);
  };

  /** Back to the board as the learner left it, to fix it themselves. */
  const tryAgain = () => setResult(null);

  const next = advance;

  const leftBracket = fields.linkeKlammer ?? [];
  const verbInPlace = tiles.some(
    (t) => t.role === 'FIN' && leftBracket.includes(t.id),
  );

  // The guided steps live in the introduction (intro.tsx). A session keeps
  // only the two hints worth repeating.
  const hint = guideLine({
    guided: false,
    trayCount: tray.length,
    placedCount: tiles.length - tray.length,
    hasSelection: selectedTileId !== null,
    verbInPlace,
    frontFilled: (fields.vorfeld ?? []).length > 0,
    verdict: result?.verdict ?? null,
    isRetry: result !== null && checks > 1,
  });

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {/* Progress, never a timer — timing pressure degrades the exact
              processing this app trains. */}
          <Text
            style={styles.progress}
            accessibilityLabel={`Satz ${index + 1} von ${sentences.length}`}
          >
            Satz {index + 1} von {sentences.length}
          </Text>

          {/* The session resumes where it stopped, so leaving is safe. */}
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Pause, später weitermachen"
            hitSlop={space.sm}
            style={styles.pause}
          >
            <Text style={styles.pauseLabel}>Pause</Text>
          </Pressable>
        </View>

        {showGloss ? <Text style={styles.gloss}>{sentence.gloss}</Text> : null}
      </View>

      <DragProvider>
        <Board
          tier={sentence.tier as Tier}
          {...(sentence.matrix ? { matrix: sentence.matrix } : {})}
          {...(result?.correctionTileId
            ? { shakeTileId: result.correctionTileId, shakeNonce }
            : {})}
          closed={closed}
          dimmed={result?.verdict === 'ungewoehnlich'}
          showVerbAnchor={!wrong}
          revealKey={result ? `${checks}-${result.verdict}` : 'none'}
        >
          {/* Inside the board's scroll area, so text can never cover tiles. */}
          {result ? (
            <VerdictPanel
              verdict={result.verdict}
              message={result.message}
              {...(result.emphasis ? { emphasis: result.emphasis } : {})}
            />
          ) : null}

          {hint ? (
            <View
              style={styles.hint}
              accessibilityLiveRegion="polite"
              accessible
              accessibilityLabel={hint.de}
            >
              <Text style={styles.hintText}>{hint.de}</Text>
              {showGloss ? <Text style={styles.hintGloss}>{hint.en}</Text> : null}
            </View>
          ) : null}
        </Board>
      </DragProvider>

      <View style={styles.footer}>

        {wrong ? (
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Button
                variant="secondary"
                label="Nochmal"
                accessibilityLabel="Nochmal versuchen"
                onPress={tryAgain}
              />
            </View>
            {result.correctedOrder ? (
              <View style={styles.rowItem}>
                <Button
                  variant="secondary"
                  label="Lösung zeigen"
                  onPress={showCorrection}
                />
              </View>
            ) : null}
          </View>
        ) : null}

        {result ? (
          <Button label="Weiter" onPress={next} />
        ) : (
          <Button
            label="Prüfen"
            onPress={check}
            disabled={!ready}
            {...(ready
              ? {}
              : { accessibilityHint: 'Erst alle Bausteine setzen.' })}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.schiefer,
  },
  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    gap: space.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: a11y.minTouchTarget,
  },
  progress: numeral,
  pause: {
    minHeight: a11y.minTouchTarget,
    minWidth: a11y.minTouchTarget,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pauseLabel: gloss,
  gloss,
  footer: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    gap: space.sm,
  },
  hint: {
    gap: space.xs,
    paddingHorizontal: space.lg,
  },
  hintText: fieldLabel,
  hintGloss: fieldLabel,
  row: {
    flexDirection: 'row',
    gap: space.md,
  },
  rowItem: {
    flex: 1,
  },
  empty: {
    flex: 1,
    backgroundColor: palette.schiefer,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  emptyText: explanation,
});
