/**
 * Author review CLI — E1.5.
 *
 *   npm run content:review              sentences not yet reviewed
 *   npm run content:review -- --all     everything, including reviewed ones
 *   npm run content:review -- --id t2-01   one sentence
 *
 * design.md §4: "Every generated set is reviewed by a human before freezing.
 * The script prints the set; the author vetoes anything that reads badly.
 * Rules propose, the author disposes." This is that script.
 *
 * Decisions are written back into the authored YAML as `vetoed` and
 * `reviewed`, in place, preserving comments and alignment.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

import { load } from 'js-yaml';

import { generate } from '../src/content/generate';
import { applyDecisions } from '../src/content/patch-yaml';
import {
  assertAuthoredSentence,
  type AuthoredSentence,
} from '../src/content/schema';

const SENTENCES_DIR = join(__dirname, '..', 'content', 'sentences');

const CLASS_LABEL = {
  kanonisch: 'kanonisch     ',
  gueltig: 'auch richtig  ',
  ungewoehnlich: 'ungewöhnlich  ',
} as const;

type Located = { file: string; sentence: AuthoredSentence };

function loadAll(): Located[] {
  if (!existsSync(SENTENCES_DIR)) return [];

  const located: Located[] = [];

  for (const file of readdirSync(SENTENCES_DIR).filter((f) => /\.ya?ml$/.test(f)).sort()) {
    const parsed = load(readFileSync(join(SENTENCES_DIR, file), 'utf8'));
    for (const entry of Array.isArray(parsed) ? parsed : [parsed]) {
      assertAuthoredSentence(entry);
      located.push({ file, sentence: entry });
    }
  }

  return located;
}

/** Renders an order the way the learner will read it, not as chunk ids. */
function render(sentence: AuthoredSentence, order: string[]): string {
  const byId = new Map(sentence.chunks.map((c) => [c.id, c]));
  const words = order.map((id) => byId.get(id)?.neutralSurface ?? id);

  // The Vorfeld capitalises on placement, so show it capitalised — otherwise
  // the author is judging a sentence the player never sees.
  const first = words[0];
  if (first) words[0] = first.charAt(0).toUpperCase() + first.slice(1);

  return words.join(' ');
}

/**
 * A pull-based line reader.
 *
 * `rl.question` is not usable here: when stdin is a pipe rather than a
 * terminal, readline emits every `line` event as fast as it can read, before
 * a question has registered its one-shot handler — so the answers vanish and
 * the prompt hangs forever. Buffering the lines ourselves makes the CLI behave
 * identically whether a human is typing or a test is piping, which is the only
 * way this script is testable at all.
 */
class LineReader {
  private buffered: string[] = [];
  private waiting: ((line: string | undefined) => void)[] = [];
  private closed = false;

  constructor(rl: ReturnType<typeof createInterface>) {
    rl.on('line', (line: string) => {
      const next = this.waiting.shift();
      if (next) next(line);
      else this.buffered.push(line);
    });

    rl.on('close', () => {
      this.closed = true;
      // Anyone still waiting gets EOF rather than hanging.
      while (this.waiting.length > 0) this.waiting.shift()?.(undefined);
    });
  }

  /** Resolves to the next line, or undefined at end of input. */
  next(): Promise<string | undefined> {
    const buffered = this.buffered.shift();
    if (buffered !== undefined) return Promise.resolve(buffered);
    if (this.closed) return Promise.resolve(undefined);
    return new Promise((resolve) => this.waiting.push(resolve));
  }
}

/** Prompts and reads one answer. `undefined` means input ran out. */
async function ask(
  reader: LineReader,
  prompt: string,
): Promise<string | undefined> {
  process.stdout.write(prompt);
  const line = await reader.next();
  if (line === undefined) return undefined;
  return line.trim().toLowerCase();
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const idFlag = args.indexOf('--id');
  const onlyId = idFlag === -1 ? undefined : args[idFlag + 1];

  let located = loadAll();

  if (located.length === 0) {
    console.log('No sentences in content/sentences/ yet. Nothing to review.');
    return;
  }

  if (onlyId) {
    located = located.filter((l) => l.sentence.id === onlyId);
    if (located.length === 0) {
      console.error(`No sentence with id \`${onlyId}\`.`);
      process.exit(1);
    }
  } else if (!all) {
    located = located.filter((l) => l.sentence.reviewed !== true);
  }

  if (located.length === 0) {
    console.log('Every sentence has been reviewed. Pass --all to go again.');
    return;
  }

  const rl = createInterface({ input: process.stdin });
  const reader = new LineReader(rl);
  console.log(
    `\n${located.length} sentence(s) to review.\n` +
      `  enter = keep · v = veto · s = skip sentence · q = save and quit\n`,
  );

  let reviewed = 0;
  let vetoedTotal = 0;

  outer: for (const { file, sentence } of located) {
    const orders = generate(sentence);

    console.log(`\n${'─'.repeat(70)}`);
    console.log(`${sentence.id}  ·  tier ${sentence.tier}  ·  ${sentence.ruleId}`);
    console.log(`${sentence.gloss}`);
    if (sentence.matrix) console.log(`matrix: ${sentence.matrix}`);
    console.log(`${orders.length} generated order(s)\n`);

    const vetoed: string[][] = [];
    let skipped = false;

    for (const [i, order] of orders.entries()) {
      // The canonical order is the sentence as authored. Vetoing it would
      // leave the sentence with no neutral reading, so it is not offered.
      if (order.class === 'kanonisch') {
        console.log(`  ${String(i + 1).padStart(2)}. [${CLASS_LABEL.kanonisch}] ${render(sentence, order.order)}`);
        continue;
      }

      console.log(
        `  ${String(i + 1).padStart(2)}. [${CLASS_LABEL[order.class]}] ${render(sentence, order.order)}`,
      );
      if (order.reason) console.log(`      ${order.reason}`);

      const answer = await ask(reader, '      keep? [Enter/v/s/q] ');

      // Input ran out. Keep what is left rather than inventing vetoes, record
      // the decisions actually made, and stop.
      if (answer === undefined) {
        console.log('\n  (end of input)');
        await commit(file, sentence, vetoed, false);
        break outer;
      }

      if (answer === 'q') {
        await commit(file, sentence, vetoed, false);
        break outer;
      }
      if (answer === 's') {
        skipped = true;
        break;
      }
      if (answer === 'v') {
        vetoed.push(order.order);
        vetoedTotal += 1;
      }
    }

    if (skipped) {
      console.log('  skipped — not marked reviewed');
      continue;
    }

    await commit(file, sentence, vetoed, true);
    reviewed += 1;
    console.log(`  ✓ ${sentence.id} reviewed${vetoed.length ? `, ${vetoed.length} vetoed` : ''}`);
  }

  rl.close();

  console.log(
    `\n${reviewed} sentence(s) reviewed, ${vetoedTotal} order(s) vetoed.\n` +
      `Run \`npm run content:expand\` to rebuild the seed.`,
  );
}

/** Writes one sentence's decisions back into its file, in place. */
async function commit(
  file: string,
  sentence: AuthoredSentence,
  vetoed: string[][],
  reviewed: boolean,
): Promise<void> {
  if (vetoed.length === 0 && !reviewed) return;

  const path = join(SENTENCES_DIR, file);
  const document = readFileSync(path, 'utf8');

  // applyDecisions verifies its own output and throws rather than returning a
  // damaged document, so a failure here leaves the file untouched.
  writeFileSync(path, applyDecisions(document, sentence.id, { vetoed, reviewed }));
}

main().catch((error: unknown) => {
  console.error(`\n${String(error)}`);
  process.exit(1);
});
