/**
 * Accepted-order generation — E1.3 / E1.4.
 *
 * Builds a clause topologically rather than permuting and filtering. A
 * 7-chunk sentence has 5,040 permutations of which maybe five are German;
 * assembling the field model directly produces those five and never has to
 * reason about the other 5,035.
 *
 * The output is proposals. design.md is explicit that rules propose and the
 * author disposes — every set goes past a human before it freezes.
 */
import { defaultMittelfeld, isStressable } from './mittelfeld';
import { NACHFELD_ELIGIBLE, VORFELD_ELIGIBLE } from './roles';
import type { AcceptedClass, AuthoredChunk, AuthoredSentence } from './schema';

export type GeneratedOrder = {
  /** Chunk ids, in order. */
  order: string[];
  class: AcceptedClass;
  /** Why the generator produced it — shown in the author review CLI. */
  reason: string;
};

/**
 * Right-bracket order, innermost first. A separable prefix and a participle
 * never co-occur; where a bare infinitive meets a governing verb the
 * infinitive precedes it, which is the `abholen muss` of tier 4.
 */
const RIGHT_BRACKET_ORDER = ['PTKVZ', 'PART', 'INF'] as const;

export function generate(sentence: AuthoredSentence): GeneratedOrder[] {
  const canonicalKey = sentence.canonical.join(' ');

  const fin = sentence.chunks.find((c) => c.role === 'FIN');
  if (!fin) throw new Error(`[${sentence.id}] no FIN chunk`);

  const konj = sentence.chunks.find((c) => c.role === 'KONJ');
  const isSubordinate = konj !== undefined;

  const rightBracket = orderRightBracket(sentence.chunks);
  const rightBracketIds = new Set(rightBracket.map((c) => c.id));

  /** Everything that is neither verbal nor the conjunction. */
  const material = sentence.chunks.filter(
    (c) => c.id !== fin.id && c.id !== konj?.id && !rightBracketIds.has(c.id),
  );

  const results: GeneratedOrder[] = [];

  const emit = (order: AuthoredChunk[], cls: AcceptedClass, reason: string) => {
    // Every order must use every chunk exactly once. The board deals one tile
    // per chunk, so a short order is not merely wrong — it is unreachable, and
    // it would sit in the seed as a hash no player can ever produce. Assert
    // rather than filter: a dropped chunk means a placement rule below failed
    // to place something, and that is a bug to fix, not a case to skip.
    if (order.length !== sentence.chunks.length) {
      const got = new Set(order.map((c) => c.id));
      const missing = sentence.chunks
        .filter((c) => !got.has(c.id))
        .map((c) => c.id);
      throw new Error(
        `[${sentence.id}] generated an order dropping chunk(s): ${missing.join(', ')}`,
      );
    }

    results.push({ order: order.map((c) => c.id), class: cls, reason });
  };

  /** Chunks that may extrapose to the Nachfeld, and so are optional there. */
  const extraposable = material.filter((c) => NACHFELD_ELIGIBLE.has(c.role));

  for (const nachfeld of nachfeldChoices(extraposable)) {
    const available = material.filter((c) => !nachfeld.includes(c));

    // A subordinate clause carried as one chunk sits in the Vorfeld or the
    // Nachfeld and nowhere else. If this combination has left one in the
    // middle, there is no field for it and the combination is not a sentence.
    const strandedNebensatz = (chunks: AuthoredChunk[]) =>
      chunks.some((c) => c.role === 'NEBENSATZ');

    if (isSubordinate) {
      if (strandedNebensatz(available)) continue;

      // [KONJ] [Mittelfeld] [right bracket, FIN last] [Nachfeld]
      for (const mittelfeld of mittelfeldVariants(available)) {
        emit(
          [konj, ...mittelfeld.chunks, ...rightBracket, fin, ...nachfeld],
          mittelfeld.class,
          mittelfeld.reason,
        );
      }
      continue;
    }

    // [Vorfeld] [FIN] [Mittelfeld] [right bracket] [Nachfeld]
    for (const vorfeld of available) {
      if (!VORFELD_ELIGIBLE.has(vorfeld.role)) continue;
      // design.md §4 — a bare unstressed pronoun cannot be fronted.
      if (!isStressable(vorfeld)) continue;

      const rest = available.filter((c) => c !== vorfeld);
      if (strandedNebensatz(rest)) continue;

      const fronted = classifyVorfeld(vorfeld);

      for (const mittelfeld of mittelfeldVariants(rest)) {
        emit(
          [vorfeld, fin, ...mittelfeld.chunks, ...rightBracket, ...nachfeld],
          worse(fronted.class, mittelfeld.class),
          [fronted.reason, mittelfeld.reason].filter(Boolean).join('; '),
        );
      }
    }
  }

  // Orders the rules will not propose but the author vouches for. CLAUDE.md
  // routes stubborn sentences here rather than into engine special cases, and
  // the generator deliberately leaves gaps for it: where the evidence is too
  // thin to state a rule, it declines and lets a human decide per sentence.
  for (const extra of sentence.extraAccepted ?? []) {
    results.push({
      order: [...extra.order],
      class: extra.class,
      reason: 'vouched for by the author (extraAccepted)',
    });
  }

  // Orders the author has struck out of the generated set.
  const vetoed = new Set((sentence.vetoed ?? []).map((o) => o.join(' ')));

  // `kanonisch` means "the one most neutral order", not "unmarked by the
  // rules". Exactly one order per sentence may carry it — the authored one —
  // whatever the rules would have said:
  //
  //   promoted: t4-03 fronts a whole subordinate clause, which the markedness
  //             rules would otherwise call gueltig.
  //   demoted:  an extraposed Nachfeld leaves an unmarked Vorfeld and an
  //             unmarked Mittelfeld behind it, so the rules would call it
  //             canonical too. It is a second reading of the sentence, and a
  //             second reading is at best gueltig.
  for (const result of results) {
    const isCanonical = result.order.join(' ') === canonicalKey;

    if (isCanonical) {
      result.class = 'kanonisch';
      result.reason = 'the authored canonical order';
    } else if (result.class === 'kanonisch') {
      result.class = 'gueltig';
      result.reason = result.reason || 'an unmarked alternative reading';
    }
  }

  return dedupe(results).filter((r) => !vetoed.has(r.order.join(' ')));
}

