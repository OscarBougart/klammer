/**
 * Choosing the ten sentences for a session — E4.1.
 *
 * design.md §7: a session is ten sentences, fixed. Selection is weighted by
 * tier and by the review queue — due reviews come first, then unseen sentences
 * at the learner's tier, then whatever else fits.
 *
 * Pure and deterministic given its inputs, including the shuffle, so a session
 * can be reproduced in a test rather than observed and hoped about.
 */
import type { SeedSentence } from './seed';
import { dueEntries, type ReviewEntry } from './review';

export const SESSION_LENGTH = 10;

export type SelectionInput = {
  /** Everything in the bank. */
  sentences: readonly SeedSentence[];
  /** The learner's current tier. */
  tier: number;
  /** The review queue. */
  reviews: readonly ReviewEntry[];
  /** Sentence ids already answered correctly at least once. */
  seen: ReadonlySet<string>;
  /** Unix seconds. */
  now: number;
  /** Injected so sessions are reproducible in tests. */
  shuffle?: <T>(values: readonly T[]) => T[];
};

/**
 * Returns up to SESSION_LENGTH sentences, in the order they will be played.
 *
 * Fewer than ten is possible and is not an error: a new install at tier 1 with
 * a small bank, or a learner who has exhausted their tier, should still get a
 * session. E7.4 handles what the screen says about it.
 */
export function selectSession(input: SelectionInput): SeedSentence[] {
  const { sentences, tier, reviews, seen, now } = input;
  const shuffle = input.shuffle ?? identity;

  const byId = new Map(sentences.map((s) => [s.id, s]));
  const chosen: SeedSentence[] = [];
  const taken = new Set<string>();

  const take = (sentence: SeedSentence | undefined) => {
    if (!sentence) return;
    if (taken.has(sentence.id)) return;
    if (chosen.length >= SESSION_LENGTH) return;
    chosen.push(sentence);
    taken.add(sentence.id);
  };

  // 1. Due reviews, soonest first. These are sentences the learner got wrong,
  //    and the whole point of the queue is that they come back.
  for (const entry of dueEntries(reviews, now)) {
    take(byId.get(entry.sentenceId));
  }

  // 2. Unseen sentences at the current tier — the new material.
  const atTier = sentences.filter((s) => s.tier === tier);
  for (const sentence of shuffle(atTier.filter((s) => !seen.has(s.id)))) {
    take(sentence);
  }

  // 3. Seen sentences at the current tier, to fill out the session.
  for (const sentence of shuffle(atTier.filter((s) => seen.has(s.id)))) {
    take(sentence);
  }

  // 4. Still short: fall back to earlier tiers. Practising a tier you have
  //    passed is harmless; being handed a tier you have not reached is not,
  //    so this never reaches upward.
  const below = sentences.filter((s) => s.tier < tier);
  for (const sentence of shuffle(below)) {
    take(sentence);
  }

  return chosen;
}

function identity<T>(values: readonly T[]): T[] {
  return [...values];
}
