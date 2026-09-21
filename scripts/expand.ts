/**
 * content:expand / content:verify — E1.6.
 *
 * Reads the authored YAML, generates each sentence's accepted set, and writes
 * content/generated/seed.json. The app ships that file and does nothing at
 * runtime but hash the player's order and look it up.
 *
 *   npm run content:expand   rewrite the seed
 *   npm run content:verify   fail if the seed is stale, without touching it
 *
 * verify is the one that runs in CI. A stale seed means the YAML says one
 * thing and the shipped binary another, and the binary wins — which is how a
 * sentence someone fixed months ago goes on being taught wrong.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { load } from 'js-yaml';

import { generate } from '../src/content/generate';
import {
  assertAuthoredSentence,
  type AcceptedClass,
  type AuthoredSentence,
} from '../src/content/schema';
import { HASH_VERSION, hashOrder } from '../src/engine/hash';

const ROOT = join(__dirname, '..');
const SENTENCES_DIR = join(ROOT, 'content', 'sentences');
const SEED_PATH = join(ROOT, 'content', 'generated', 'seed.json');

/**
 * Bumped by hand when the shipped content changes meaningfully. Hydration
 * migrates additively on a bump and never drops progress.
 */
const SEED_VERSION = 1;

type SeedSentence = {
  id: string;
  tier: number;
  ruleId: string;
  gloss: string;
  matrix?: string;
  chunks: AuthoredSentence['chunks'];
  canonical: string[];
  /** order hash -> class. The whole of runtime validation. */
  acceptedHashes: Record<string, AcceptedClass>;
};

type Seed = {
  seedVersion: number;
  hashVersion: number;
  sentences: SeedSentence[];
};

function loadAuthored(): AuthoredSentence[] {
  if (!existsSync(SENTENCES_DIR)) return [];

  const files = readdirSync(SENTENCES_DIR)
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    .sort();

  const sentences: AuthoredSentence[] = [];
  const seenIds = new Set<string>();

  for (const file of files) {
    const parsed = load(readFileSync(join(SENTENCES_DIR, file), 'utf8'));
    const entries = Array.isArray(parsed) ? parsed : [parsed];

    for (const entry of entries) {
      assertAuthoredSentence(entry);

      // Ids key attempts and the review queue forever. A duplicate would make
      // two sentences share a learner's history.
      if (seenIds.has(entry.id)) {
        throw new Error(`duplicate sentence id \`${entry.id}\` (in ${file})`);
      }
      seenIds.add(entry.id);

      sentences.push(entry);
    }
  }

  return sentences;
}

function build(sentences: AuthoredSentence[]): Seed {
  const built = sentences.map((sentence): SeedSentence => {
    const orders = generate(sentence);
    const acceptedHashes: Record<string, AcceptedClass> = {};

    for (const { order, class: cls } of orders) {
      const hash = hashOrder(order);

      // Runtime cannot tell a collision from a correct answer, so the build
      // refuses to ship one. With a few hundred short orders per sentence this
      // should never fire; if it does, widen the hash rather than shrug.
      const existing = acceptedHashes[hash];
      if (existing !== undefined) {
        throw new Error(
          `[${sentence.id}] hash collision on ${hash} — two accepted orders share a hash`,
        );
      }

      acceptedHashes[hash] = cls;
    }

    const canonicalCount = orders.filter(
      (o) => o.class === 'kanonisch',
    ).length;
    if (canonicalCount !== 1) {
      throw new Error(
        `[${sentence.id}] expected exactly one kanonisch order, got ${canonicalCount}`,
      );
    }

    return {
      id: sentence.id,
      tier: sentence.tier,
      ruleId: sentence.ruleId,
      gloss: sentence.gloss,
      ...(sentence.matrix === undefined ? {} : { matrix: sentence.matrix }),
      chunks: sentence.chunks,
      canonical: sentence.canonical,
      acceptedHashes,
    };
  });

  return {
    seedVersion: SEED_VERSION,
    hashVersion: HASH_VERSION,
    sentences: built,
  };
}

function main(): void {
  const verifyOnly = process.argv.includes('--verify');

  const sentences = loadAuthored();
  if (sentences.length === 0) {
    console.log(
      `No sentences in content/sentences/ yet — nothing to expand. (E6 authors them.)`,
    );
  }

  const seed = build(sentences);
  const serialised = `${JSON.stringify(seed, null, 2)}\n`;

  if (verifyOnly) {
    if (!existsSync(SEED_PATH)) {
      console.error(
        `seed.json is missing. Run \`npm run content:expand\` and commit the result.`,
      );
      process.exit(1);
    }

    const onDisk = readFileSync(SEED_PATH, 'utf8');
    if (onDisk !== serialised) {
      console.error(
        `seed.json is stale — the YAML has changed since it was generated.\n` +
          `Run \`npm run content:expand\` and commit the result.`,
      );
      process.exit(1);
    }

    console.log(
      `seed.json is current — ${seed.sentences.length} sentence(s), hash v${HASH_VERSION}.`,
    );
    return;
  }

  mkdirSync(join(ROOT, 'content', 'generated'), { recursive: true });
  writeFileSync(SEED_PATH, serialised);

  const totalOrders = seed.sentences.reduce(
    (n, s) => n + Object.keys(s.acceptedHashes).length,
    0,
  );
  console.log(
    `Wrote content/generated/seed.json — ${seed.sentences.length} sentence(s), ` +
      `${totalOrders} accepted order(s), hash v${HASH_VERSION}.`,
  );
}

main();
