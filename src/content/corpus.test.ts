/**
 * E1.7 — the acceptance gate for the whole content epic.
 *
 * The corpus is hand-written expected output. Two obligations, and they are
 * not symmetric:
 *
 *   accept — every listed order MUST be produced, with the listed class. A
 *            miss means a learner is told correct German is wrong.
 *   reject — no listed order may be produced at any class. A hit means the
 *            app teaches wrong German, which is the one failure this project
 *            cannot absorb.
 *
 * Over-generation beyond the accept list is reported but not failed: the
 * corpus says what MUST appear, and German genuinely licenses orders an
 * author did not bother to enumerate. The extras are printed so a human can
 * veto them, which is the review step design.md §4 requires.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';

import { generate } from './generate';
import { assertAuthoredSentence, type AuthoredSentence } from './schema';

const CORPUS_PATH = join(
  __dirname,
  '..',
  '..',
  'scripts',
  '__fixtures__',
  'corpus.yaml',
);

/** Short class codes as the corpus writes them. */
const CLASS_CODE = {
  k: 'kanonisch',
  g: 'gueltig',
  u: 'ungewoehnlich',
} as const;

type CorpusEntry = {
  id: string;
  tier: number;
  rule: string;
  gloss: string;
  matrix?: string;
  chunks: Record<
    string,
    {
      surface: string;
      neutral: string;
      role: string;
      definite?: boolean;
      stressable?: boolean;
    }
  >;
  extraAccepted?: { order: string[]; class: string }[];
  accept: string[][];
  reject: string[][];
};

const corpus = load(readFileSync(CORPUS_PATH, 'utf8')) as CorpusEntry[];

/**
 * The corpus writes chunks as a mapping and orders as bare id lists; the
 * authored schema wants a list of chunks and an explicit canonical. The first
 * `accept` row marked `k` is the canonical order.
 */
function toAuthored(entry: CorpusEntry): AuthoredSentence {
  const canonicalRow = entry.accept.find((row) => row[0] === 'k');
  if (!canonicalRow) {
    throw new Error(`[${entry.id}] corpus entry has no canonical (k) row`);
  }

  const sentence = {
    id: entry.id,
    tier: entry.tier,
    ruleId: entry.rule,
    gloss: entry.gloss,
    ...(entry.matrix === undefined ? {} : { matrix: entry.matrix }),
    chunks: Object.entries(entry.chunks).map(([id, c]) => ({
      id,
      surface: c.surface,
      neutralSurface: c.neutral,
      role: c.role,
      ...(c.definite === undefined ? {} : { definite: c.definite }),
      ...(c.stressable === undefined ? {} : { stressable: c.stressable }),
    })),
    canonical: canonicalRow.slice(1),
    ...(entry.extraAccepted === undefined
      ? {}
      : { extraAccepted: entry.extraAccepted }),
  };

  assertAuthoredSentence(sentence);
  return sentence;
}

describe('E1.7 acceptance corpus', () => {
  it('parses and validates every entry against the authored schema', () => {
    expect(corpus.length).toBeGreaterThan(0);
    for (const entry of corpus) {
      expect(() => toAuthored(entry), entry.id).not.toThrow();
    }
  });

  describe.each(corpus.map((e) => [e.id, e] as const))('%s', (_id, entry) => {
    const sentence = toAuthored(entry);
    const generated = generate(sentence);
    const byOrder = new Map(generated.map((g) => [g.order.join(' '), g]));

    it.each(entry.accept.map((row) => [row.join(' '), row] as const))(
      'accepts %s',
      (_label, row) => {
        const expectedClass = CLASS_CODE[row[0] as keyof typeof CLASS_CODE];
        const key = row.slice(1).join(' ');
        const hit = byOrder.get(key);

        expect(
          hit,
          `not generated — a valid order the learner would be told is wrong.\n` +
            `  wanted: ${key}\n` +
            `  got:\n${[...byOrder.keys()].map((k) => `    ${k}`).join('\n')}`,
        ).toBeDefined();

        expect(hit?.class, `wrong class for ${key}`).toBe(expectedClass);
      },
    );

    it.each(entry.reject.map((row) => [row.join(' '), row] as const))(
      'rejects %s',
      (_label, row) => {
        const key = row.join(' ');
        const hit = byOrder.get(key);

        expect(
          hit,
          `GENERATED UNGRAMMATICAL ORDER — this would teach wrong German.\n` +
            `  order: ${key}\n` +
            `  class: ${hit?.class}\n` +
            `  because: ${hit?.reason}`,
        ).toBeUndefined();
      },
    );
  });
});
