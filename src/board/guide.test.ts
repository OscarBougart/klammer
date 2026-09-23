import { describe, expect, it } from 'vitest';

import { guideLine, type GuideState } from './guide';

const start: GuideState = {
  guided: true,
  trayCount: 4,
  placedCount: 0,
  hasSelection: false,
  verbInPlace: false,
  frontFilled: false,
  verdict: null,
  isRetry: false,
};

describe('guideLine', () => {
  it('opens with how to place a tile, in both languages', () => {
    const line = guideLine(start);
    expect(line?.de).toMatch(/Baustein/);
    expect(line?.en).toMatch(/Tap a tile/);
  });

  it('follows a selection with where it can go', () => {
    expect(guideLine({ ...start, hasSelection: true })?.en).toMatch(/tap a field/);
  });

  it('points at position 2 until the verb is there', () => {
    const mid = { ...start, trayCount: 2, placedCount: 2 };
    expect(guideLine(mid)?.en).toMatch(/position 2/);
    expect(guideLine({ ...mid, verbInPlace: true })?.en).toMatch(/Now put exactly one part in front/);
    expect(guideLine({ ...mid, verbInPlace: true, frontFilled: true })?.en).toMatch(/Exactly one part/);
  });

  it('asks for the check once the tray is empty', () => {
    expect(guideLine({ ...start, trayCount: 0, placedCount: 4 })?.en).toMatch(/Prüfen/);
  });

  it('drops the teaching steps after the first sentence', () => {
    const mid = { ...start, guided: false, trayCount: 2, placedCount: 2 };
    expect(guideLine(mid)).toBeNull();
    expect(guideLine({ ...start, guided: false })?.en).toMatch(/Tap a tile/);
  });

  it('says a retry does not count, guided or not', () => {
    const checked = { ...start, trayCount: 0, placedCount: 4, verdict: 'kanonisch' as const };
    expect(guideLine({ ...checked, isRetry: true })?.en).toMatch(/first try counts/);
    expect(guideLine({ ...checked, guided: false, isRetry: true })?.en).toMatch(/first try/);
  });

  it('is quiet after an ordinary check once the guide is done', () => {
    const checked = { ...start, guided: false, trayCount: 0, placedCount: 4, verdict: 'falsch' as const };
    expect(guideLine(checked)).toBeNull();
  });
});
