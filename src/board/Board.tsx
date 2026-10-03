/**
 * The board — the sentence row, the word bank, and the fields after Prüfen.
 *
 * Building: the learner taps words in the bank and each one joins the end of
 * the row, the way a sentence is said. Tapping a word in the row sends it
 * back. Dragging moves a word to exactly where it is dropped. There is one
 * target and no mode to be in, so the first tap already does something.
 *
 * Checked: the row splits into its fields (segment.ts) — position 1, the
 * verb, the rest, and from tier 2 the bracket. The split is of the learner's
 * own sentence, so a wrong answer shows its mistake in place: two Satzteile
 * sitting in position 1 is the V2 rule broken, visibly.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion } from 'react-native-reanimated';

import DraggableTile from './DraggableTile';
import FieldZone, { type ZoneBox } from './FieldZone';
import KlammerArc from './KlammerArc';
import { insertionIndex, useDragContext } from './dragContext';
import { boardFields, hasKlammer, isVerbFinal, type FieldId, type Tier } from './fields';
import { segmentOrder } from './segment';
import { bankTiles, useBoardStore, type BoardTile } from '@/store/board';
import { a11y, arc, border, makeStyles, radius, space } from '@/theme';

export type BoardProps = {
  tier: Tier;
  /** Building the row, or showing it split into fields after Prüfen. */
  mode: 'build' | 'fields';
  /** Scaffolding shown above a played subclause, e.g. "Sie sagt, …". */
  matrix?: string;
  /** The one tile that has to move, after a wrong answer. */
  shakeTileId?: string;
  /** Bumped per wrong answer so a repeat of the same mistake still shakes. */
  shakeNonce?: number;
  /** The sentence was checked and is right: close the bracket. */
  closed?: boolean;
  /** Right but marked: close it in the dimmer tone. */
  dimmed?: boolean;
  /**
   * Whether the finite verb's face may turn brass. Off after a wrong answer,
   * so the only colour on the board is the one pointing at the mistake.
   */
  showVerbAnchor?: boolean;
  /**
   * Shown under the board, inside the scrolling part: the verdict and the
   * hint. Anything text-heavy goes here so it can never cover the bank.
   */
  children?: ReactNode;
  /** Changes when something new appears under the board; scrolls to it. */
  revealKey?: string | number;
};

