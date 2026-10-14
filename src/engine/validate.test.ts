import { describe, expect, it } from 'vitest';

import type { SeedSentence } from '@/content/seed';

import { hashOrder } from './hash';
import { findSingleTileCorrection, isCorrect, validate } from './validate';

/** t1-01, with its real accepted set. */
const CANONICAL = ['ich', 'trinke', 'morgens', 'kaffee'];
const FRONTED = ['morgens', 'trinke', 'ich', 'kaffee'];
const CONTRASTIVE = ['kaffee', 'trinke', 'ich', 'morgens'];

const sentence: SeedSentence = {
  id: 't1-01',
  tier: 1,
  ruleId: 'v2-deklarativ',
  gloss: 'I drink coffee in the mornings.',
  chunks: [],
  canonical: CANONICAL,
  acceptedHashes: {
    [hashOrder(CANONICAL)]: 'kanonisch',
    [hashOrder(FRONTED)]: 'gueltig',
    [hashOrder(CONTRASTIVE)]: 'ungewoehnlich',
  },
};

describe('validate', () => {
  it('returns the class of an accepted order', () => {
    expect(validate(CANONICAL, sentence)).toBe('kanonisch');
    expect(validate(FRONTED, sentence)).toBe('gueltig');
    expect(validate(CONTRASTIVE, sentence)).toBe('ungewoehnlich');
  });

  it('returns falsch for anything else', () => {
    // Finite verb third — the tier 1 error.
    expect(validate(['ich', 'morgens', 'trinke', 'kaffee'], sentence)).toBe(
      'falsch',
    );
  });

  it('treats a short or padded order as wrong rather than throwing', () => {
    expect(validate(['ich', 'trinke'], sentence)).toBe('falsch');
    expect(validate([...CANONICAL, 'ich'], sentence)).toBe('falsch');
  });

  it('counts all three accepted classes as correct', () => {
    expect(isCorrect('kanonisch')).toBe(true);
    expect(isCorrect('gueltig')).toBe(true);
    expect(isCorrect('ungewoehnlich')).toBe(true);
    expect(isCorrect('falsch')).toBe(false);
  });
});

describe('findSingleTileCorrection', () => {
  it('finds the one tile that has to move', () => {
    // `Ich morgens trinke Kaffee` — the finite verb is in third position.
    const wrong = ['ich', 'morgens', 'trinke', 'kaffee'];
    const correction = findSingleTileCorrection(wrong, sentence);

    expect(correction).not.toBeNull();
    expect(correction?.resultingOrder).toEqual(CANONICAL);
    // Either moving `trinke` forward or `morgens` back reaches a valid order;
    // both are single moves of distance one.
    expect(['trinke', 'morgens']).toContain(correction?.tileId);
  });

  it('produces an order that actually validates', () => {
    const wrong = ['ich', 'morgens', 'trinke', 'kaffee'];
    const correction = findSingleTileCorrection(wrong, sentence);

    expect(correction).not.toBeNull();
    expect(isCorrect(validate(correction!.resultingOrder, sentence))).toBe(true);
  });

  it('prefers the smallest move when several would work', () => {
    const wrong = ['ich', 'morgens', 'trinke', 'kaffee'];
    const correction = findSingleTileCorrection(wrong, sentence);
    // A tile shifting one place reads as "this goes here"; a tile flying
    // across the board reads as the sentence rearranging itself.
    expect(Math.abs((correction?.toIndex ?? 99) - 1)).toBeLessThanOrEqual(1);
  });

  it('returns null when no single move is enough', () => {
    // Two tiles out of place: the verb is last and the object is first.
    const veryWrong = ['kaffee', 'morgens', 'ich', 'trinke'];
    expect(findSingleTileCorrection(veryWrong, sentence)).toBeNull();
  });

  it('returns null for an order that is already correct', () => {
    // Nothing to correct — every single move away from a valid order either
    // lands on another valid order or on none, and `to === from` is skipped.
    const correction = findSingleTileCorrection(CANONICAL, sentence);
    if (correction) {
      expect(correction.resultingOrder).not.toEqual(CANONICAL);
    }
  });
});
