/**
 * The introduction: one practice sentence, guided, and not scored.
 *
 * A new learner should not meet the board inside a ten-sentence session with
 * a counter reading "Satz 1 von 10". This is a single easy tier-1 sentence
 * with a line under the board saying what to do next (see guide.ts). Nothing
 * is recorded: no attempt, no review entry, no streak day. Finishing — or
 * skipping — marks the introduction done and goes straight into practice.
 */
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import Board from '@/board/Board';
import { DragProvider } from '@/board/dragContext';
import { boardFields, type FieldId } from '@/board/fields';
import { guideLine } from '@/board/guide';
import VerdictPanel from '@/board/VerdictPanel';
import { seed } from '@/content/seed';
import { diagnoseRule } from '@/engine/diagnose';
import { explainAlternative, explainRule, type Explanation } from '@/engine/rules';
import { findSingleTileCorrection, isCorrect, validate, type Verdict } from '@/engine/validate';
import { isComplete, useBoardStore } from '@/store/board';
import { useSettingsStore } from '@/store/settings';
import { a11y, explanation, fieldLabel, gloss, numeral, palette, space } from '@/theme';

/**
 * Four tiles, a pronoun subject, a time word and a bare object: every
 * arrangement a beginner is likely to try is either right or one move away.
 */
const INTRO_SENTENCE_ID = 't1-01';

/** The tray must not hand over the answer in order, even here. */
function shuffled<T>(values: readonly T[]): T[] {
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
  correctedOrder?: string[];
};

export default function IntroScreen() {
  const router = useRouter();

  const sentence = useMemo(
    () =>
      seed.sentences.find((s) => s.id === INTRO_SENTENCE_ID) ??
      seed.sentences.find((s) => s.tier === 1),
    [],
  );

  const loadBoard = useBoardStore((s) => s.load);
  const tray = useBoardStore((s) => s.tray);
  const fields = useBoardStore((s) => s.fields);
  const selectedTileId = useBoardStore((s) => s.selectedTileId);

  const showGloss = useSettingsStore((s) => s.showGloss);
  const setSetting = useSettingsStore((s) => s.set);

  const [result, setResult] = useState<Result | null>(null);

  const tiles = useMemo(
    () =>
      (sentence?.chunks ?? []).map((c) => ({
        id: c.id,
        neutralSurface: c.neutralSurface,
        role: c.role,
      })),
    [sentence],
  );

  useEffect(() => {
    if (tiles.length === 0) return;
    loadBoard(tiles, shuffled(tiles.map((t) => t.id)));
  }, [tiles, loadBoard]);

  const fieldOrder = useMemo<FieldId[]>(
    () => boardFields(1).map((f) => f.id),
    [],
  );

  const check = useCallback(() => {
    if (!sentence) return;
    const order = useBoardStore.getState().submittedOrder(fieldOrder);
    const verdict = validate(order, sentence);

    if (verdict === 'falsch') {
      const correction = findSingleTileCorrection(order, sentence);
      const rule = diagnoseRule({
        fields: useBoardStore.getState().fields,
        fieldOrder,
        tiles,
        sentenceRuleId: sentence.ruleId,
      });
      setResult({
        verdict,
        message: explainRule(rule),
        ...(correction ? { correctedOrder: correction.resultingOrder } : {}),
      });
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
  }, [sentence, fieldOrder, tiles]);

  /** Done either way — finished or skipped — and straight on to practice. */
  const finish = () => {
    setSetting('guideDone', true);
    router.replace('/(game)/session');
  };

  if (!sentence) return null;

  const ready = isComplete({ tray });
  const wrong = result?.verdict === 'falsch';
  const leftBracket = fields.linkeKlammer ?? [];

  const hint = guideLine({
    guided: true,
    trayCount: tray.length,
    placedCount: tiles.length - tray.length,
    hasSelection: selectedTileId !== null,
    verbInPlace: tiles.some((t) => t.role === 'FIN' && leftBracket.includes(t.id)),
    verdict: result?.verdict ?? null,
    isRetry: false,
  });

  const showCorrection = () => {
    if (!result?.correctedOrder) return;
    useBoardStore.getState().applyOrder(fieldOrder, result.correctedOrder);
    const { correctedOrder: _shown, ...rest } = result;
    setResult(rest);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Übungssatz</Text>
          <Pressable
            onPress={finish}
            accessibilityRole="button"
            accessibilityLabel="Einführung überspringen"
            hitSlop={space.sm}
            style={styles.skip}
          >
            <Text style={styles.skipLabel}>Überspringen</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>
          Bring die Bausteine in die richtige Reihenfolge. Dieser Satz zählt nicht.
        </Text>
        {showGloss ? <Text style={styles.subtitle}>{sentence.gloss}</Text> : null}
      </View>

      <DragProvider>
        <Board
          tier={1}
          closed={result !== null && isCorrect(result.verdict)}
          dimmed={result?.verdict === 'ungewoehnlich'}
          showVerbAnchor={!wrong}
        />
      </DragProvider>

      {result ? (
        <VerdictPanel
          verdict={result.verdict}
          message={result.message}
          {...(result.emphasis ? { emphasis: result.emphasis } : {})}
        />
      ) : null}

      <View style={styles.footer}>
        {hint ? (
          <View style={styles.hint} accessibilityLiveRegion="polite" accessible accessibilityLabel={hint.de}>
            <Text style={styles.hintText}>{hint.de}</Text>
            {showGloss ? <Text style={styles.hintGloss}>{hint.en}</Text> : null}
          </View>
        ) : null}

        {wrong ? (
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Button variant="secondary" label="Nochmal" accessibilityLabel="Nochmal versuchen" onPress={() => setResult(null)} />
            </View>
            {result.correctedOrder ? (
              <View style={styles.rowItem}>
                <Button variant="secondary" label="Lösung zeigen" onPress={showCorrection} />
              </View>
            ) : null}
          </View>
        ) : null}

        {result ? (
          <Button label="Jetzt üben" onPress={finish} />
        ) : (
          <Button
            label="Prüfen"
            onPress={check}
            disabled={!ready}
            {...(ready ? {} : { accessibilityHint: 'Erst alle Bausteine setzen.' })}
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
  title: numeral,
  skip: {
    minHeight: a11y.minTouchTarget,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skipLabel: gloss,
  subtitle: gloss,
  footer: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    gap: space.sm,
  },
  hint: {
    gap: space.xs,
  },
  hintText: {
    ...explanation,
    color: palette.kreide,
  },
  hintGloss: fieldLabel,
  row: {
    flexDirection: 'row',
    gap: space.md,
  },
  rowItem: {
    flex: 1,
  },
});
