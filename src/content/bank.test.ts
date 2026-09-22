/**
 * Invariants of the shipped bank, not of any one sentence.
 *
 * These are the checks that were being run by hand after every content batch.
 * A drafting mistake shows up here as a failing test rather than as something
 * a player meets, which is the point: the corpus fixture gates the *rules*,
 * and this file gates the *bank the rules produced*.
 */
import { describe, expect, it } from 'vitest';

import { seed } from './seed';

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

  it('lists every canonical chunk id in the sentence', () => {
    for (const s of seed.sentences) {
      const ids = new Set(s.chunks.map((c) => c.id));
      expect(new Set(s.canonical), `${s.id}`).toEqual(ids);
      expect(s.canonical, `${s.id}`).toHaveLength(s.chunks.length);
    }
  });
});
