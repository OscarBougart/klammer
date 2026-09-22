/**
 * Role vocabulary — E1.2.
 *
 * Every chunk in every authored sentence carries exactly one of these. The
 * expander reads nothing but the role and the tier; it never looks at the
 * surface string. That is what keeps the generator from turning into a parser.
 *
 * The list is closed. Adding a role means teaching the expander a new ordering
 * fact, so it is a deliberate change to scripts/expand.ts, never a quick edit
 * to unblock one sentence.
 */

/** Verbal material. The two brackets are built out of these. */
export const VERBAL_ROLES = [
  /** Finite verb. Left bracket in a main clause, right bracket in a subclause. */
  'FIN',
  /** Bare infinitive in the right bracket — `abholen` in `muss … abholen`. */
  'INF',
  /** Past participle — `gesehen`, `zurückgegeben`. */
  'PART',
  /** Separable prefix — the `ab` in `hole … ab`. */
  'PTKVZ',
] as const;

/** Arguments. Full noun phrases; pronouns are separate roles. */
export const ARGUMENT_ROLES = [
  'SUBJ',
  /** Accusative object, full NP. */
  'AKK',
  /** Dative object, full NP. */
  'DAT',
] as const;

/**
 * Pronominal arguments. Split from the full-NP roles because they order
 * differently and more rigidly: pronouns lead the Mittelfeld, and among
 * themselves run NOM > AKK > DAT — the reverse of the full-NP order. That
 * inversion is the whole of tier 3.
 */
export const PRONOUN_ROLES = ['PRON_NOM', 'PRON_AKK', 'PRON_DAT'] as const;

/**
 * Adverbials, in TeKaMoLo order: temporal, causal, modal, local. DIR is local
 * material with a direction and sits later than plain LOK.
 */
export const ADVERBIAL_ROLES = [
  /** Te — `morgens`, `seit drei Jahren`. */
  'TEMP',
  /** Ka — `wegen der Prüfung`. */
  'KAUS',
  /**
   * Mo — `mit dem Fahrrad`, `sehr langsam`. This is the *modal adverbial*,
   * nothing to do with modal verbs; a modal verb is a FIN.
   */
  'MODAL',
  /** Lo — `in Aachen`, `zu Hause`. */
  'LOK',
  /** Directional — `nach Köln`, `in die Schule`, `vom Bahnhof`. */
  'DIR',
] as const;

/** Everything else that has a fixed position of its own. */
export const OTHER_ROLES = [
  /** Negation. Sits against the right bracket. Never fills the Vorfeld. */
  'NEG',
  /** Predicative — `frei`, `müde`. Closes the Mittelfeld. */
  'PRAED',
  /** Subordinating conjunction — `dass`, `ob`, `weil`. Fills the left bracket. */
  'KONJ',
  /** A whole subordinate clause carried as one chunk. Vorfeld or Nachfeld. */
  'NEBENSATZ',
  /** Comparison phrase — `als du`. Extraposes to the Nachfeld. */
  'VERGL',
] as const;

export const ROLES = [
  ...VERBAL_ROLES,
  ...ARGUMENT_ROLES,
  ...PRONOUN_ROLES,
  ...ADVERBIAL_ROLES,
  ...OTHER_ROLES,
] as const;

export type Role = (typeof ROLES)[number];

const ROLE_SET: ReadonlySet<string> = new Set(ROLES);

export function isRole(value: string): value is Role {
  return ROLE_SET.has(value);
}

/**
 * Roles that may occupy the Vorfeld — design.md §4. Exactly one constituent
 * goes there. Everything absent from this set is excluded on principle, not by
 * accident: NEG and unstressed pronouns cannot be fronted, and the finite verb
 * is fixed in the left bracket.
 */
export const VORFELD_ELIGIBLE: ReadonlySet<Role> = new Set<Role>([
  'SUBJ',
  // A nominative pronoun in the Vorfeld is the most ordinary German sentence
  // there is. The role sat unused until GERMAN-REVIEW.md 1.3 made the
  // pronoun/noun subject distinction load-bearing, so the omission never bit.
  'PRON_NOM',
  'TEMP',
  'KAUS',
  'MODAL',
  'LOK',
  'DIR',
  'AKK',
  'DAT',
  'PRAED',
  'NEBENSATZ',
  // Object pronouns may be fronted under contrast. `es` cannot be stressed and
  // is excluded by `stressable: false`, not by role.
  'PRON_AKK',
  'PRON_DAT',
]);

/** Verbal material that belongs in the right bracket. */
export const RIGHT_BRACKET_ROLES: ReadonlySet<Role> = new Set<Role>([
  'INF',
  'PART',
  'PTKVZ',
]);

/** Roles that may sit in the Nachfeld, outside the right bracket. */
export const NACHFELD_ELIGIBLE: ReadonlySet<Role> = new Set<Role>([
  'VERGL',
  'NEBENSATZ',
]);

export const PRONOUN_ROLE_SET: ReadonlySet<Role> = new Set<Role>(PRONOUN_ROLES);

/** TeKaMoLo, as a rank. Lower sorts earlier in the Mittelfeld. */
export const ADVERBIAL_RANK: Readonly<Record<string, number>> = {
  TEMP: 0,
  KAUS: 1,
  MODAL: 2,
  LOK: 3,
  DIR: 4,
};
