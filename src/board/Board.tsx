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
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
};

export default function Board({
  tier,
  matrix,
  shakeTileId,
  shakeNonce = 0,
  closed = false,
  dimmed = false,
  showVerbAnchor = true,
}: BoardProps) {
  const tiles = useBoardStore((s) => s.tiles);
  const fields = useBoardStore((s) => s.fields);
  const tray = useBoardStore((s) => s.tray);
  const selectedTileId = useBoardStore((s) => s.selectedTileId);
  const select = useBoardStore((s) => s.select);
  const place = useBoardStore((s) => s.place);
  const returnToTray = useBoardStore((s) => s.returnToTray);

  const { tiles: tileRects } = useDragContext();

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
  const words = built.map((id, i) => {
    const text = byId.get(id)?.neutralSurface ?? '';
    return i === 0 ? capitalise(text) : text;
  });
  const line =
    words.length === 0
      ? null
      : `${words.join(' ')}${tray.length === 0 ? '.' : ' …'}`;

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

      {/*
        Deliberately not a ScrollView. A Pan gesture inside a vertical scroll
        view loses gesture arbitration to the scroll, and the usual escape —
        requiring a long press before a drag activates — would contradict
        design.md §6, where a tile lifts in direct response to touch.

        The board is a diagram and is meant to be seen whole. If very large
        dynamic type overflows it, that is a layout problem to solve in E8.3,
        not a reason to put a scroll surface under the one gesture the product
        is made of.
      */}
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
    gap: space.md,
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