export default function Board({
  tier,
  mode,
  matrix,
  shakeTileId,
  shakeNonce = 0,
  closed = false,
  dimmed = false,
  showVerbAnchor = true,
  children,
  revealKey,
}: BoardProps) {
  const styles = useStyles();
  const tiles = useBoardStore((s) => s.tiles);
  const line = useBoardStore((s) => s.line);
  const bankOrder = useBoardStore((s) => s.bankOrder);
  const append = useBoardStore((s) => s.append);
  const insert = useBoardStore((s) => s.insert);
  const remove = useBoardStore((s) => s.remove);

  const { rowRef, rowTiles, dragSource } = useDragContext();
  const reducedMotion = useReducedMotion();

  const bank = useMemo(() => bankTiles({ bankOrder, line }), [bankOrder, line]);
  const byId = useMemo(() => new Map(tiles.map((t) => [t.id, t])), [tiles]);
  const verbFinal = useMemo(() => isVerbFinal(tiles.map((t) => t.role)), [tiles]);

  // ─── Scrolling, only when it has to ───────────────────────────────────────
  const scrollRef = useRef<Animated.ScrollView>(null);
  const [viewport, setViewport] = useState(0);
  const [content, setContent] = useState(0);
  const canScroll = content > viewport + 1;

  useEffect(() => {
    if (revealKey === undefined || !canScroll) return;
    scrollRef.current?.scrollToEnd({ animated: !reducedMotion });
  }, [revealKey, canScroll, reducedMotion]);

  /** A drop on the row lands between the two words it fell between. */
  const dropAt = useCallback(
    (tileId: string, rowX: number, rowY: number) => {
      const current = useBoardStore.getState().line;
      insert(tileId, insertionIndex(current, rowTiles.current, rowX, rowY, tileId));
    },
    [insert, rowTiles],
  );

  // Whichever container the lifted tile came from draws above the other, so
  // a word carried from the bank to the row (or back) is never hidden under
  // the surface it is crossing.
  const rowLayer = useAnimatedStyle(() => ({ zIndex: dragSource.value === 'row' ? 2 : 1 }));
  const bankLayer = useAnimatedStyle(() => ({ zIndex: dragSource.value === 'bank' ? 2 : 0 }));

  const complete = bank.length === 0;

  const scroller = (body: ReactNode) => (
    <Animated.ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      scrollEnabled={canScroll}
      onLayout={(e) => setViewport(e.nativeEvent.layout.height)}
      onContentSizeChange={(_w, h) => setContent(h)}
    >
      {body}
    </Animated.ScrollView>
  );

  if (mode === 'fields') {
    return (
      <View style={styles.root}>
        {scroller(
          <>
            {matrix ? <Text style={styles.matrix}>{matrix}</Text> : null}
            <FieldsView
              tier={tier}
              verbFinal={verbFinal}
              order={line}
              byId={byId}
              closed={closed}
              dimmed={dimmed}
              showVerbAnchor={showVerbAnchor}
              {...(shakeTileId ? { shakeTileId } : {})}
              shakeNonce={shakeNonce}
            />
            {children}
          </>,
        )}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {matrix ? <Text style={styles.matrix}>{matrix}</Text> : null}

      {/* The sentence row: the one place words go. */}
      <Animated.View style={[styles.rowWrap, rowLayer]}>
        <Animated.View
          ref={rowRef}
          collapsable={false}
          style={[styles.row, line.length === 0 && styles.rowEmpty]}
        >
          {line.length === 0 ? (
            <Text style={styles.placeholder} maxFontSizeMultiplier={a11y.maxDynamicTypeScale}>
              Dein Satz entsteht hier.
            </Text>
          ) : (
            line.map((id, index) => {
              const tile = byId.get(id);
              if (!tile) return null;
              return (
                <DraggableTile
                  key={id}
                  id={id}
                  source="row"
                  neutralSurface={tile.neutralSurface}
                  // The first word of a German sentence is capitalised,
                  // whatever it is. Watching it flip is part of the lesson.
                  capitalised={index === 0}
                  // design.md §6: the verb's face turns brass once it is
                  // second, so the sentence's anchor shows while building.
                  isFiniteAnchor={
                    showVerbAnchor && !verbFinal && tile.role === 'FIN' && index === 1
                  }
                  fieldName={`deinem Satz, Stelle ${index + 1}`}
                  onPress={() => remove(id)}
                  onDropInRow={(x, y) => dropAt(id, x, y)}
                  onDropOutside={() => remove(id)}
                />
              );
            })
          )}
          {complete && line.length > 0 ? (
            <Text style={styles.period} importantForAccessibility="no">
              .
            </Text>
          ) : null}
        </Animated.View>
      </Animated.View>

      {scroller(children)}

      {bank.length > 0 ? (
        <Animated.View style={[styles.tray, bankLayer]} accessibilityLabel="Wörter">
          <View style={styles.trayTiles}>
            {bank.map((id) => {
              const tile = byId.get(id);
              if (!tile) return null;
              return (
                <DraggableTile
                  key={id}
                  id={id}
                  source="bank"
                  neutralSurface={tile.neutralSurface}
                  onPress={() => append(id)}
                  onDropInRow={(x, y) => dropAt(id, x, y)}
                />
              );
            })}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

type FieldsViewProps = {
  tier: Tier;
  verbFinal: boolean;
  order: readonly string[];
  byId: Map<string, BoardTile>;
  closed: boolean;
  dimmed: boolean;
  showVerbAnchor: boolean;
  shakeTileId?: string;
  shakeNonce: number;
};

/** The checked sentence, split into its fields, with the bracket. */
function FieldsView({
  tier,
  verbFinal,
  order,
  byId,
  closed,
  dimmed,
  showVerbAnchor,
  shakeTileId,
  shakeNonce,
}: FieldsViewProps) {
  const styles = useStyles();
  const zones = useMemo(() => boardFields(tier, { verbFinal }), [tier, verbFinal]);
  const segments = useMemo(
    () =>
      segmentOrder(
        order,
        (id) => byId.get(id)?.role,
        zones.map((z) => z.id),
      ),
    [order, byId, zones],
  );

  /** Each zone's box, for drawing the bracket between two of them. */
  const [boxes, setBoxes] = useState<Partial<Record<FieldId, ZoneBox>>>({});
  const recordBox = useCallback((id: FieldId, box: ZoneBox) => {
    setBoxes((prev) => {
      const old = prev[id];
      if (old && old.y === box.y && old.height === box.height) return prev;
      return { ...prev, [id]: box };
    });
  }, []);

  const left = boxes.linkeKlammer;
  const right = boxes.rechteKlammer;
  const bracket =
    hasKlammer(tier) && left && right
      ? {
          top: left.y + left.height / 2,
          span: right.y + right.height / 2 - (left.y + left.height / 2),
        }
      : null;

  return (
    <View style={styles.zones}>
      {bracket ? (
        <KlammerArc closed={closed} dimmed={dimmed} top={bracket.top} span={bracket.span} />
      ) : null}

      {zones.map((field) => {
        const ids = segments[field.id] ?? [];
        return (
          <FieldZone
            key={field.id}
            field={field}
            count={ids.length}
            isOverfull={field.capacity === 'single' && ids.length > 1}
            onBoxLayout={(box) => recordBox(field.id, box)}
          >
            {ids.map((id) => {
              const tile = byId.get(id);
              if (!tile) return null;
              return (
                <DraggableTile
                  key={id}
                  id={id}
                  source="row"
                  dragEnabled={false}
                  neutralSurface={tile.neutralSurface}
                  capitalised={id === order[0]}
                  isFiniteAnchor={
                    showVerbAnchor &&
                    !verbFinal &&
                    tile.role === 'FIN' &&
                    field.id === 'linkeKlammer'
                  }
                  fieldName={field.label}
                  shakeNonce={id === shakeTileId ? shakeNonce : 0}
                  onDropInRow={() => {}}
                />
              );
            })}
          </FieldZone>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles(({ palette, type }) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: palette.schiefer,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      gap: space.md,
      paddingTop: space.sm,
      paddingBottom: space.md,
    },
    matrix: {
      ...type.fieldLabel,
      paddingHorizontal: space.lg,
    },
    rowWrap: {
      paddingHorizontal: space.lg,
      paddingTop: space.sm,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: space.sm,
      // Two lines of tiles before it grows, so the bank below does not jump
      // on the first few taps.
      minHeight: a11y.minTouchTarget * 2 + space.sm * 3,
      padding: space.sm,
      borderRadius: radius.field,
      backgroundColor: palette.feld,
      borderWidth: border.hairline,
      borderColor: palette.kante,
    },
    rowEmpty: {
      borderStyle: 'dashed',
      borderColor: palette.grau,
      justifyContent: 'center',
    },
    placeholder: type.gloss,
    period: type.sentenceLine,
    zones: {
      flexGrow: 0,
      flexShrink: 0,
      gap: space.md,
      paddingVertical: space.sm,
      // The left edge is the bracket's gutter.
      paddingLeft: arc.gutter,
      paddingRight: space.lg,
    },
    tray: {
      backgroundColor: palette.feld,
      paddingHorizontal: space.lg,
      paddingVertical: space.md,
      // The bank is the one surface that reaches the screen edge — it is where
      // the hand rests.
      borderTopWidth: border.hairline,
      borderTopColor: palette.kante,
    },
    trayTiles: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space.sm,
      minHeight: space.xxl,
    },
  }),
);
