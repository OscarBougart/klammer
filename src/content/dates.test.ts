import { describe, expect, it } from 'vitest';

import { localDate, previousDate } from './dates';

describe('localDate', () => {
  it('pads month and day', () => {
    expect(localDate(new Date(2026, 0, 5, 12))).toBe('2026-01-05');
  });

  it('uses the local calendar day, not UTC', () => {
    // Late evening local time — a UTC-based formatter could roll this over
    // to the next day and silently break the streak.
    const late = new Date(2026, 5, 10, 23, 50);
    expect(localDate(late)).toBe('2026-06-10');
  });
});

describe('previousDate', () => {
  it('steps back one day', () => {
    expect(previousDate(new Date(2026, 5, 10, 12))).toBe('2026-06-09');
  });

  it('rolls back across a month boundary', () => {
    expect(previousDate(new Date(2026, 6, 1, 12))).toBe('2026-06-30');
  });

  it('rolls back across a year boundary', () => {
    expect(previousDate(new Date(2026, 0, 1, 12))).toBe('2025-12-31');
  });

  it('handles a leap day', () => {
    expect(previousDate(new Date(2028, 2, 1, 12))).toBe('2028-02-29');
  });
});
