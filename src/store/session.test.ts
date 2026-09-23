import { beforeEach, describe, expect, it } from 'vitest';

import type { SeedSentence } from '@/content/seed';

import {
  correctCount,
  currentSentence,
  isSessionComplete,
  newSessionId,
  useSessionStore,
} from './session';

const sentence = (id: string): SeedSentence => ({
  id,
  tier: 1,
  ruleId: 'r',
  gloss: '',
  chunks: [],
  canonical: [],
  acceptedHashes: {},
});

const TEN = Array.from({ length: 10 }, (_, i) => sentence(`s${i}`));

describe('session store', () => {
  beforeEach(() => useSessionStore.getState().clear());

  it('starts at the first sentence', () => {
    useSessionStore.getState().start('sid', TEN);
    const state = useSessionStore.getState();
    expect(state.index).toBe(0);
    expect(currentSentence(state)?.id).toBe('s0');
    expect(isSessionComplete(state)).toBe(false);
  });

  it('advances through all ten and then completes', () => {
    useSessionStore.getState().start('sid', TEN);
    for (let i = 0; i < 10; i += 1) useSessionStore.getState().advance();

    const state = useSessionStore.getState();
    expect(isSessionComplete(state)).toBe(true);
    expect(currentSentence(state)).toBeUndefined();
  });

  it('never advances past the end', () => {
    useSessionStore.getState().start('sid', TEN);
    for (let i = 0; i < 20; i += 1) useSessionStore.getState().advance();
    expect(useSessionStore.getState().index).toBe(10);
  });

  it('replaces rather than appends when a sentence is re-answered', () => {
    const { start, record } = useSessionStore.getState();
    start('sid', TEN);

    record({ sentenceId: 's0', submittedOrder: [], verdict: 'falsch' });
    record({ sentenceId: 's0', submittedOrder: [], verdict: 'kanonisch' });

    const attempts = useSessionStore.getState().attempts;
    expect(attempts).toHaveLength(1);
    expect(attempts[0]?.verdict).toBe('kanonisch');
  });

  it('resumes at the first unanswered sentence', () => {
    useSessionStore.getState().resume('sid', TEN, [
      { sentenceId: 's0', submittedOrder: [], verdict: 'kanonisch' },
      { sentenceId: 's1', submittedOrder: [], verdict: 'falsch' },
      { sentenceId: 's2', submittedOrder: [], verdict: 'gueltig' },
    ]);

    const state = useSessionStore.getState();
    expect(state.index).toBe(3);
    expect(currentSentence(state)?.id).toBe('s3');
  });

  it('resumes a finished session as complete', () => {
    const attempts = TEN.map((s) => ({
      sentenceId: s.id,
      submittedOrder: [],
      verdict: 'kanonisch' as const,
    }));
    useSessionStore.getState().resume('sid', TEN, attempts);
    expect(isSessionComplete(useSessionStore.getState())).toBe(true);
  });

  it('is not complete before a session has started', () => {
    expect(isSessionComplete(useSessionStore.getState())).toBe(false);
  });
});

describe('correctCount', () => {
  it('counts all three accepted classes as correct', () => {
    // A learner reaching for a marked but grammatical order has not erred.
    expect(
      correctCount([
        { sentenceId: 'a', submittedOrder: [], verdict: 'kanonisch' },
        { sentenceId: 'b', submittedOrder: [], verdict: 'gueltig' },
        { sentenceId: 'c', submittedOrder: [], verdict: 'ungewoehnlich' },
        { sentenceId: 'd', submittedOrder: [], verdict: 'falsch' },
      ]),
    ).toBe(3);
  });
});

describe('newSessionId', () => {
  it('is unique across calls at the same instant', () => {
    const ids = new Set(Array.from({ length: 200 }, () => newSessionId(1)));
    expect(ids.size).toBeGreaterThan(190);
  });
});
