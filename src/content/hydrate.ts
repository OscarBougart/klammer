/**
 * Seed hydration — design.md §8.
 *
 * The bank ships as JSON in the binary and is hydrated into SQLite on first
 * launch and on every seed-version bump. "Bumping the seed version migrates
 * additively and never drops progress" is the load-bearing sentence: a learner
 * who has done four hundred sentences must not lose them because a typo was
 * fixed in sentence twelve.
 *
 * So hydration upserts sentence rows and touches nothing else. `attempts`,
 * `progress` and `review_queue` key on sentence id and survive untouched.
 */
import { sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { progress, sentences } from '@/db/schema';

import { seed } from './seed';

/**
 * Brings the sentence table up to date with the shipped seed.
 *
 * Returns the number of sentences written, or null when the seed was already
 * current and nothing needed doing.
 */
export async function hydrateIfNeeded(): Promise<number | null> {
  const [row] = await db.select().from(progress).limit(1);

  if (row && row.seedVersion === seed.seedVersion) return null;

  await db.transaction(async (tx) => {
    for (const sentence of seed.sentences) {
      // Upsert: a sentence that already exists is updated in place, keeping
      // its id — and therefore keeping every attempt and review that points
      // at it.
      await tx
        .insert(sentences)
        .values({
          id: sentence.id,
          tier: sentence.tier,
          ruleId: sentence.ruleId,
          gloss: sentence.gloss,
          matrix: sentence.matrix ?? null,
          chunks: sentence.chunks,
          canonical: sentence.canonical,
          acceptedHashes: sentence.acceptedHashes,
          seedVersion: seed.seedVersion,
        })
        .onConflictDoUpdate({
          target: sentences.id,
          set: {
            tier: sentence.tier,
            ruleId: sentence.ruleId,
            gloss: sentence.gloss,
            matrix: sentence.matrix ?? null,
            chunks: sentence.chunks,
            canonical: sentence.canonical,
            acceptedHashes: sentence.acceptedHashes,
            seedVersion: seed.seedVersion,
          },
        });
    }

    // Deliberately no delete pass. A sentence dropped from the seed keeps its
    // row, because its attempts still reference it and a learner's history
    // should not develop holes. Selection only ever offers what the seed
    // knows about, so a retired sentence simply stops appearing.

    if (row) {
      await tx
        .update(progress)
        .set({ seedVersion: seed.seedVersion })
        .where(sql`${progress.id} = ${row.id}`);
    } else {
      await tx.insert(progress).values({
        id: 1,
        tier: 1,
        recentSessions: [],
        streakDays: 0,
        sessionsToday: 0,
        seedVersion: seed.seedVersion,
      });
    }
  });

  return seed.sentences.length;
}
