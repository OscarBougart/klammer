/**
 * Order hashing — E1.6.
 *
 * Runtime validation is `hash(userOrder) ∈ sentence.acceptedHashes` and
 * nothing else. That makes this function load-bearing in a way its size hides:
 * the build script and the app must agree on it exactly and forever. A change
 * here invalidates every seed ever shipped, so it is versioned, and
 * content:verify compares versions before it compares hashes.
 *
 * The hash is over chunk *ids*, never surfaces — surfaces get edited for typos
 * and that must not invalidate a frozen accepted set.
 */

/** Bump only with a seed regeneration. See the note above. */
export const HASH_VERSION = 1;

/**
 * FNV-1a, 32-bit, hex. Not cryptographic and does not need to be: the input
 * space is the permutations of at most a dozen short ids, the set is at most a
 * few hundred entries, and the whole thing is local. Collisions are the only
 * risk and expand.ts asserts against them per sentence at build time.
 */
export function hashOrder(order: readonly string[]): string {
  let h = 0x811c9dc5;

  // The separator matters: without it ['ab','c'] and ['a','bc'] collide.
  const input = order.join('\u0000');

  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    // 32-bit FNV prime multiply, kept in range with Math.imul.
    h = Math.imul(h, 0x01000193);
  }

  // >>> 0 forces the unsigned reading; without it negative values format short.
  return (h >>> 0).toString(16).padStart(8, '0');
}