/** Verbal material in the right bracket, innermost first. */
function orderRightBracket(chunks: AuthoredChunk[]): AuthoredChunk[] {
  const out: AuthoredChunk[] = [];
  for (const role of RIGHT_BRACKET_ORDER) {
    for (const c of chunks) if (c.role === role) out.push(c);
  }
  return out;
}

/**
 * A Nachfeld-eligible chunk either extraposes or stays inside. Both readings
 * are generated; t5-01 vouches for each.
 *
 * Only one chunk extraposes at a time — two extraposed clauses is a
 * construction v1 does not author.
 */
function nachfeldChoices(extraposable: AuthoredChunk[]): AuthoredChunk[][] {
  return [[], ...extraposable.map((c) => [c])];
}

type MittelfeldVariant = {
  chunks: AuthoredChunk[];
  class: AcceptedClass;
  reason: string;
};

/**
 * The default Mittelfeld plus its licensed departures.
 *
 * The caller guarantees no NEBENSATZ reaches here — it has no Mittelfeld rank
 * and rankOf would throw, which is the intended alarm rather than a silent
 * misplacement.
 */
function mittelfeldVariants(chunks: AuthoredChunk[]): MittelfeldVariant[] {
  const base = defaultMittelfeld(chunks);

  const variants: MittelfeldVariant[] = [
    { chunks: base, class: 'kanonisch', reason: '' },
  ];

  /**
   * Licensed departures from the default order, per the native-speaker review.
   *
   * The governing insight from that review: almost nothing in the Mittelfeld
   * is flatly ungrammatical. Most "wrong" orders simply need contrastive
   * stress, which this app cannot show. So an order that only works under
   * stress is `ungewoehnlich` with a note — never `falsch`. The single
   * exception is `es`, which cannot be stressed at all, and which the
   * `stressable: false` flag already excludes.
   */
  for (const [i, chunk] of base.entries()) {
    for (const [j, anchor] of base.entries()) {
      if (i === j) continue;
      // Only ever generate a leftward move; the mirror is the base order.
      if (i < j) continue;

      const variant = licensedSwap(chunk, anchor);
      if (!variant) continue;

      const swapped = [...base];
      swapped[i] = anchor;
      swapped[j] = chunk;

      variants.push({
        chunks: swapped,
        class: variant.class,
        reason: variant.reason,
      });
    }
  }

  return variants;
}

