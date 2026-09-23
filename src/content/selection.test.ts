import { describe, expect, it } from 'vitest';

import type { SeedSentence } from './seed';
import { selectSession, SESSION_LENGTH } from './selection';

const sentence = (id: string, tier: number): SeedSentence => ({
  id,
  tier,
  ruleId: 'r',
  gloss: '',
  chunks: [],
  canonical: [],
  acceptedHashes: {},
});

const bank = [
  ...Array.from({ length: 15 }, (_, i) => sentence(`t1-${i}`, 1)),
  ...Array.from({ length: 15 }, (_, i) => sentence(`t2-${i}`, 2)),
];

const NOW = 1_700_000_000;

const base = {
  sentences: bank,
  tier: 1,
  reviews: [],
  seen: new Set<string>(),
  now: NOW,
};

describe('selectSession', () => {
  it('returns ten sentences', () => {
    expect(selectSession(base)).toHaveLength(SESSION_LENGTH);
  });

  it('only offers the current tier and below', () => {
    // Being handed a tier you have not reached is the one thing selection
    // must never do.
    for (const s of selectSession(base)) {
      expect(s.tier).toBeLessThanOrEqual(1);
    }
  });

  it('puts due reviews first', () => {
    const chosen = selectSession({
      ...base,
      reviews: [
        { sentenceId: 't1-9', stage: 0, dueAt: NOW - 10 },
        { sentenceId: 't1-4', stage: 0, dueAt: NOW - 1000 },
      ],
    });

    // Most overdue first.
    expect(chosen[0]?.id).toBe('t1-4');
    expect(chosen[1]?.id).toBe('t1-9');
  });

  it('ignores reviews that are not due yet', () => {
    const chosen = selectSession({
      ...base,
      reviews: [{ sentenceId: 't1-9', stage: 0, dueAt: NOW + 10_000 }],
    });
    expect(chosen[0]?.id).not.toBe('t1-9');
  });

  it('prefers unseen sentences over seen ones', () => {
    const seen = new Set(Array.from({ length: 10 }, (_, i) => `t1-${i}`));
    const chosen = selectSession({ ...base, seen });

    // Five unseen exist; they should all appear before any seen one.
    const firstSeenAt = chosen.findIndex((s) => seen.has(s.id));
    expect(firstSeenAt).toBe(5);
  });

  it('never repeats a sentence within a session', () => {
    const chosen = selectSession({
      ...base,
      reviews: [{ sentenceId: 't1-0', stage: 0, dueAt: NOW - 1 }],
    });
    expect(new Set(chosen.map((s) => s.id)).size).toBe(chosen.length);
  });

  it('falls back to earlier tiers when the current one runs short', () => {
    const small = [sentence('t2-only', 2), ...Array.from({ length: 5 }, (_, i) => sentence(`t1-${i}`, 1))];
    const chosen = selectSession({ ...base, sentences: small, tier: 2 });

    expect(chosen).toHaveLength(6);
    expect(chosen[0]?.id).toBe('t2-only');
  });

  it('returns a short session rather than failing on a small bank', () => {
    const chosen = selectSession({
      ...base,
      sentences: [sentence('only', 1)],
    });
    expect(chosen).toHaveLength(1);
  });

  it('is reproducible given a deterministic shuffle', () => {
    const reversed = <T,>(v: readonly T[]): T[] => [...v].reverse();
    const a = selectSession({ ...base, shuffle: reversed });
    const b = selectSession({ ...base, shuffle: reversed });
    expect(a.map((s) => s.id)).toEqual(b.map((s) => s.id));
  });
});
