import { describe, expect, it } from 'vitest';

import { hashOrder } from './hash';

describe('hashOrder', () => {
  it('is stable for the same order', () => {
    expect(hashOrder(['ich', 'trinke', 'kaffee'])).toBe(
      hashOrder(['ich', 'trinke', 'kaffee']),
    );
  });

  it('distinguishes order', () => {
    expect(hashOrder(['a', 'b'])).not.toBe(hashOrder(['b', 'a']));
  });

  it('does not collide across chunk boundaries', () => {
    // The failure a naive join('') would produce.
    expect(hashOrder(['ab', 'c'])).not.toBe(hashOrder(['a', 'bc']));
  });

  it('is always eight hex characters', () => {
    for (const order of [['a'], ['a', 'b', 'c'], ['x'.repeat(40)]]) {
      expect(hashOrder(order)).toMatch(/^[0-9a-f]{8}$/);
    }
  });
});
