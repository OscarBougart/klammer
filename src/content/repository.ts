/**
 * Everything that reads or writes the device database — E4.4 / E4.5.
 *
 * Kept in one place so the screens never hold a query. The scheduling and
 * selection rules live in review.ts and selection.ts as pure functions; this
 * module is only the plumbing that feeds them and stores the results.
 *
 * Nothing here leaves the device. Data Safety declares no data collected.
 */
import { and, desc, eq, inArray } from 'drizzle-orm';

import { db } from '@/db/client';
import { attempts, progress, reviewQueue, sentences } from '@/db/schema';
import type { Verdict } from '@/engine/validate';

import { localDate } from './dates';
import { shouldAdvanceTier } from './progression';
import { scheduleRight, scheduleWrong, type ReviewEntry } from './review';
import type { SeedSentence } from './seed';

/** The single progress row, created on first hydration. */
export async function loadProgress() {
  const [row] = await db.select().from(progress).limit(1);
  return row;
}

export async function loadReviewQueue(): Promise<ReviewEntry[]> {
  const rows = await db.select().from(reviewQueue);
  return rows.map((row) => ({
    sentenceId: row.sentenceId,
    stage: row.stage,
    dueAt: row.dueAt,
  }));
}

/** Sentence ids the learner has ever answered correctly. */
export async function loadSeenIds(): Promise<Set<string>> {
  const rows = await db
    .select({ sentenceId: attempts.sentenceId, verdict: attempts.verdict })
    .from(attempts);

  const seen = new Set<string>();
  for (const row of rows) {
    if (row.verdict !== 'falsch') seen.add(row.sentenceId);
  }
  return seen;
}

/**
 * Records one answer and updates the review queue in the same transaction.
 *
 * The two must move together: an attempt saved without its review update
 * would quietly drop a sentence out of the rotation, which is the failure a
 * learner would never notice and never recover from.
 */
export async function recordAttempt(params: {
  sessionId: string;
  sentenceId: string;
  submittedOrder: string[];
  verdict: Verdict;
  now: number;
}): Promise<void> {
  const { sessionId, sentenceId, submittedOrder, verdict, now } = params;

  await db.transaction(async (tx) => {
    await tx.insert(attempts).values({
      sessionId,
      sentenceId,
      submittedOrder,
      verdict,
      createdAt: now,
    });

    const [existing] = await tx
      .select()
      .from(reviewQueue)
      .where(eq(reviewQueue.sentenceId, sentenceId))
      .limit(1);

    if (verdict === 'falsch') {
      const entry = scheduleWrong(sentenceId, now);
      await tx
        .insert(reviewQueue)
        .values(entry)
        .onConflictDoUpdate({
          target: reviewQueue.sentenceId,
          set: { stage: entry.stage, dueAt: entry.dueAt },
        });
      return;
    }

    // Right, and not in the queue: nothing to do. It was never wrong.
    if (!existing) return;

    const next = scheduleRight(
      { sentenceId, stage: existing.stage, dueAt: existing.dueAt },
      now,
    );

    if (!next) {
      // Past the last interval — it leaves the queue and rejoins the bank.
      await tx.delete(reviewQueue).where(eq(reviewQueue.sentenceId, sentenceId));
      return;
    }

    await tx
      .update(reviewQueue)
      .set({ stage: next.stage, dueAt: next.dueAt })
      .where(eq(reviewQueue.sentenceId, sentenceId));
  });
}

export type StoredAttempt = {
  sentenceId: string;
  sessionId: string;
  submittedOrder: string[];
  verdict: Verdict;
};

/** The attempts belonging to one session, in the order they were made. */
export async function loadSessionAttempts(
  sessionId: string,
): Promise<StoredAttempt[]> {
  const rows = await db
    .select()
    .from(attempts)
    .where(eq(attempts.sessionId, sessionId));

  return rows.map((row) => ({
    sentenceId: row.sentenceId,
    sessionId: row.sessionId,
    submittedOrder: row.submittedOrder,
    verdict: row.verdict,
  }));
}

/**
 * The most recent session, if it was left unfinished — E4.6.
 *
 * A session is unfinished when it has fewer attempts than it had sentences.
 * The sentence list is not stored separately; it is recovered from the
 * attempts plus the selection that produced them, so an interrupted session
 * resumes with the same ten sentences it started with.
 */
