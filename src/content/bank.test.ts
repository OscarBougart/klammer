/**
 * Invariants of the shipped bank, not of any one sentence.
 *
 * These are the checks that were being run by hand after every content batch.
 * A drafting mistake shows up here as a failing test rather than as something
 * a player meets, which is the point: the corpus fixture gates the *rules*,
 * and this file gates the *bank the rules produced*.
 */
import { describe, expect, it } from 'vitest';

import { hashOrder } from '../engine/hash';

import { seed } from './seed';

function* permutations<T>(items: readonly T[]): Generator<T[]> {
  if (items.length <= 1) {
    yield [...items];
    return;
  }
  for (const [i, head] of items.entries()) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const tail of permutations(rest)) yield [head, ...tail];
  }
}

describe('the sentence bank', () => {
  it('is not empty', () => {
    // Without this, every check below passes vacuously on a broken seed.
    expect(seed.sentences.length).toBeGreaterThan(100);
  });

  it('has unique ids', () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const s of seed.sentences) {
      if (seen.has(s.id)) duplicates.push(s.id);
      seen.add(s.id);
    }
    expect(duplicates).toEqual([]);
  });

  it('gives every sentence exactly one canonical order', () => {
    // expand.ts already asserts this, but it asserts it about what the
    // generator produced. This asserts it about what shipped.
    for (const s of seed.sentences) {
      const canonical = Object.values(s.acceptedHashes).filter(
        (c) => c === 'kanonisch',
      );
      expect(canonical, `${s.id}`).toHaveLength(1);
    }
  });

  it('gives every sentence more than one accepted order', () => {
    /*
     * A single-solution puzzle is the failure the native review caught: a
     * learner who builds real German and is told it is wrong. It is also how
     * a too-small sentence hides — t1-16 became single-solution the moment
     * `schon` was barred from the Vorfeld, and nothing but a hand count
     * noticed.
     */
    const single = seed.sentences
      .filter((s) => Object.keys(s.acceptedHashes).length < 2)
      .map((s) => s.id);
    expect(single).toEqual([]);
  });

  it('never stores falsch as a class', () => {
    // design.md §4: `falsch` is the absence of a class, never a value. A
    // stored `falsch` would be an accepted order the app then rejects.
    for (const s of seed.sentences) {
      expect(Object.values(s.acceptedHashes), `${s.id}`).not.toContain(
        'falsch',
      );
    }
  });

  it('never moves a chunk across nicht', () => {
    /*
     * Which side of `nicht` a constituent sits on is scope, not word order:
     * `den Weg nicht sofort gefunden` and `sofort nicht den Weg gefunden` are
     * different claims, and the second is not what the sentence means. The
     * generator's pairwise swap once produced exactly that as `gueltig`
     * (a draft of t2-120). Only the fronted chunk may leave its side.
     *
     * Every permutation is hashed and tested for membership, because the
     * seed stores hashes, not orders. Sentences are small enough for that.
     */
    const crossings: string[] = [];
    for (const s of seed.sentences) {
      const neg = s.chunks.find((c) => c.role === 'NEG');
      if (!neg || s.chunks.some((c) => c.role === 'KONJ')) continue;
      const side = (order: readonly string[], id: string) =>
        order.indexOf(id) < order.indexOf(neg.id);
      for (const order of permutations(s.canonical)) {
        if (!(hashOrder(order) in s.acceptedHashes)) continue;
        const rest = order.slice(1);
        const moved = s.canonical.find(
          (id) =>
            id !== neg.id &&
            id !== order[0] &&
            side(s.canonical, id) !== side(rest, id),
        );
        if (moved) crossings.push(`${s.id}: ${order.join(' ')}`);
      }
    }
    expect(crossings).toEqual([]);
  });

  it('lists every canonical chunk id in the sentence', () => {
    for (const s of seed.sentences) {
      const ids = new Set(s.chunks.map((c) => c.id));
      expect(new Set(s.canonical), `${s.id}`).toEqual(ids);
      expect(s.canonical, `${s.id}`).toHaveLength(s.chunks.length);
    }
  });
});