type SwapRule = { class: AcceptedClass; reason: string };

/**
 * Whether two neighbours in the Mittelfeld may exchange places, and what the
 * result costs. Returns null when the exchange is not licensed.
 *
 * Classified by the *pair*, not by which one moves: `meine Schwester morgen`
 * and `morgen meine Schwester` are the same alternation seen from either end,
 * and the generator reaches it from whichever side the default order puts
 * second.
 *
 * The governing insight from the native review: almost nothing in the
 * Mittelfeld is flatly ungrammatical. Most "wrong" orders simply need
 * contrastive stress, which this app cannot show — so an order that only works
 * under stress is `ungewoehnlich`, never `falsch`. The one true exception is
 * `es`, which cannot be stressed at all, and which `stressable: false` keeps
 * out of every variant.
 */
function licensedSwap(a: AuthoredChunk, b: AuthoredChunk): SwapRule | null {
  const object = pickObject(a, b);
  const adverbial = pickAdverbial(a, b);

  if (object && adverbial) {
    // A pronoun leaves its slot only under contrast — and `es`, which cannot
    // carry stress, never leaves it. This check was missing: `Ich gebe morgen
    // dir es` shipped as `ungewoehnlich` in t3-06 while the comments above
    // said it could not be generated.
    if (object.role === 'PRON_AKK' || object.role === 'PRON_DAT') {
      if (!isStressable(object)) return null;
      return {
        class: 'ungewoehnlich',
        reason: `${object.id} behind ${adverbial.id} — only with stress on ${object.id}`,
      };
    }

    // A bare or indefinite object resists climbing over a *time* phrase; it
    // reads only with focus on the adverbial (`Ich trinke Kaffee morgens`,
    // understood as "…nicht abends"). Across a reason or a manner phrase it
    // moves freely — manner already sits next to the verb, so the object
    // barely travels.
    if (!object.definite && adverbial.role === 'TEMP') {
      return {
        class: 'ungewoehnlich',
        reason: `${object.id} before ${adverbial.id} — needs focus on ${adverbial.id}`,
      };
    }

    return {
      class: 'gueltig',
      reason: `${object.id} and ${adverbial.id} exchanged`,
    };
  }

  // An object pronoun and a full-noun subject — GERMAN-REVIEW.md 1.3. In the
  // Mittelfeld a pronoun outranks a full noun whatever its case, so `Gestern
  // hat mir der Mann das Buch gegeben` is at least as natural as the
  // subject-first order. Accepted as ordinary, not marked. Pronoun subjects
  // carry `PRON_NOM` and are excluded: two pronouns keep nominative first.
  const nounSubject = a.role === 'SUBJ' ? a : b.role === 'SUBJ' ? b : undefined;
  const objectPronoun =
    a.role === 'PRON_AKK' || a.role === 'PRON_DAT'
      ? a
      : b.role === 'PRON_AKK' || b.role === 'PRON_DAT'
        ? b
        : undefined;
  if (nounSubject && objectPronoun) {
    return {
      class: 'gueltig',
      reason: `${objectPronoun.id} before ${nounSubject.id} — a pronoun comes early`,
    };
  }

  // Two full noun objects. Dative before accusative is the neutral order, but
  // the reverse is emphasis rather than error — `Ich gebe das Buch meinem
  // Bruder` has to be accepted.
  const isFullPair =
    (a.role === 'AKK' && b.role === 'DAT') ||
    (a.role === 'DAT' && b.role === 'AKK');
  if (isFullPair) {
    return {
      class: 'gueltig',
      reason: 'accusative before dative — emphasis on the recipient',
    };
  }

  return null;
}

const OBJECT_ROLES = new Set(['AKK', 'DAT', 'PRON_AKK', 'PRON_DAT']);
const ADVERBIAL_ROLES_SWAP = new Set(['TEMP', 'KAUS', 'MODAL', 'INSTR']);

