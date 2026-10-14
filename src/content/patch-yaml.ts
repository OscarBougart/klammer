/**
 * Writing author decisions back into the authored YAML — E1.5.
 *
 * The YAML is hand-edited source of truth: comments explaining why a sentence
 * exists, alignment that makes a chunk table readable, grouping by tier. A
 * load-and-dump round trip through js-yaml would silently destroy all of it
 * and reformat every line, which after E6 is weeks of work.
 *
 * So this patches text surgically: it finds the one sentence block, replaces
 * or appends the two keys it owns, and leaves every other byte alone. The
 * caller is expected to verify the result re-parses to what it expects —
 * `applyDecisions` does that check itself and refuses to return a corrupted
 * document.
 */
import { load } from 'js-yaml';

/** The keys this module owns. Nothing else in a sentence block is touched. */
const OWNED_KEYS = ['vetoed', 'reviewed'] as const;

export type Decisions = {
  /** Orders the author struck out, as chunk-id lists. */
  vetoed: string[][];
  /** Whether the sentence has been through review. */
  reviewed: boolean;
};

export class PatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PatchError';
  }
}

/**
 * Returns the document with `sentenceId`'s decisions rewritten.
 *
 * Throws rather than returning a best effort: a half-applied patch to the
 * content source is worse than no patch at all.
 */
export function applyDecisions(
  document: string,
  sentenceId: string,
  decisions: Decisions,
): string {
  const lines = document.split('\n');
  const block = findSentenceBlock(lines, sentenceId);

  const kept = lines
    .slice(block.start, block.end)
    .filter((_, i) => !block.ownedLineOffsets.has(i));

  // Trailing blank lines belong to the gap between sentences, not to this
  // sentence — keep the new keys above them so blocks stay visually separated.
  let tail = kept.length;
  while (tail > 0 && (kept[tail - 1] ?? '').trim() === '') tail -= 1;

  const patched = [
    ...kept.slice(0, tail),
    ...renderDecisions(decisions, block.indent),
    ...kept.slice(tail),
  ];

  const result = [
    ...lines.slice(0, block.start),
    ...patched,
    ...lines.slice(block.end),
  ].join('\n');

  verify(result, document, sentenceId, decisions);

  return result;
}

function renderDecisions(decisions: Decisions, indent: string): string[] {
  const out: string[] = [];

  if (decisions.vetoed.length > 0) {
    out.push(`${indent}# Orders the author struck out during review.`);
    out.push(`${indent}vetoed:`);
    for (const order of decisions.vetoed) {
      out.push(`${indent}  - [${order.join(', ')}]`);
    }
  }

  if (decisions.reviewed) {
    out.push(`${indent}reviewed: true`);
  }

  return out;
}

type SentenceBlock = {
  /** Index of the `- id: …` line. */
  start: number;
  /** Index one past the block's last line. */
  end: number;
  /** Indentation of the block's keys, e.g. two spaces. */
  indent: string;
  /** Offsets within the block, relative to `start`, that this module owns. */
  ownedLineOffsets: Set<number>;
};

function findSentenceBlock(lines: string[], sentenceId: string): SentenceBlock {
  const startPattern = new RegExp(`^-\\s+id:\\s*["']?${escapeRegex(sentenceId)}["']?\\s*$`);

  let start = -1;
  for (const [i, line] of lines.entries()) {
    if (startPattern.test(line ?? '')) {
      if (start !== -1) {
        throw new PatchError(`sentence \`${sentenceId}\` appears more than once`);
      }
      start = i;
    }
  }

  if (start === -1) {
    throw new PatchError(`sentence \`${sentenceId}\` not found in this document`);
  }

  // The block runs to the next top-level list item, or to the end of file.
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^-\s/.test(lines[i] ?? '')) {
      end = i;
      break;
    }
  }

  const indent = detectIndent(lines, start, end);
  const ownedLineOffsets = findOwnedLines(lines, start, end, indent);

  return { start, end, indent, ownedLineOffsets };
}

/** The indentation the block's own keys sit at. */
function detectIndent(lines: string[], start: number, end: number): string {
  for (let i = start + 1; i < end; i += 1) {
    const match = /^(\s+)\S/.exec(lines[i] ?? '');
    if (match?.[1]) return match[1];
  }
  // A one-line block: `- id: x` puts keys two columns in, under the `id`.
  return '  ';
}

/**
 * Lines belonging to keys this module owns — the key line, its comment, and
 * any continuation lines indented beneath it.
 */
function findOwnedLines(
  lines: string[],
  start: number,
  end: number,
  indent: string,
): Set<number> {
  const owned = new Set<number>();

  for (let i = start + 1; i < end; i += 1) {
    const line = lines[i] ?? '';
    const match = new RegExp(`^${indent}([A-Za-z_][A-Za-z0-9_]*):`).exec(line);
    if (!match) continue;
    if (!OWNED_KEYS.includes(match[1] as (typeof OWNED_KEYS)[number])) continue;

    // A comment immediately above the key was written by renderDecisions.
    let from = i;
    while (
      from - 1 > start &&
      (lines[from - 1] ?? '').trim().startsWith('#') &&
      (lines[from - 1] ?? '').startsWith(indent)
    ) {
      from -= 1;
    }
    // Offsets are relative to the block start — that is what the caller
    // slices against.
    for (let j = from; j <= i; j += 1) owned.add(j - start);

    // Continuation lines are indented deeper than the key.
    for (let j = i + 1; j < end; j += 1) {
      const next = lines[j] ?? '';
      if (next.trim() === '') break;
      if (!next.startsWith(`${indent} `) && !next.startsWith(`${indent}\t`)) break;
      owned.add(j - start);
    }
  }

  return owned;
}

/**
 * Re-parses both documents and asserts the patch changed exactly one
 * sentence's owned keys and nothing else. This is the guard that makes
 * textual surgery on the content source acceptable.
 */
function verify(
  result: string,
  original: string,
  sentenceId: string,
  decisions: Decisions,
): void {
  let after: unknown;
  try {
    after = load(result);
  } catch (error) {
    throw new PatchError(
      `patch produced invalid YAML for \`${sentenceId}\`: ${String(error)}`,
    );
  }

  const before = load(original);

  if (!Array.isArray(after) || !Array.isArray(before)) {
    throw new PatchError('expected the document to be a list of sentences');
  }
  if (after.length !== before.length) {
    throw new PatchError(
      `patch changed the sentence count (${before.length} → ${after.length})`,
    );
  }

  for (const [i, afterEntry] of after.entries()) {
    const beforeEntry = before[i] as Record<string, unknown>;
    const entry = afterEntry as Record<string, unknown>;

    if (entry.id !== beforeEntry.id) {
      throw new PatchError('patch reordered or renamed sentences');
    }

    const isTarget = entry.id === sentenceId;
    const strip = (o: Record<string, unknown>) => {
      const copy = { ...o };
      for (const key of OWNED_KEYS) delete copy[key];
      return JSON.stringify(copy);
    };

    if (strip(entry) !== strip(beforeEntry)) {
      throw new PatchError(
        `patch altered fields it does not own in \`${String(entry.id)}\``,
      );
    }

    if (!isTarget) continue;

    const wroteVetoed = (entry.vetoed ?? []) as string[][];
    if (JSON.stringify(wroteVetoed) !== JSON.stringify(decisions.vetoed)) {
      throw new PatchError(
        `patch did not record the vetoes for \`${sentenceId}\``,
      );
    }
    if ((entry.reviewed ?? false) !== decisions.reviewed) {
      throw new PatchError(
        `patch did not record the reviewed flag for \`${sentenceId}\``,
      );
    }
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
