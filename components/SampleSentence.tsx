/**
 * One sentence from a Stufe, laid out as tiles — Home's picture of the app.
 *
 * Not a screenshot and not an illustration: real sentences from the bank,
 * drawn with the same chalk tiles and brass the board uses. The finite verb is
 * brass; from Stufe 2 a bracket runs under the sentence from the verb to its
 * other half, which is the thing the app is named after. In a subclause the
 * conjunction opens the bracket and the finite verb, now last, closes it; at
 * Stufe 5 what follows the bracket is named as the Nachfeld. Static, so there
 * is nothing for reduced motion to switch off.
 */
import { memo, useMemo, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { capitalise } from '@/board/Tile';
import { seed, type SeedSentence } from '@/content/seed';
import { a11y, arc, border, makeStyles, radius, shadow, space } from '@/theme';

export type SampleSentenceProps = {
  /** The Stufe to show a sentence from. */
  tier: number;
};

/** Verbal material that closes the bracket. */
const RIGHT_BRACKET_ROLES = new Set(['PART', 'INF', 'PTKVZ']);

/**
 * A short, typical sentence per Stufe, chosen by hand so the picture is the
 * clearest one: a plain V2 sentence, a separable verb, negation before the
 * bracket closes.
 */
const SAMPLE_ID: Record<number, string> = {
  1: 't1-01',
  2: 't2-02',
  3: 't3-12',
  4: 't4-01',
  5: 't5-01',
};

function pickSentence(tier: number): SeedSentence | undefined {
  const wanted = SAMPLE_ID[tier];
  return (
    seed.sentences.find((s) => s.id === wanted) ??
    seed.sentences.find((s) => s.tier === tier && s.chunks.length <= 5)
  );
}

type Span = { x: number; y: number; width: number };

function SampleSentenceComponent({ tier }: SampleSentenceProps) {
  const styles = useStyles();
  const sentence = useMemo(() => pickSentence(tier), [tier]);
  const [spans, setSpans] = useState<Record<string, Span>>({});

  const words = useMemo(() => {
    if (!sentence) return [];
    const byId = new Map(sentence.chunks.map((c) => [c.id, c]));
    return sentence.canonical.flatMap((id, index) => {
      const chunk = byId.get(id);
      if (!chunk) return [];
      // Behind a lead-in the tiles continue a sentence; nothing is initial.
      const initial = index === 0 && !sentence.matrix;
      const text = initial ? capitalise(chunk.neutralSurface) : chunk.neutralSurface;
      return [{ id, text, role: chunk.role }];
    });
  }, [sentence]);

  if (!sentence) return null;

  const finite = words.find((w) => w.role === 'FIN');
  // A subclause: the conjunction holds the left bracket, the finite verb the
  // right one.
  const konj = words.find((w) => w.role === 'KONJ');
  const opening = konj ?? finite;
  const closing = konj
    ? finite
    : [...words].reverse().find((w) => RIGHT_BRACKET_ROLES.has(w.role));
  const from = opening ? spans[opening.id] : undefined;
  const to = closing ? spans[closing.id] : undefined;

  // The bracket only makes sense drawn along one line of tiles.
  const bracket =
    tier >= 2 && from && to && from.y === to.y && to.x > from.x
      ? {
          left: from.x + from.width / 2,
          width: to.x + to.width / 2 - (from.x + from.width / 2),
        }
      : null;
  // On a narrow phone, or at large text, the sentence wraps and a line from
  // one row to the next would point at nothing. The two ends are marked on
  // the tiles instead, and named underneath.
  const wrapped = tier >= 2 && opening && closing && from && to && !bracket;
  const verbMark = tier === 1 && from ? { left: from.x, width: from.width } : null;

  // Stufe 5 is about what may follow the bracket, so it is named.
  const closingIndex = closing ? words.indexOf(closing) : -1;
  const nachfeld = tier >= 5 && !konj && closingIndex >= 0 ? words.slice(closingIndex + 1) : [];

  const record = (id: string) => (event: LayoutChangeEvent) => {
    const { x, y, width } = event.nativeEvent.layout;
    setSpans((prev) => {
      const old = prev[id];
      if (old && old.x === x && old.y === y && old.width === width) return prev;
      return { ...prev, [id]: { x, y, width } };
    });
  };

  const leadIn = sentence.matrix?.replace(/\s*…\s*$/, '');
  const sentenceText = `${leadIn ? `${leadIn} ` : ''}${words.map((w) => w.text).join(' ')}.`;

  return (
    <View style={styles.card} accessible accessibilityLabel={`Beispiel: ${sentenceText}`}>
      {sentence.matrix ? <Text style={styles.leadIn}>{sentence.matrix}</Text> : null}
      <View style={styles.tiles}>
        {words.map((w) => (
          <View
            key={w.id}
            onLayout={record(w.id)}
            style={[
              styles.tile,
              w.role === 'FIN' && styles.tileFinite,
              wrapped && (w === opening || w === closing) && styles.tileBracketEnd,
            ]}
          >
            <Text style={styles.tileText} maxFontSizeMultiplier={a11y.maxDynamicTypeScale}>
              {w.text}
            </Text>
          </View>
        ))}
      </View>

      {verbMark ? (
        // Tier 1: a note under the verb, in the flow, so the card is only
        // as tall as it needs to be.
        <Text style={[styles.verbNote, { marginLeft: verbMark.left }]}>↑ Position 2</Text>
      ) : null}

      {wrapped ? (
        <Text style={styles.markText}>
          Klammer: {opening.text} … {closing.text}
        </Text>
      ) : null}

      {tier >= 2 && !wrapped ? (
        <View style={styles.markRow}>
          {bracket ? (
            <>
              <View style={[styles.bracket, { left: bracket.left, width: bracket.width }]} />
              <Text style={[styles.markLabel, { left: bracket.left, width: bracket.width }]}>
                Klammer
              </Text>
            </>
          ) : null}
        </View>
      ) : null}

      {nachfeld.length > 0 ? (
        <Text style={styles.markText}>
          Nachfeld: {nachfeld.map((w) => w.text).join(' ')}
        </Text>
      ) : null}
    </View>
  );
}

export default memo(SampleSentenceComponent);

const useStyles = makeStyles(({ palette, type }) =>
  StyleSheet.create({
    card: {
      backgroundColor: palette.feld,
      borderRadius: radius.field,
      borderWidth: border.hairline,
      borderColor: palette.kante,
      padding: space.lg,
      gap: space.xs,
    },
    tiles: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space.sm,
    },
    tile: {
      backgroundColor: palette.kreide,
      borderRadius: radius.tile,
      paddingHorizontal: space.sm,
      paddingVertical: space.xs,
      // The same hard offset shadow as a board tile, drawn as a bottom edge.
      borderBottomWidth: shadow.tileRest.offsetY,
      borderBottomColor: palette.kante,
    },
    tileFinite: {
      backgroundColor: palette.messing,
    },
    tileBracketEnd: {
      // The bracket's two ends, when it cannot be drawn between them.
      borderBottomColor: palette.messing,
    },
    markText: {
      ...type.gloss,
      color: palette.messing,
    },
    tileText: type.miniTileText,
    markRow: {
      // Room for the bracket and its label under the tiles.
      height: arc.tick + space.xl,
    },
    bracket: {
      position: 'absolute',
      top: space.xs,
      height: arc.tick,
      borderColor: palette.messing,
      borderLeftWidth: arc.stroke,
      borderRightWidth: arc.stroke,
      borderBottomWidth: arc.stroke,
      borderBottomLeftRadius: radius.tile,
      borderBottomRightRadius: radius.tile,
    },
    markLabel: {
      ...type.gloss,
      position: 'absolute',
      top: arc.tick + space.xs,
      textAlign: 'center',
      color: palette.messing,
    },
    leadIn: {
      ...type.gloss,
      color: palette.kreide,
    },
    verbNote: {
      ...type.gloss,
      color: palette.messing,
    },
  }),
);
