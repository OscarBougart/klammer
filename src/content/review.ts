/**
 * The review queue — E4.5.
 *
 * design.md §7: sentences answered wrong return after 1, 3 and 10 days.
 * SM-2-lite; no need for full spaced repetition here, because the bank is
 * curated and finite and the thing being learned is a rule rather than a fact.
 *
 * Pure functions over an explicit clock. Nothing here reads `Date.now()` on
 * its own — a scheduler that cannot be tested at an arbitrary date is a
 * scheduler that gets tested in production, on a learner's streak.
 */

/** Days until a sentence returns, by stage. design.md §7. */
export const REVIEW_INTERVALS_DAYS = [1, 3, 10] as const;

export const SECONDS_PER_DAY = 24 * 60 * 60;

export type ReviewEntry = {
  sentenceId: string;
  /** Index into REVIEW_INTERVALS_DAYS. */
  stage: number;
  /** Unix seconds. Eligible once this has passed. */
  dueAt: number;
};

/**
 * Schedules a sentence answered wrong.
 *
 * A wrong answer always resets to the first interval, whatever stage the
 * sentence had reached. Getting it wrong at stage 2 means it was not learned,
 * and pretending otherwise would push it ten days out on the strength of one
 * lucky earlier answer.
 */
export function scheduleWrong(
  sentenceId: string,
  now: number,
): ReviewEntry {
  const days = REVIEW_INTERVALS_DAYS[0];
  return {
    sentenceId,
    stage: 0,
    dueAt: now + days * SECONDS_PER_DAY,
  };
}

/**
 * Advances a sentence answered right.
 *
 * Returns null once it has passed the last interval — at that point the
 * sentence leaves the queue and goes back to the ordinary bank.
 */
export function scheduleRight(
  existing: ReviewEntry,
  now: number,
): ReviewEntry | null {
  const nextStage = existing.stage + 1;
  const days = REVIEW_INTERVALS_DAYS[nextStage];

  if (days === undefined) return null;

  return {
    sentenceId: existing.sentenceId,
    stage: nextStage,
    dueAt: now + days * SECONDS_PER_DAY,
  };
}

/** Entries that are due, soonest first. */
export function dueEntries(
  entries: readonly ReviewEntry[],
  now: number,
): ReviewEntry[] {
  return entries
    .filter((entry) => entry.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt);
}
