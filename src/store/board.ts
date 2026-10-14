/**
 * Board state — the word bank and the sentence row.
 *
 * The learner builds one row, left to right. The fields appear only after
 * Prüfen (see board/segment.ts), so the store knows nothing about them: a
 * tile is either in the row at an index or still in the bank.
 *
 * Deliberately ignorant of grammar. design.md §3: the board never blocks a
 * wrong order, and validation happens only on Prüfen. Any temptation to check
 * correctness here is the thing that would quietly destroy the product.
 */
import { create } from 'zustand';

export type BoardTile = {
  id: string;
  neutralSurface: string;
  role: string;
};

type BoardState = {
  tiles: BoardTile[];
  /** The sentence being built, as tile ids. This order is the answer. */
  line: string[];
  /**
   * Every tile id in its shuffled bank order, including those in the row. A
   * tile taken back out of the row returns to its own slot, so the bank never
   * reshuffles under the learner's thumb.
   */
  bankOrder: string[];

  load: (tiles: BoardTile[], bankOrder: string[]) => void;
  /** Adds a tile to the end of the row. */
  append: (tileId: string) => void;
  /** Puts a tile into the row at an index, moving it if already there. */
  insert: (tileId: string, index: number) => void;
  /** Takes a tile out of the row, back to the bank. */
  remove: (tileId: string) => void;
  /** Replaces the row, e.g. with the corrected order after a wrong answer. */
  setLine: (order: readonly string[]) => void;
  reset: () => void;
};

export const useBoardStore = create<BoardState>((set) => ({
  tiles: [],
  line: [],
  bankOrder: [],

  load: (tiles, bankOrder) => set({ tiles, bankOrder, line: [] }),

  append: (tileId) =>
    set((state) => ({ line: [...state.line.filter((id) => id !== tileId), tileId] })),

  insert: (tileId, index) =>
    set((state) => {
      const line = state.line.filter((id) => id !== tileId);
      line.splice(clamp(index, 0, line.length), 0, tileId);
      return { line };
    }),

  remove: (tileId) => set((state) => ({ line: state.line.filter((id) => id !== tileId) })),

  setLine: (order) => set({ line: [...order] }),

  reset: () => set({ tiles: [], line: [], bankOrder: [] }),
}));

/** The tiles not yet in the row, in their bank order. */
export function bankTiles(state: Pick<BoardState, 'bankOrder' | 'line'>): string[] {
  return state.bankOrder.filter((id) => !state.line.includes(id));
}

/**
 * Whether every tile is in the row. Prüfen stays disabled until then — not
 * because a partial sentence is wrong, but because checking one would report
 * a failure the learner has not actually made yet.
 */
export function isComplete(state: Pick<BoardState, 'bankOrder' | 'line'>): boolean {
  return bankTiles(state).length === 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
