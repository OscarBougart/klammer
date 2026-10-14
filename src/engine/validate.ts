/**
 * Validation — E3.1.
 *
 * CLAUDE.md: validation is a lookup. This module hashes the order the learner
 * built and asks whether that hash is in the sentence's frozen accepted set.
 * There is no grammar here, no parser, no per-sentence special case, and there
 * must never be one — a sentence that needs an order the generator will not
 * produce is fixed in scripts/expand.ts or in the sentence's `extraAccepted`,
 * never here.
 */
import type { SeedSentence } from '@/content/seed';

import { hashOrder } from './hash';

/** design.md §4 — three ways to be right, one way to be wrong. */
export type Verdict = 'kanonisch' | 'gueltig' | 'ungewoehnlich' | 'falsch';

export function validate(
  order: readonly string[],
  sentence: SeedSentence,
): Verdict {
  return sentence.acceptedHashes[hashOrder(order)] ?? 'falsch';
}

export function isCorrect(verdict: Verdict): boolean {
  return verdict !== 'falsch';
}

/**
 * A tile to move, and where to put it.
 *
 * design.md §5: on a wrong answer the board animates the one tile that has to
 * move — not a full reshuffle — so the learner sees the delta rather than a
 * new sentence appearing.
 */
export type Correction = {
  tileId: string;
  /** Index in the submitted order that the tile should move to. */
  toIndex: number;
  /** The order that results, which is known to be accepted. */
  resultingOrder: string[];
};

/**
 * Finds a single move that would make the submitted order correct, if one
 * exists.
 *
 * Brute force over every (tile, destination) pair. With at most a dozen chunks
 * that is a hundred-odd hashes, which is nothing, and it needs no knowledge of
 * why the order is wrong — it just asks the accepted set, the same way
 * `validate` does. Anything cleverer would be grammar, and grammar does not
 * belong in the engine.
 *
 * Returns null when no single move is enough. That is not a failure: some
 * wrong orders are two moves from right, and the feedback then falls back to
 * naming the rule without animating a correction.
 */
export function findSingleTileCorrection(
  order: readonly string[],
  sentence: SeedSentence,
): Correction | null {
  // Prefer the smallest move: if several single moves work, the one that
  // shifts a tile least is the one that reads as "this goes here", rather
  // than as the sentence rearranging itself.
  let best: Correction | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let from = 0; from < order.length; from += 1) {
    const tileId = order[from];
    if (tileId === undefined) continue;

    const without = [...order];
    without.splice(from, 1);

    for (let to = 0; to <= without.length; to += 1) {
      if (to === from) continue;

      const candidate = [...without];
      candidate.splice(to, 0, tileId);

      if (sentence.acceptedHashes[hashOrder(candidate)] === undefined) continue;

      const distance = Math.abs(to - from);
      if (distance < bestDistance) {
        best = { tileId, toIndex: to, resultingOrder: candidate };
        bestDistance = distance;
      }
    }
  }

  return best;
}
