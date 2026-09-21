/**
 * Authored sentence schema — E1.1.
 *
 * `content/sentences/*.yaml` is the human-edited source of truth. This module
 * defines what a valid entry looks like and validates it loudly, because a
 * malformed sentence that slips through becomes a wrong sentence in the seed,
 * and a wrong sentence in the seed is a product defect.
 *
 * Validation is hand-written rather than schema-library-driven so the error
 * messages can name the sentence id and the chunk — an author fixing YAML at
 * 40 sentences a sitting needs to be told exactly which line is wrong.
 */
import { isRole, type Role } from './roles';

/** A tile. One constituent, never split. */
export type AuthoredChunk = {
  /** Short stable key, unique within the sentence. Used in order lists. */
  id: string;
  /** How the chunk reads in its canonical position, with real capitalisation. */
  surface: string;
  /**
   * How the tile renders in the tray: lowercase unless the word is a noun or
   * a name. Rendering `surface` would leak the answer — a capitalised tile
   * announces that it belongs in the Vorfeld.
   */
  neutralSurface: string;
  role: Role;
  /**
   * Definite or indefinite. Required on AKK and DAT, meaningless elsewhere.
   *
   * This is not decoration: it is the discriminator for where an object sits
   * relative to a temporal adverbial. `meine Schwester` precedes `morgen`,
   * `einen Film` follows `gestern`, and the roles are identical in both. The
   * expander cannot recover this from the surface without inspecting
   * determiners, which is the parser we are not writing.
   */
  definite?: boolean;
  /**
   * Whether the chunk can carry stress. Defaults to true; set false for `es`
   * and other bare unstressed object pronouns.
   *
   * Gates two rules at once — design.md §4 bars unstressed pronoun objects
   * from the Vorfeld, and an unstressed pronoun also cannot be pushed behind
   * an adverbial. `mich` can do both under protest (`ungewoehnlich`); `es`
   * can do neither at all.
   */
  stressable?: boolean;
};

export type AuthoredSentence = {
  /** e.g. `t2-01`. Stable forever: attempts and the review queue key on it. */
  id: string;
  tier: 1 | 2 | 3 | 4 | 5;
  /** Keys the explanation strings shown on a wrong answer. */
  ruleId: string;
  gloss: string;
  /** Fixed scaffolding around a played subclause, e.g. `Sie sagt, …`. */
  matrix?: string;
  chunks: AuthoredChunk[];
  /** The neutral order, as chunk ids. Must be a permutation of chunks. */
  canonical: string[];
  /**
   * Orders the generator will not produce but the author vouches for. The
   * escape hatch that keeps engine code free of per-sentence special cases —
   * CLAUDE.md is explicit that a stubborn sentence is fixed here or in the
   * expander, never in the engine.
   */
  extraAccepted?: { order: string[]; class: AcceptedClass }[];
  /** Orders the author has vetoed out of the generated set. */
  vetoed?: string[][];
};

/** design.md §4. `falsch` is the absence of a class, never a stored value. */
export type AcceptedClass = 'kanonisch' | 'gueltig' | 'ungewoehnlich';

export const ACCEPTED_CLASSES: readonly AcceptedClass[] = [
  'kanonisch',
  'gueltig',
  'ungewoehnlich',
];

export class SentenceSchemaError extends Error {
  constructor(sentenceId: string, message: string) {
    super(`[${sentenceId}] ${message}`);
    this.name = 'SentenceSchemaError';
  }
}

/**
 * Validates one parsed YAML entry and narrows it. Throws on the first problem
 * with a message naming the sentence.
 */