export async function loadUnfinishedSessionId(
  sessionLength: number,
): Promise<string | null> {
  const [latest] = await db
    .select({ sessionId: attempts.sessionId })
    .from(attempts)
    .orderBy(desc(attempts.createdAt))
    .limit(1);

  if (!latest) return null;

  const rows = await loadSessionAttempts(latest.sessionId);
  return rows.length < sessionLength ? latest.sessionId : null;
}

/** Hydrated sentence rows for a set of ids, as the board needs them. */
export async function loadSentences(ids: string[]): Promise<SeedSentence[]> {
  if (ids.length === 0) return [];

  const rows = await db
    .select()
    .from(sentences)
    .where(inArray(sentences.id, ids));

  return rows.map((row) => ({
    id: row.id,
    tier: row.tier,
    ruleId: row.ruleId,
    gloss: row.gloss,
    ...(row.matrix ? { matrix: row.matrix } : {}),
    chunks: row.chunks,
    canonical: row.canonical,
    acceptedHashes: row.acceptedHashes,
  }));
}

/**
 * Records that a session finished, for the streak and for tier advancement.
 *
 * design.md §7: a seven-day strip, one missed day greys out, two missed days
 * reset, and a missed day can be repaired by doing two sessions the next day.
 * The repair rule is why `sessionsToday` is counted rather than merely
 * flagged.
 */
export async function completeSession(params: {
  sessionId: string;
  /** Local calendar date, YYYY-MM-DD. */
  today: string;
  /** Yesterday's date, for the streak-continuation check. */
  yesterday: string;
}): Promise<void> {
  const { sessionId, today, yesterday } = params;

  const row = await loadProgress();
  if (!row) return;

  const sameDay = row.lastSessionDate === today;
  const continued = row.lastSessionDate === yesterday;

  const sessionsToday = sameDay ? row.sessionsToday + 1 : 1;

  // A second session on the day after a single missed day repairs the streak
  // rather than restarting it.
  const repaired = !sameDay && !continued && sessionsToday >= 2;

  const streakDays = sameDay
    ? row.streakDays
    : continued || repaired
      ? row.streakDays + 1
      : 1;

  const recent = [sessionId, ...row.recentSessions].slice(0, 3);

  await db
    .update(progress)
    .set({
      lastSessionDate: today,
      sessionsToday,
      streakDays,
      recentSessions: recent,
    })
    .where(eq(progress.id, row.id));
}

/**
 * Advances the tier if the last three sessions earned it — E5.1.
 *
 * Returns the new tier when it changed, so the caller can show the
 * zone-unlock moment, or null when nothing happened.
 */
export async function advanceTierIfEarned(): Promise<number | null> {
  const row = await loadProgress();
  if (!row) return null;

  const attemptsBySession = await loadRecentSessionAttempts(row.recentSessions);

  // recentSessions is newest-first, and shouldAdvanceTier expects the same.
  const correctPerSession = row.recentSessions.map((sessionId) => {
    const forSession = attemptsBySession.filter((a) => a.sessionId === sessionId);
    return forSession.filter((a) => a.verdict !== 'falsch').length;
  });

  if (!shouldAdvanceTier(row.tier, correctPerSession)) return null;

  const nextTier = row.tier + 1;

  await db
    .update(progress)
    .set({
      tier: nextTier,
      // The three qualifying sessions are spent. Without this the learner
      // would advance again on the very next session, skipping a whole tier
      // on the strength of one good run.
      recentSessions: [],
    })
    .where(eq(progress.id, row.id));

  return nextTier;
}

/**
 * The local dates on which a session was completed, for the week strip.
 *
 * Derived from attempts rather than from the streak counter: the strip should
 * show what the learner actually did, not what a counter believes.
 */
export async function loadPlayedDates(): Promise<Set<string>> {
  const rows = await db
    .select({ createdAt: attempts.createdAt })
    .from(attempts);

  const dates = new Set<string>();
  for (const row of rows) {
    dates.add(localDate(new Date(row.createdAt * 1000)));
  }
  return dates;
}

/** Attempts for the three most recent sessions, for tier advancement. */
export async function loadRecentSessionAttempts(
  sessionIds: string[],
): Promise<StoredAttempt[]> {
  if (sessionIds.length === 0) return [];

  const rows = await db
    .select()
    .from(attempts)
    .where(and(inArray(attempts.sessionId, sessionIds)));

  return rows.map((row) => ({
    sentenceId: row.sentenceId,
    sessionId: row.sessionId,
    submittedOrder: row.submittedOrder,
    verdict: row.verdict,
  }));
}