function pickObject(
  a: AuthoredChunk,
  b: AuthoredChunk,
): AuthoredChunk | undefined {
  if (OBJECT_ROLES.has(a.role) && ADVERBIAL_ROLES_SWAP.has(b.role)) return a;
  if (OBJECT_ROLES.has(b.role) && ADVERBIAL_ROLES_SWAP.has(a.role)) return b;
  return undefined;
}

function pickAdverbial(
  a: AuthoredChunk,
  b: AuthoredChunk,
): AuthoredChunk | undefined {
  if (OBJECT_ROLES.has(a.role) && ADVERBIAL_ROLES_SWAP.has(b.role)) return b;
  if (OBJECT_ROLES.has(b.role) && ADVERBIAL_ROLES_SWAP.has(a.role)) return a;
  return undefined;
}

/** Vorfeld markedness — design.md §4 and the corpus accept lists. */
function classifyVorfeld(chunk: AuthoredChunk): {
  class: AcceptedClass;
  reason: string;
} {
  if (chunk.role === 'SUBJ' || chunk.role === 'PRON_NOM') {
    return { class: 'kanonisch', reason: '' };
  }

  if (
    chunk.role === 'TEMP' ||
    chunk.role === 'KAUS' ||
    chunk.role === 'NEBENSATZ'
  ) {
    return { class: 'gueltig', reason: `${chunk.id} fronted — shifts emphasis` };
  }

  // Topicalising a definite object is everyday German — `Das Buch hat er mir
  // noch nicht zurückgegeben`. An indefinite one in the Vorfeld is a much
  // stranger thing to say, and stays marked.
  if (
    (chunk.role === 'AKK' || chunk.role === 'DAT') &&
    chunk.definite === true
  ) {
    return {
      class: 'gueltig',
      reason: `${chunk.id} fronted — topic`,
    };
  }

  // A scene-setting place phrase is ordinary, not marked: `In Aachen wohne ich
  // seit 2022`. Native review moved this out of `ungewoehnlich`. Directionals
  // stay marked — `Vom Bahnhof hole ich…` only works as a contrast.
  if (chunk.role === 'LOK') {
    return { class: 'gueltig', reason: `${chunk.id} fronted — sets the scene` };
  }

  // Instrument fronts freely — `Mit dem Fahrrad fahre ich zur Arbeit` answers
  // "how do you get there?" and needs no contrast. True manner (`schnell`,
  // `gern`, `spät`) falls through to the marked case below, which is the whole
  // reason INSTR is a separate role.
  if (chunk.role === 'INSTR') {
    return { class: 'gueltig', reason: `${chunk.id} fronted — the means` };
  }

  // An object pronoun can be fronted, but only under contrast: `Mir hat er…`
  // means "me, not them". Unstressable pronouns (`es`) never reach here —
  // the caller drops them.
  if (chunk.role === 'PRON_AKK' || chunk.role === 'PRON_DAT') {
    return {
      class: 'ungewoehnlich',
      reason: `${chunk.id} fronted — only with stress on ${chunk.id}`,
    };
  }

  return {
    class: 'ungewoehnlich',
    reason: `${chunk.id} fronted — marked, answers a specific question`,
  };
}

const SEVERITY: Record<AcceptedClass, number> = {
  kanonisch: 0,
  gueltig: 1,
  ungewoehnlich: 2,
};

/** Two departures never cancel out; the worse one wins. */
function worse(a: AcceptedClass, b: AcceptedClass): AcceptedClass {
  return SEVERITY[a] >= SEVERITY[b] ? a : b;
}

/**
 * The same order can be reached two ways — a vacuous alternation when the
 * temporal sits in the Vorfeld, say. Keep the least-marked reading of each.
 */
function dedupe(results: GeneratedOrder[]): GeneratedOrder[] {
  const best = new Map<string, GeneratedOrder>();

  for (const result of results) {
    const key = result.order.join(' ');
    const existing = best.get(key);
    if (!existing || SEVERITY[result.class] < SEVERITY[existing.class]) {
      best.set(key, result);
    }
  }

  return [...best.values()];
}
