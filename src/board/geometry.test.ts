import { describe, expect, it } from 'vitest';

import { insertionIndex, type Rect } from './geometry';

const rect = (x: number, y: number, w = 100, h = 40): Rect => ({
  x,
  y,
  width: w,
  height: h,
});

describe('insertionIndex', () => {
  // Two tiles side by side in one row.
  const rects = {
    morgens: rect(0, 0),
    kaffee: rect(110, 0),
  };
  const order = ['morgens', 'kaffee'];

  it('inserts at the front when dropped left of the first tile', () => {
    expect(insertionIndex(order, rects, 10, 20, 'ich')).toBe(0);
  });

  it('inserts between when dropped past the first centre', () => {
    expect(insertionIndex(order, rects, 80, 20, 'ich')).toBe(1);
  });

  it('appends when dropped past the last tile', () => {
    expect(insertionIndex(order, rects, 200, 20, 'ich')).toBe(2);
  });

  it('ignores the tile being dragged so it does not displace itself', () => {
    // Dragging `kaffee` to the front: `kaffee`'s own rect must not count.
    expect(insertionIndex(order, rects, 10, 20, 'kaffee')).toBe(0);
  });

  it('treats a later row as past every tile above it', () => {
    const wrapped = {
      morgens: rect(0, 0),
      kaffee: rect(110, 0),
      bahnhof: rect(0, 50),
    };
    expect(
      insertionIndex(['morgens', 'kaffee', 'bahnhof'], wrapped, 10, 60, 'x'),
    ).toBe(2);
  });

  it('returns 0 for an empty zone', () => {
    expect(insertionIndex([], {}, 10, 10, 'x')).toBe(0);
  });

  it('skips tiles it has no rect for rather than miscounting', () => {
    expect(insertionIndex(['ghost', 'kaffee'], rects, 200, 20, 'x')).toBe(1);
  });
});
