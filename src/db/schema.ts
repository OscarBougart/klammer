/**
 * Klammer local database — E0.4.
 *
 * Everything here lives on the device and never leaves it. Data Safety
 * declares no data collected; keep that true.
 *
 * `sentences` is hydrated from content/generated/seed.json on first launch and
 * on every seed-version bump. Bumps migrate additively and never drop
 * progress, so `attempts`, `progress` and `review_queue` key on sentence id
 * and survive a hydration.
 */
import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * One authored sentence plus its frozen accepted set. Build output — the app
 * only ever reads this table after hydration.
 */
export const sentences = sqliteTable(
  'sentences',
  {
    /** Authored id, e.g. `t2-01`. Stable across seed versions. */
    id: text('id').primaryKey(),
    tier: integer('tier').notNull(),
    /** Rule this sentence exercises; keys the explanation strings. */
    ruleId: text('rule_id').notNull(),
    /** English gloss shown under the German. */
    gloss: text('gloss').notNull(),
    /** Fixed scaffolding shown around the played clause, e.g. "Sie sagt, …". */
    matrix: text('matrix'),
    /** Chunks as authored: id, surface, neutralSurface, role. JSON array. */
    chunks: text('chunks', { mode: 'json' })
      .notNull()
      .$type<SentenceChunk[]>(),
    /** The canonical chunk-id order. */
    canonical: text('canonical', { mode: 'json' }).notNull().$type<string[]>(),
    /**
     * Order hash -> verdict class, for every accepted arrangement. Runtime
     * validation is a membership test against this map and nothing else.
     */
    acceptedHashes: text('accepted_hashes', { mode: 'json' })
      .notNull()
      .$type<Record<string, AcceptedClass>>(),
    /** Seed version this row was hydrated from. */
    seedVersion: integer('seed_version').notNull(),
  },
  (t) => [index('sentences_tier_idx').on(t.tier)],
);

/** `kanonisch` | `gueltig` | `ungewoehnlich` — design.md §4. Never `falsch`. */
export type AcceptedClass = 'kanonisch' | 'gueltig' | 'ungewoehnlich';

export type SentenceChunk = {
  id: string;
  surface: string;
  neutralSurface: string;
  role: string;
};

/** Every Prüfen press. Drives the review queue and tier advancement. */
export const attempts = sqliteTable(
  'attempts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sentenceId: text('sentence_id')
      .notNull()
      .references(() => sentences.id),
    /** Session this attempt belongs to; a session is ten sentences. */
    sessionId: text('session_id').notNull(),
    /** The order the learner built, as chunk ids. */
    submittedOrder: text('submitted_order', { mode: 'json' })
      .notNull()
      .$type<string[]>(),
    /** One of AcceptedClass, or `falsch`. */
    verdict: text('verdict').notNull().$type<AcceptedClass | 'falsch'>(),
    createdAt: integer('created_at')
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index('attempts_session_idx').on(t.sessionId),
    index('attempts_sentence_idx').on(t.sentenceId),
  ],
);

/**
 * Single-row table. Tier state, streak, and the counters behind advancement
 * (8/10 canonical-or-valid across three consecutive sessions).
 */
export const progress = sqliteTable('progress', {
  id: integer('id').primaryKey(),
  tier: integer('tier').notNull().default(1),
  /** Session ids of the last three sessions, newest first. JSON array. */
  recentSessions: text('recent_sessions', { mode: 'json' })
    .notNull()
    .$type<string[]>()
    .default(sql`'[]'`),
  /** Consecutive days played. Two missed days reset it. */
  streakDays: integer('streak_days').notNull().default(0),
  /** Local date (YYYY-MM-DD) of the last completed session. */
  lastSessionDate: text('last_session_date'),
  /** Sessions completed today — two repairs a single missed day. */
  sessionsToday: integer('sessions_today').notNull().default(0),
  /** Seed version currently hydrated. */
  seedVersion: integer('seed_version').notNull().default(0),
});

/** SM-2-lite: a wrong sentence returns after 1, 3 and 10 days. */
export const reviewQueue = sqliteTable(
  'review_queue',
  {
    sentenceId: text('sentence_id')
      .primaryKey()
      .references(() => sentences.id),
    /** 0, 1, 2 — index into the 1 / 3 / 10 day schedule. */
    stage: integer('stage').notNull().default(0),
    /** Unix seconds; the sentence is eligible once this passes. */
    dueAt: integer('due_at').notNull(),
  },
  (t) => [index('review_queue_due_idx').on(t.dueAt)],
);
