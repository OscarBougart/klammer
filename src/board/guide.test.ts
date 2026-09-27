import { describe, expect, it } from 'vitest';

import { guideLine, type GuideState } from './guide';

const start: GuideState = {
  guided: true,
  bankCount: 4,
  lineCount: 0,
  verbSecond: false,
  verdict: null,
  isRetry: false,
};

describe('guideLine', () => {
  it('opens with what to do, in both languages', () => {
    const line = guideLine(start);
    expect(line?.de).toMatch(/Wörter/);
    expect(line?.en).toMatch(/Tap the words/);
  });

  it('shows how to take a word back after the first one', () => {
    expect(guideLine({ ...start, bankCount: 3, lineCount: 1 })?.en).toMatch(/send it back/);
  });

  it('points at position 2 until the verb is there', () => {
    const mid = { ...start, bankCount: 2, lineCount: 2 };
    expect(guideLine(mid)?.en).toMatch(/always goes in position 2/);
    expect(guideLine({ ...mid, verbSecond: true })?.en).toMatch(/Good, the verb/);
  });

  it('asks for the check once the bank is empty', () => {
    expect(guideLine({ ...start, bankCount: 0, lineCount: 4 })?.en).toMatch(/Prüfen/);
  });

  it('drops the teaching steps after the first sentence', () => {
    const mid = { ...start, guided: false, bankCount: 2, lineCount: 2 };
    expect(guideLine(mid)).toBeNull();
    expect(guideLine({ ...start, guided: false })?.en).toMatch(/Tap the words/);
  });

  it('says a retry does not count, guided or not', () => {
    const checked = { ...start, bankCount: 0, lineCount: 4, verdict: 'kanonisch' as const };
    expect(guideLine({ ...checked, isRetry: true })?.en).toMatch(/first try counts/);
    expect(guideLine({ ...checked, guided: false, isRetry: true })?.en).toMatch(/first try/);
  });

  it('is quiet after an ordinary check once the guide is done', () => {
    const checked = { ...start, guided: false, bankCount: 0, lineCount: 4, verdict: 'falsch' as const };
    expect(guideLine(checked)).toBeNull();
  });
});
