/**
 * The board — the sentence being built, field zones, and the tile tray.
 *
 * Tap-to-place is wired here and is a complete path through the game on its
 * own: select a tile, tap a zone. design.md §10 requires it to be fully
 * equivalent to dragging, so it is built first and drag is layered on top
 * rather than the other way round.
 *
 * The zones are stacked, which suits a phone and splits a sentence across
 * rows. The line above them puts it back together: whatever the learner has
 * placed, read left to right, as German. That is where "the verb is second"
 * actually becomes visible.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useReducedMotion,
} from 'react-native-reanimated';

import DraggableTile from './DraggableTile';
import FieldZone, { type ZoneBox } from './FieldZone';
import KlammerArc from './KlammerArc';
import { capitalise } from './Tile';
import { useDragContext } from './dragContext';
import { insertionIndex } from './geometry';
import { boardFields, hasKlammer, isVerbFinal, type FieldId, type Tier } from './fields';
import { useBoardStore } from '@/store/board';
import { a11y, arc, border, fieldLabel, gloss, palette, sentenceLine, space } from '@/theme';

export type BoardProps = {
  tier: Tier;
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
   * Shown under the fields, inside the scrolling part: the verdict and the
   * hint. Anything text-heavy goes here so it can never cover the tray.
   */
  children?: ReactNode;
  /** Changes when something new appears under the fields; scrolls to it. */
  revealKey?: string | number;
};

