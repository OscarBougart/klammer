/**
 * One sentence from a Stufe, laid out as tiles — Home's picture of the app.
 *
 * Not a screenshot and not an illustration: real sentences from the bank,
 * drawn with the same chalk tiles and brass the board uses. The finite verb is
 * brass; from Stufe 2 a bracket runs under the sentence from the verb to its
 * other half, which is the thing the app is named after. Static, so there is
 * nothing for reduced motion to switch off.
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
      const text = index === 0 ? capitalise(chunk.neutralSurface) : chunk.neutralSurface;
      return [{ id, text, role: chunk.role }];
    });
  }, [sentence]);

  if (!sentence) return null;

  const finite = words.find((w) => w.role === 'FIN');
  const closing = [...words].reverse().find((w) => RIGHT_BRACKET_ROLES.has(w.role));
  const from = finite ? spans[finite.id] : undefined;
  const to = closing ? spans[closing.id] : undefined;

  // The bracket only makes sense drawn along one line of tiles.
  const bracket =
    tier >= 2 && from && to && from.y === to.y && to.x > from.x
      ? {
          left: from.x + from.width / 2,
          width: to.x + to.width / 2 - (from.x + from.width / 2),
        }
      : null;
  const verbMark = tier === 1 && from ? { left: from.x, width: from.width } : null;

  const record = (id: string) => (event: LayoutChangeEvent) => {
    const { x, y, width } = event.nativeEvent.layout;
    setSpans((prev) => {
      const old = prev[id];
      if (old && old.x === x && old.y === y && old.width === width) return prev;
      return { ...prev, [id]: { x, y, width } };
    });
  };

  const sentenceText = `${words.map((w) => w.text).join(' ')}.`;

  return (
    <View style={styles.card} accessible accessibilityLabel={`Beispiel: ${sentenceText}`}>
      <View style={styles.tiles}>
        {words.map((w) => (
          <View
            key={w.id}
            onLayout={record(w.id)}
            style={[styles.tile, w.role === 'FIN' && styles.tileFinite]}
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

      {tier >= 2 ? (
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
    verbNote: {
      ...type.gloss,
      color: palette.messing,
    },
  }),
);
