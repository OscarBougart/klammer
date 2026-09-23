/**
 * The shipped seed, typed.
 *
 * Importing seed.json directly gives whatever shape TypeScript infers from the
 * data that happens to be in it today — a sentence with no `matrix` makes
 * `matrix` not exist, and the app stops compiling the moment content changes.
 * The declared type is the contract; the JSON is data that must satisfy it.
 */
import raw from '../../content/generated/seed.json';

import type { AcceptedClass } from './schema';

export type SeedChunk = {
  id: string;
  surface: string;
  neutralSurface: string;
  role: string;
  definite?: boolean;
  stressable?: boolean;
};

export type SeedSentence = {
  id: string;
  tier: number;
  ruleId: string;
  gloss: string;
  /** Fixed scaffolding around a played subclause, e.g. "Sie sagt, …". */
  matrix?: string;
  chunks: SeedChunk[];
  canonical: string[];
  /** Order hash -> class. The whole of runtime validation. */
  acceptedHashes: Record<string, AcceptedClass>;
};

export type Seed = {
  seedVersion: number;
  hashVersion: number;
  sentences: SeedSentence[];
};

/**
 * Cast through `unknown` deliberately.
 *
 * TypeScript infers a distinct literal type per sentence — including an exact
 * union of every hash key in the file — so a direct `as Seed` stops overlapping
 * once the bank grows, and the app fails to compile because content was added.
 * The declared type is the contract; the JSON is data that must satisfy it, and
 * `content:verify` is what actually checks that.
 */
export const seed = raw as unknown as Seed;

export function sentenceById(id: string): SeedSentence | undefined {
  return seed.sentences.find((s) => s.id === id);
}

export function sentencesForTier(tier: number): SeedSentence[] {
  return seed.sentences.filter((s) => s.tier === tier);
}
