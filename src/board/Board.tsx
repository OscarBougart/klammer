/**
 * The board — field zones above, tile tray below.
 *
 * Tap-to-place is wired here and is a complete path through the game on its
 * own: select a tile, tap a zone. design.md §10 requires it to be fully
 * equivalent to dragging, so it is built first and drag is layered on top
 * rather than the other way round.
 */
import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import DraggableTile from './DraggableTile';
import FieldZone from './FieldZone';
import { useDragContext } from './dragContext';
import { insertionIndex } from './geometry';
import { boardFields, isVerbFinal, type FieldId, type Tier } from './fields';
import { useBoardStore } from '@/store/board';
import { border, fieldLabel, palette, space } from '@/theme';

export type BoardProps = {
  tier: Tier;
  /** Scaffolding shown above a played subclause, e.g. "Sie sagt, …". */
  matrix?: string;
  /** The one tile that has to move, after a wrong answer. */
  shakeTileId?: string;
  /** Bumped per wrong answer so a repeat of the same mistake still shakes. */
  shakeNonce?: number;
};

export default function Board({
  tier,
  matrix,
  shakeTileId,
  shakeNonce = 0,
}: BoardProps) {
  const tiles = useBoardStore((s) => s.tiles);
  const fields = useBoardStore((s) => s.fields);
  const tray = useBoardStore((s) => s.tray);
  const selectedTileId = useBoardStore((s) => s.selectedTileId);
  const select = useBoardStore((s) => s.select);
  const place = useBoardStore((s) => s.place);
  const returnToTray = useBoardStore((s) => s.returnToTray);

  const { tiles: tileRects } = useDragContext();

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

  return (
    <View style={styles.root}>
      {matrix ? <Text style={styles.matrix}>{matrix}</Text> : null}

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
        {zones.map((field) => {
          const ids = fields[field.id] ?? [];

          return (
            <FieldZone
              key={field.id}
              field={field}
              count={ids.length}
              isAwaitingPlacement={selectedTileId !== null}
              onDrop={
                selectedTileId === null
                  ? undefined
                  : () => place(selectedTileId, field.id)
              }
            >
              {ids.map((id) => {
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
                    isSelected={selectedTileId === id}
                    fieldName={field.label}
                    shakeNonce={id === shakeTileId ? shakeNonce : 0}
                    onDropInto={(target, x, y) => handleDrop(id, target, x, y)}
                    onDropOutside={() => returnToTray(id)}
                    onPress={() =>
                      selectedTileId === id ? returnToTray(id) : select(id)
                    }
                  />
                );
              })}
            </FieldZone>
          );
        })}
      </View>

      <View style={styles.tray}>
        <Text style={styles.trayLabel}>
          {tray.length > 0 ? 'Bausteine' : 'Alle Bausteine gesetzt'}
        </Text>

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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.schiefer,
    gap: space.lg,
  },
  matrix: {
    ...fieldLabel,
    paddingHorizontal: space.lg,
  },
  zones: {
    // Sized by its contents, not stretched to fill. Stretching left the zone
    // boxes short inside tall wrappers, and combined with shrinking produced
    // overlapping fields on a real screen.
    flexGrow: 0,
    flexShrink: 0,
    gap: space.md,
    padding: space.lg,
  },
  tray: {
    backgroundColor: palette.feld,
    padding: space.lg,
    gap: space.md,
    // The tray is the one surface that reaches the screen edge — it is where
    // the hand rests.
    borderTopWidth: border.hairline,
    borderTopColor: palette.kante,
  },
  trayLabel: fieldLabel,
  trayTiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    minHeight: space.xxl,
  },
});