export default function Board({
  tier,
  matrix,
  shakeTileId,
  shakeNonce = 0,
  closed = false,
  dimmed = false,
  showVerbAnchor = true,
  children,
  revealKey,
}: BoardProps) {
  const tiles = useBoardStore((s) => s.tiles);
  const fields = useBoardStore((s) => s.fields);
  const tray = useBoardStore((s) => s.tray);
  const selectedTileId = useBoardStore((s) => s.selectedTileId);
  const select = useBoardStore((s) => s.select);
  const place = useBoardStore((s) => s.place);
  const returnToTray = useBoardStore((s) => s.returnToTray);

  const { tiles: tileRects, scrollY } = useDragContext();
  const reducedMotion = useReducedMotion();

  // ─── Scrolling, only when it has to ───────────────────────────────────────
  // A pan on a placed tile competes with a scroll view for the same finger,
  // so the view only scrolls when the board is genuinely taller than the
  // space. On most phones it never is, and every drag stays a drag.
  const scrollRef = useRef<Animated.ScrollView>(null);
  const [viewport, setViewport] = useState(0);
  const [content, setContent] = useState(0);
  const canScroll = content > viewport + 1;

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  useEffect(() => {
    if (revealKey === undefined || !canScroll) return;
    scrollRef.current?.scrollToEnd({ animated: !reducedMotion });
  }, [revealKey, canScroll, reducedMotion]);

  /** Each zone's box, for drawing the bracket between two of them. */
  const [boxes, setBoxes] = useState<Partial<Record<FieldId, ZoneBox>>>({});

  /**
   * Places a dropped tile at the position it was dropped, not merely at the
   * end of the zone. Order inside a field *is* the answer — in `Ich trinke
   * morgens Kaffee` the Mittelfeld holds two tiles whose sequence is the whole
   * question — so appending would force a learner to clear the field to fix an
   * order.
   */
  const handleDrop = useCallback(
    (tileId: string, field: FieldId, dropX: number, dropY: number) => {
      const existing = useBoardStore.getState().fields[field] ?? [];
      const index = insertionIndex(
        existing,
        tileRects.value,
        dropX,
        dropY,
        tileId,
      );
      place(tileId, field, index);
    },
    [place, tileRects],
  );

  const byId = useMemo(
    () => new Map(tiles.map((t) => [t.id, t])),
    [tiles],
  );

  const shape = useMemo(
    () => ({ verbFinal: isVerbFinal(tiles.map((t) => t.role)) }),
    [tiles],
  );

  const zones = useMemo(() => boardFields(tier, shape), [tier, shape]);

  const vorfeldTileId = fields.vorfeld?.[0];

  // ─── The sentence so far, as one line ─────────────────────────────────────
  const built = zones.flatMap((z) => fields[z.id] ?? []);
  // Only a word in the Vorfeld is sentence-initial. With position 1 still
  // empty, the line opens with a gap rather than capitalising whatever came
  // first — "Trinke …" read as if the verb began the sentence.
  const vorfeldEmpty = zones.some((z) => z.id === 'vorfeld') && !vorfeldTileId;
  const words = built.map((id) => {
    const text = byId.get(id)?.neutralSurface ?? '';
    return id === vorfeldTileId ? capitalise(text) : text;
  });
  const line =
    words.length === 0
      ? null
      : `${vorfeldEmpty ? '… ' : ''}${words.join(' ')}${tray.length === 0 ? '.' : ' …'}`;

  // ─── The bracket ──────────────────────────────────────────────────────────
  const left = boxes.linkeKlammer;
  const right = boxes.rechteKlammer;
  const bracket =
    hasKlammer(tier) && left && right
      ? {
          top: left.y + left.height / 2,
          span: right.y + right.height / 2 - (left.y + left.height / 2),
        }
      : null;

  const recordBox = useCallback((id: FieldId, box: ZoneBox) => {
    setBoxes((prev) => {
      const old = prev[id];
      if (old && old.y === box.y && old.height === box.height) return prev;
      return { ...prev, [id]: box };
    });
  }, []);

  return (
    <View style={styles.root}>
      {/*
        The fields and everything written under them scroll; the tray below
        does not. A tall board — small phone, large text, a long verdict — used
        to spill over the tray and the buttons, so tiles could not be reached
        and the text sat on top of them. Now the tray is always at the bottom,
        under the thumb, and the rest makes room by scrolling.

        A pan on a placed tile and a scroll compete for the same finger, which
        is why scrolling is switched on only when the content does not fit.
      */}
      <Animated.ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={canScroll}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onLayout={(e) => setViewport(e.nativeEvent.layout.height)}
        onContentSizeChange={(_w, h) => setContent(h)}
        keyboardShouldPersistTaps="handled"
      >
      {matrix ? <Text style={styles.matrix}>{matrix}</Text> : null}

      <View
        style={styles.sentence}
        accessible
        accessibilityLabel={line ? `Dein Satz: ${line}` : 'Dein Satz ist noch leer.'}
      >
        <Text
          style={line ? styles.sentenceText : styles.sentenceEmpty}
          maxFontSizeMultiplier={a11y.maxDynamicTypeScale}
        >
          {line ?? 'Dein Satz erscheint hier.'}
        </Text>
      </View>

      <View style={styles.zones}>
        {bracket ? (
          <KlammerArc closed={closed} dimmed={dimmed} top={bracket.top} span={bracket.span} />
        ) : null}

        {zones.map((field) => {
          const ids = fields[field.id] ?? [];

          return (
            <FieldZone
              key={field.id}
              field={field}
              count={ids.length}
              isAwaitingPlacement={selectedTileId !== null}
              onBoxLayout={(box) => recordBox(field.id, box)}
              onDrop={
                selectedTileId === null
                  ? undefined
                  : () => place(selectedTileId, field.id)
              }
            >
              {ids.map((id, index) => {
                const tile = byId.get(id);
                if (!tile) return null;

                return (
                  <DraggableTile
                    key={id}
                    id={id}
                    neutralSurface={tile.neutralSurface}
                    // Only the first tile in the Vorfeld capitalises, and it
                    // does so because it is sentence-initial, not because of
                    // what it is.
                    capitalised={id === vorfeldTileId}
                    // design.md §6: the finite verb's face turns brass once it
                    // sits in the left bracket, so the sentence's anchor is
                    // visible while the learner is still working.
                    isFiniteAnchor={
                      showVerbAnchor &&
                      !shape.verbFinal &&
                      tile.role === 'FIN' &&
                      field.id === 'linkeKlammer'
                    }
                    isSelected={selectedTileId === id}
                    fieldName={field.label}
                    shakeNonce={id === shakeTileId ? shakeNonce : 0}
                    onDropInto={(target, x, y) => handleDrop(id, target, x, y)}
                    onDropOutside={() => returnToTray(id)}
                    onPress={() => {
                      // With another tile waiting, tapping a placed tile puts
                      // the waiting one in front of it. Without this, fixing
                      // the order inside a field by tap meant emptying it.
                      if (selectedTileId !== null && selectedTileId !== id) {
                        place(selectedTileId, field.id, index);
                        return;
                      }
                      if (selectedTileId === id) returnToTray(id);
                      else select(id);
                    }}
                  />
                );
              })}
            </FieldZone>
          );
        })}
      </View>

      {children}
      </Animated.ScrollView>

      {/*
        The tray only exists while it holds something. An empty tray is the
        moment the verdict and its buttons need the room, and a board that
        overflowed let the footer cover the tiles, so none could be picked up.
        A tile dropped outside the fields brings the tray straight back.
      */}
      {tray.length > 0 ? (
      <View style={styles.tray} accessibilityLabel="Bausteine">
        <View style={styles.trayTiles}>
          {tray.map((id) => {
            const tile = byId.get(id);
            if (!tile) return null;

            return (
              <DraggableTile
                key={id}
                id={id}
                neutralSurface={tile.neutralSurface}
                isSelected={selectedTileId === id}
                onDropInto={(target, x, y) => handleDrop(id, target, x, y)}
                onPress={() =>
                  select(selectedTileId === id ? null : id)
                }
              />
            );
          })}
        </View>
      </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.schiefer,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: space.md,
    paddingBottom: space.md,
  },
  matrix: {
    ...fieldLabel,
    paddingHorizontal: space.lg,
  },
  sentence: {
    marginHorizontal: space.lg,
    paddingBottom: space.sm,
    borderBottomWidth: border.hairline,
    borderBottomColor: palette.kante,
  },
  sentenceText: sentenceLine,
  sentenceEmpty: gloss,
  zones: {
    // Sized by its contents, not stretched to fill. Stretching left the zone
    // boxes short inside tall wrappers, and combined with shrinking produced
    // overlapping fields on a real screen.
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
    // The tray is the one surface that reaches the screen edge — it is where
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
});
