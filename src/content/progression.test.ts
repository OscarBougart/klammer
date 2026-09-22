import { describe, expect, it } from 'vitest';

import {
  shouldAdvanceTier,
  streakStatus,
  weekStrip,
  MAX_TIER,
} from './progression';

describe('shouldAdvanceTier', () => {
  it('advances on three consecutive sessions at 8/10', () => {
    expect(shouldAdvanceTier(1, [8, 9, 10])).toBe(true);
  });

  it('does not advance on two good sessions', () => {
    expect(shouldAdvanceTier(1, [10, 10])).toBe(false);
  });

  it('requires the three most recent, not the best three', () => {
    // A weak session most recently means not yet, however good the older ones.
    expect(shouldAdvanceTier(1, [7, 10, 10, 10])).toBe(false);
  });

  it('ignores sessions older than the last three', () => {
    expect(shouldAdvanceTier(1, [8, 8, 8, 0, 0])).toBe(true);
  });

  it('stops at the last tier', () => {
    expect(shouldAdvanceTier(MAX_TIER, [10, 10, 10])).toBe(false);
  });
});

describe('weekStrip', () => {
  const today = '2026-06-10';
  const date = new Date(2026, 5, 10, 12);

  it('returns seven days ending today, left to right', () => {
    const strip = weekStrip(new Set(), today, date);
    expect(strip).toHaveLength(7);
    expect(strip[0]?.date).toBe('2026-06-04');
    expect(strip[6]?.date).toBe(today);
  });

  it('marks played days done', () => {
    const strip = weekStrip(new Set(['2026-06-08', '2026-06-09']), today, date);
    expect(strip.find((d) => d.date === '2026-06-08')?.state).toBe('done');
    expect(strip.find((d) => d.date === '2026-06-09')?.state).toBe('done');
  });

  it('leaves today pending rather than calling it missed', () => {
    // A day still in progress is not a failure.
    expect(weekStrip(new Set(), today, date)[6]?.state).toBe('today-pending');
  });

  it('marks today done once played', () => {
    expect(weekStrip(new Set([today]), today, date)[6]?.state).toBe('done');
  });

  it('reflects what was actually played, not a streak counter', () => {
    const strip = weekStrip(new Set(['2026-06-06']), today, date);
    expect(strip.filter((d) => d.state === 'done')).toHaveLength(1);
  });
});

describe('streakStatus', () => {
  const base = {
    streakDays: 5,
    sessionsToday: 0,
    today: '2026-06-10',
    yesterday: '2026-06-09',
    dayBeforeYesterday: '2026-06-08',
  };

  it('is intact when played today', () => {
    const s = streakStatus({ ...base, lastSessionDate: '2026-06-10' });
    expect(s.days).toBe(5);
    expect(s.repairable).toBe(false);
  });

  it('is intact when played yesterday and today is not over', () => {
    const s = streakStatus({ ...base, lastSessionDate: '2026-06-09' });
    expect(s.days).toBe(5);
  });

  it('offers repair after exactly one missed day', () => {
    const s = streakStatus({ ...base, lastSessionDate: '2026-06-08' });
    expect(s.repairable).toBe(true);
    expect(s.repairSessionsNeeded).toBe(2);
  });

  it('counts down the repair as sessions are done', () => {
    const s = streakStatus({
      ...base,
      lastSessionDate: '2026-06-08',
      sessionsToday: 1,
    });
    expect(s.repairSessionsNeeded).toBe(1);
  });

  it('resets after two missed days', () => {
    const s = streakStatus({ ...base, lastSessionDate: '2026-06-07' });
    expect(s.days).toBe(0);
    expect(s.repairable).toBe(false);
  });

  it('starts at zero for a new install', () => {
    const s = streakStatus({ ...base, streakDays: 0, lastSessionDate: null });
    expect(s.days).toBe(0);
  });
});
