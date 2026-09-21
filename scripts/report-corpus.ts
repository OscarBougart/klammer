/**
 * Prints what the generator produces for the corpus beyond what the corpus
 * enumerates. Not a test — an author's worksheet.
 *
 * The corpus says what MUST be produced and what MUST NOT be. Anything else is
 * the generator's opinion, and design.md §4 is explicit that opinions get
 * vetoed by a human before a set freezes. This is how you read them.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { load } from 'js-yaml';

import { generate } from '../src/content/generate';
import { assertAuthoredSentence } from '../src/content/schema';

type CorpusEntry = {
  id: string;
  gloss: string;
  chunks: Record<string, { surface: string; neutral: string; role: string }>;
  extraAccepted?: { order: string[]; class: string }[];
  accept: string[][];
  reject: string[][];
};

const corpus = load(
  readFileSync(join(__dirname, '__fixtures__', 'corpus.yaml'), 'utf8'),
) as CorpusEntry[];

let extras = 0;

for (const entry of corpus) {
  const canonicalRow = entry.accept.find((r) => r[0] === 'k')!;

  const sentence = {
    id: entry.id,
    tier: 1 as const,
    ruleId: 'x',
    gloss: entry.gloss,
    chunks: Object.entries(entry.chunks).map(([id, c]) => ({
      id,
      surface: c.surface,
      neutralSurface: c.neutral,
      role: c.role,
      ...(c as { definite?: boolean }).definite === undefined
        ? {}
        : { definite: (c as { definite?: boolean }).definite },
      ...(c as { stressable?: boolean }).stressable === undefined
        ? {}
        : { stressable: (c as { stressable?: boolean }).stressable },
    })),
    canonical: canonicalRow.slice(1),
    ...(entry.extraAccepted ? { extraAccepted: entry.extraAccepted } : {}),
  };

  assertAuthoredSentence(sentence);

  const enumerated = new Set(entry.accept.map((r) => r.slice(1).join(' ')));
  const generated = generate(sentence);
  const surprises = generated.filter((g) => !enumerated.has(g.order.join(' ')));

  const render = (ids: string[]) =>
    ids.map((id) => entry.chunks[id]?.neutral ?? id).join(' ');

  console.log(`\n${entry.id}  ${entry.gloss}`);
  console.log(`  corpus enumerates ${enumerated.size}, generator makes ${generated.length}`);

  for (const s of surprises) {
    extras += 1;
    console.log(`  + [${s.class}] ${render(s.order)}`);
    console.log(`      ${s.reason}`);
  }
}

console.log(`\n${extras} order(s) beyond the corpus — each needs an author's eye.`);