export function assertAuthoredSentence(
  value: unknown,
): asserts value is AuthoredSentence {
  if (typeof value !== 'object' || value === null) {
    throw new SentenceSchemaError('?', 'sentence is not a mapping');
  }

  const s = value as Record<string, unknown>;
  const id = typeof s.id === 'string' ? s.id : '?';

  const fail = (message: string): never => {
    throw new SentenceSchemaError(id, message);
  };

  if (typeof s.id !== 'string' || s.id.length === 0) fail('missing `id`');
  if (typeof s.ruleId !== 'string' || s.ruleId.length === 0) {
    fail('missing `ruleId`');
  }
  if (typeof s.gloss !== 'string' || s.gloss.length === 0) {
    fail('missing `gloss` — every sentence ships with its English gloss');
  }
  if (s.matrix !== undefined && typeof s.matrix !== 'string') {
    fail('`matrix` must be a string when present');
  }
  if (
    typeof s.tier !== 'number' ||
    !Number.isInteger(s.tier) ||
    s.tier < 1 ||
    s.tier > 5
  ) {
    fail('`tier` must be an integer 1–5');
  }

  if (!Array.isArray(s.chunks) || s.chunks.length === 0) {
    fail('`chunks` must be a non-empty list');
  }

  const chunks = s.chunks as unknown[];
  const seen = new Set<string>();

  for (const [i, raw] of chunks.entries()) {
    if (typeof raw !== 'object' || raw === null) {
      fail(`chunk ${i} is not a mapping`);
    }
    const c = raw as Record<string, unknown>;

    if (typeof c.id !== 'string' || c.id.length === 0) {
      fail(`chunk ${i} has no \`id\``);
    }
    if (seen.has(c.id as string)) fail(`duplicate chunk id \`${c.id}\``);
    seen.add(c.id as string);

    if (typeof c.surface !== 'string' || c.surface.length === 0) {
      fail(`chunk \`${c.id}\` has no \`surface\``);
    }
    if (typeof c.neutralSurface !== 'string' || c.neutralSurface.length === 0) {
      fail(`chunk \`${c.id}\` has no \`neutralSurface\``);
    }
    if (typeof c.role !== 'string' || !isRole(c.role)) {
      fail(`chunk \`${c.id}\` has unknown role \`${String(c.role)}\``);
    }

    // Required, not optional-with-a-default: a silently-defaulted definiteness
    // produces a plausible-looking accepted set that is wrong, which is the
    // one failure mode this project cannot absorb.
    if (c.role === 'AKK' || c.role === 'DAT') {
      if (typeof c.definite !== 'boolean') {
        fail(
          `chunk \`${c.id}\` is ${c.role} and needs \`definite: true|false\` — ` +
            'it decides whether the object sits before or after a temporal',
        );
      }
    }

    if (c.stressable !== undefined && typeof c.stressable !== 'boolean') {
      fail(`chunk \`${c.id}\` has a non-boolean \`stressable\``);
    }
  }

  const finCount = chunks.filter(
    (c) => (c as AuthoredChunk).role === 'FIN',
  ).length;
  if (finCount !== 1) {
    fail(`expected exactly one FIN chunk, found ${finCount}`);
  }

  if (!Array.isArray(s.canonical)) fail('missing `canonical`');
  assertPermutation(id, s.canonical as unknown[], seen, 'canonical');

  if (s.extraAccepted !== undefined) {
    if (!Array.isArray(s.extraAccepted)) fail('`extraAccepted` must be a list');
    for (const [i, entry] of (s.extraAccepted as unknown[]).entries()) {
      if (typeof entry !== 'object' || entry === null) {
        fail(`extraAccepted[${i}] is not a mapping`);
      }
      const e = entry as Record<string, unknown>;
      if (!Array.isArray(e.order)) {
        fail(`extraAccepted[${i}] has no \`order\``);
      }
      assertPermutation(id, e.order as unknown[], seen, `extraAccepted[${i}]`);
      if (
        typeof e.class !== 'string' ||
        !ACCEPTED_CLASSES.includes(e.class as AcceptedClass)
      ) {
        fail(
          `extraAccepted[${i}] needs \`class\`: one of ${ACCEPTED_CLASSES.join(', ')}`,
        );
      }
    }
  }

  if (s.vetoed !== undefined) {
    if (!Array.isArray(s.vetoed)) fail('`vetoed` must be a list of orders');
    for (const [i, order] of (s.vetoed as unknown[]).entries()) {
      if (!Array.isArray(order)) fail(`vetoed[${i}] is not a list`);
      assertPermutation(id, order as unknown[], seen, `vetoed[${i}]`);
    }
  }
}

/**
 * An order must use every chunk exactly once. A missing or repeated chunk in a
 * hand-written order is the most common authoring slip and the one most likely
 * to silently produce a wrong accepted set.
 */
function assertPermutation(
  sentenceId: string,
  order: unknown[],
  chunkIds: ReadonlySet<string>,
  label: string,
): void {
  const seen = new Set<string>();

  for (const entry of order) {
    if (typeof entry !== 'string') {
      throw new SentenceSchemaError(
        sentenceId,
        `${label} contains a non-string entry`,
      );
    }
    if (!chunkIds.has(entry)) {
      throw new SentenceSchemaError(
        sentenceId,
        `${label} names unknown chunk \`${entry}\``,
      );
    }
    if (seen.has(entry)) {
      throw new SentenceSchemaError(
        sentenceId,
        `${label} repeats chunk \`${entry}\``,
      );
    }
    seen.add(entry);
  }

  if (seen.size !== chunkIds.size) {
    const missing = [...chunkIds].filter((id) => !seen.has(id));
    throw new SentenceSchemaError(
      sentenceId,
      `${label} is missing chunk(s): ${missing.join(', ')}`,
    );
  }
}
