/**
 * Which rule to name after a wrong answer.
 *
 * Validation stays a hash lookup (validate.ts); this never decides *whether*
 * an order is right. It only picks the explanation. Naming the sentence's own
 * rule every time was misleading: a learner who put the verb third in a
 * "time before place" sentence was told about time and place, and learned
 * nothing about the mistake they actually made.
 *
 * The check is structural and reads the board, not the words: which field
 * each role-tagged tile sits in. The two structural rules come first because
 * a broken verb position makes every finer rule moot.
 */
import type { FieldId } from '@/board/fields';

export type DiagnosisTile = { id: string; role: string };

/** Verbal material that belongs in the right bracket of a main clause. */
const RIGHT_BRACKET_ROLES = new Set(['PART', 'INF', 'PTKVZ']);

/** The bracket rule that explains each kind of right-bracket element. */
const BRACKET_RULE: Record<string, string> = {
  PTKVZ: 'satzklammer-trennbar',
  PART: 'satzklammer-perfekt',
  INF: 'satzklammer-modal',
};

export function diagnoseRule(input: {
  fields: Readonly<Record<string, readonly string[]>>;
  fieldOrder: readonly FieldId[];
  tiles: readonly DiagnosisTile[];
  sentenceRuleId: string;
}): string {
  const { fields, fieldOrder, tiles, sentenceRuleId } = input;
  const roleOf = new Map(tiles.map((t) => [t.id, t.role]));

  // Verb-final clauses have their own structure and their own rules; the
  // sentence's rule is the right one to name there.
  if (tiles.some((t) => t.role === 'KONJ')) return sentenceRuleId;

  const vorfeld = fields.vorfeld ?? [];
  const leftBracket = fields.linkeKlammer ?? [];

  const verbSecond =
    vorfeld.length === 1 &&
    leftBracket.length === 1 &&
    roleOf.get(leftBracket[0] ?? '') === 'FIN';

  if (!verbSecond) return 'v2-deklarativ';

  if (fieldOrder.includes('rechteKlammer')) {
    const rightBracket = fields.rechteKlammer ?? [];
    const bracketTiles = tiles.filter((t) => RIGHT_BRACKET_ROLES.has(t.role));

    const misplaced =
      bracketTiles.some((t) => !rightBracket.includes(t.id)) ||
      rightBracket.some((id) => !RIGHT_BRACKET_ROLES.has(roleOf.get(id) ?? ''));

    if (misplaced) {
      if (sentenceRuleId.startsWith('satzklammer-')) return sentenceRuleId;
      const first = bracketTiles[0];
      const rule = first ? BRACKET_RULE[first.role] : undefined;
      if (rule) return rule;
    }
  }

  return sentenceRuleId;
}
