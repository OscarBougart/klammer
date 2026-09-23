/**
 * Board placement state — the tray, the fields, and what sits where.
 *
 * Deliberately ignorant of grammar. It knows a tile is in a field at an index;
 * it has no idea whether that is good German. design.md §3: slots accept
 * anything, the board never blocks a wrong placement, and validation happens
 * only on Prüfen. Any temptation to check correctness here is the thing that
 * would quietly destroy the product.
 */
import { create } from 'zustand';

import type { FieldId } from '@/board/fields';

export type BoardTile = {
  id: string;
  neutralSurface: string;
  role: string;
};

/** Where a tile currently is. `null` field means it is still in the tray. */
export type Placement = {
  tileId: string;
  field: FieldId | null;
};

type BoardState = {
  tiles: BoardTile[];
  /** Field id -> ordered tile ids. The order within a field is the answer. */
  fields: Record<string, string[]>;
  /** Tile ids still in the tray, in their shuffled order. */
  tray: string[];
  /** Tap-to-place: the tile waiting for a destination. */
  selectedTileId: string | null;

  load: (tiles: BoardTile[], trayOrder: string[]) => void;
  select: (tileId: string | null) => void;
  /** Places a tile into a field, optionally at an index. Never rejects. */
  place: (tileId: string, field: FieldId, index?: number) => void;
  /** Returns a tile to the tray. */
  returnToTray: (tileId: string) => void;
  /** The order the learner has built, as chunk ids, for the engine. */
  submittedOrder: (fieldOrder: readonly FieldId[]) => string[];
  /**
   * Rearranges the board to a known order — E3.5.
   *
   * Used to show the single-tile correction. The whole order is supplied and
   * re-laid across the fields, because "move this tile one place left" cannot
   * be expressed as a field-and-index without knowing the board's shape.
   * Visually only the corrected tile travels; the rest simply reflow.
   */
  applyOrder: (fieldOrder: readonly FieldId[], order: readonly string[]) => void;
  reset: () => void;
};

const EMPTY_FIELDS: Record<string, string[]> = {};

export const useBoardStore = create<BoardState>((set, get) => ({
  tiles: [],
  fields: EMPTY_FIELDS,
  tray: [],
  selectedTileId: null,

  load: (tiles, trayOrder) =>
    set({
      tiles,
      tray: trayOrder,
      fields: {},
      selectedTileId: null,
    }),

  select: (tileId) => set({ selectedTileId: tileId }),

  place: (tileId, field, index) =>
    set((state) => {
      // Remove from wherever it is first, so a tile can never be in two
      // places — including when it moves within its own field.
      const fields = detach(state.fields, tileId);
      const target = [...(fields[field] ?? [])];

      const at = index === undefined ? target.length : clamp(index, 0, target.length);
      target.splice(at, 0, tileId);

      return {
        fields: { ...fields, [field]: target },
        tray: state.tray.filter((id) => id !== tileId),
        selectedTileId: null,
      };
    }),

  returnToTray: (tileId) =>
    set((state) => ({
      fields: detach(state.fields, tileId),
      tray: state.tray.includes(tileId) ? state.tray : [...state.tray, tileId],
      selectedTileId: null,
    })),

  submittedOrder: (fieldOrder) => {
    const { fields } = get();
    return fieldOrder.flatMap((field) => fields[field] ?? []);
  },

  applyOrder: (fieldOrder, order) =>
    set((state) => {
      // Preserve how many tiles each field held, then refill in the new order.
      // The fields keep their shape; only the contents move.
      const counts = fieldOrder.map(
        (field) => (state.fields[field] ?? []).length,
      );

      const next: Record<string, string[]> = {};
      let cursor = 0;

      for (const [i, field] of fieldOrder.entries()) {
        const count = counts[i] ?? 0;
        next[field] = order.slice(cursor, cursor + count);
        cursor += count;
      }

      return { fields: next, selectedTileId: null };
    }),

  reset: () => set({ tiles: [], fields: {}, tray: [], selectedTileId: null }),
}));

/** Removes a tile from every field it might be in. */
function detach(
  fields: Record<string, string[]>,
  tileId: string,
): Record<string, string[]> {
  const next: Record<string, string[]> = {};
  for (const [field, ids] of Object.entries(fields)) {
    next[field] = ids.filter((id) => id !== tileId);
  }
  return next;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Whether every tile has left the tray. Prüfen stays disabled until then —
 * not because a partial board is wrong, but because checking one would report
 * a failure the learner has not actually made yet.
 */
export function isComplete(state: Pick<BoardState, 'tray'>): boolean {
  return state.tray.length === 0;
}
