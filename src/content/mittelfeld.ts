/**
 * Mittelfeld ordering — the rank model behind design.md §4.
 *
 * Every chunk that lands in the Mittelfeld gets a rank; the default order is
 * the ranks ascending. Licensed departures from that default are generated
 * separately and carry a class (see generate.ts). The ranks are spaced so a
 * new one can be slotted between two without renumbering the world.
 *
 * The model reproduces the canonical order of all 19 corpus sentences. Where
 * it is known to be thin, the comment says so rather than pretending.
 */
import type { AuthoredChunk } from './schema';

export const RANK = {
  /**
   * Subject, ahead of object pronouns.
   *
   * Thin spot: this is right for a pronominal subject (`dass sie mich morgen
   * abholen muss`) and defensible but not obligatory for a full-NP one —
   * `gestern hat mir der Mann das Buch gegeben` is at least as good as the
   * order this produces. No corpus sentence tests a full-NP subject alongside
   * an object pronoun. Revisit when tier 3 authoring reaches one.
   */
  SUBJ: 5,

  /** Pronouns lead the Mittelfeld, and run NOM > AKK > DAT among themselves. */
  PRON_NOM: 10,
  PRON_AKK: 11,
  PRON_DAT: 12,

  /** Definite objects outrank a temporal. DAT before AKK among full NPs. */
  DAT_DEFINITE: 30,
  AKK_DEFINITE: 31,

  /** TeKaMoLo begins. */
  TEMP: 40,
  KAUS: 41,

  /**
   * Negation sits further forward than design.md implied.
   *
   * Native review: `nicht` precedes the second verb part, prepositional
   * objects, modal adverbials AND local adverbials — `Wir sind am Samstag
   * nicht dorthin gefahren`. It still follows definite objects and pronouns
   * (`Ich habe das Buch nicht gelesen`) and follows the time phrase; moving it
   * in front of the time phrase turns it into contrastive negation, which
   * needs a `sondern`.
   *
   * At its old rank of 80 the generator built `zu Hause nicht`, which is not
   * a German sentence.
   */
  NEG: 55,

  MODAL: 60,

  /**
   * Indefinite and bare objects fall behind the adverbials.
   *
   * This is the t2-01/t2-02 split — `meine Schwester` precedes `morgen`,
   * `einen Film` follows `gestern` — but it goes further than the temporal.
   * A bare object forms a unit with its verb (`Deutsch sprechen`, `Kaffee
   * trinken`) and sits as late as it can: `sie spricht sehr gut Deutsch`,
   * never `sie spricht Deutsch sehr gut`.
   */
  DAT_INDEFINITE: 62,
  AKK_INDEFINITE: 63,

  LOK: 70,

  DIR: 85,
  PRAED: 90,

  /** A comparison that has stayed inside the bracket rather than extraposing. */
  VERGL: 95,
} as const;

/**
 * Rank for one chunk. Throws rather than defaulting: an unranked role reaching
 * the Mittelfeld means the role vocabulary and this table have drifted apart,
 * and a silent default would emit a confidently wrong accepted set.
 */
export function rankOf(chunk: AuthoredChunk): number {
  switch (chunk.role) {
    case 'SUBJ':
      return RANK.SUBJ;
    case 'PRON_NOM':
      return RANK.PRON_NOM;
    case 'PRON_AKK':
      return RANK.PRON_AKK;
    case 'PRON_DAT':
      return RANK.PRON_DAT;
    case 'DAT':
      return chunk.definite ? RANK.DAT_DEFINITE : RANK.DAT_INDEFINITE;
    case 'AKK':
      return chunk.definite ? RANK.AKK_DEFINITE : RANK.AKK_INDEFINITE;
    case 'TEMP':
      return RANK.TEMP;
    case 'KAUS':
      return RANK.KAUS;
    case 'MODAL':
      return RANK.MODAL;
    case 'LOK':
      return RANK.LOK;
    case 'NEG':
      return RANK.NEG;
    case 'DIR':
      return RANK.DIR;
    case 'PRAED':
      return RANK.PRAED;
    case 'VERGL':
      return RANK.VERGL;
    default:
      throw new Error(
        `role ${chunk.role} has no Mittelfeld rank — it should never reach the Mittelfeld`,
      );
  }
}

/** The default Mittelfeld: ranks ascending, ties broken by authored order. */
export function defaultMittelfeld(chunks: AuthoredChunk[]): AuthoredChunk[] {
  return chunks
    .map((chunk, index) => ({ chunk, index, rank: rankOf(chunk) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.chunk);
}

/** A chunk can be stressed unless the author said otherwise. */
export function isStressable(chunk: AuthoredChunk): boolean {
  return chunk.stressable !== false;
}
