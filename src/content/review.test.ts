import { describe, expect, it } from 'vitest';

import {
  dueEntries,
  scheduleRight,
  scheduleWrong,
  SECONDS_PER_DAY,
} from './review';

const NOW = 1_700_000_000;

describe('scheduleWrong', () => {
  it('brings the sentence back tomorrow', () => {
    const entry = scheduleWrong('t1-01', NOW);
    expect(entry.stage).toBe(0);
    expect(entry.dueAt).toBe(NOW + SECONDS_PER_DAY);
  });

  it('resets a later stage rather than keeping its progress', () => {
    // Wrong at stage 2 means it was not learned. Pushing it ten days out on
    // the strength of one earlier lucky answer would lose it.
    const entry = scheduleWrong('t1-01', NOW);
    expect(entry.stage).toBe(0);
    expect(entry.dueAt).toBe(NOW + SECONDS_PER_DAY);
  });
});

describe('scheduleRight', () => {
  it('walks 1 → 3 → 10 days', () => {
    const first = { sentenceId: 't1-01', stage: 0, dueAt: NOW };

    const second = scheduleRight(first, NOW);
    expect(second?.stage).toBe(1);
    expect(second?.dueAt).toBe(NOW + 3 * SECONDS_PER_DAY);

    const third = scheduleRight(second!, NOW);
    expect(third?.stage).toBe(2);
    expect(third?.dueAt).toBe(NOW + 10 * SECONDS_PER_DAY);
  });

  it('leaves the queue after the last interval', () => {
    const last = { sentenceId: 't1-01', stage: 2, dueAt: NOW };
    expect(scheduleRight(last, NOW)).toBeNull();
  });
});

describe('dueEntries', () => {
  const entries = [
    { sentenceId: 'later', stage: 0, dueAt: NOW + 100 },
    { sentenceId: 'now', stage: 0, dueAt: NOW },
    { sentenceId: 'overdue', stage: 0, dueAt: NOW - 1000 },
  ];

  it('returns only what is due, soonest first', () => {
    expect(dueEntries(entries, NOW).map((e) => e.sentenceId)).toEqual([
      'overdue',
      'now',
    ]);
  });

  it('counts due-exactly-now as due', () => {
    expect(dueEntries([entries[1]!], NOW)).toHaveLength(1);
  });
});
