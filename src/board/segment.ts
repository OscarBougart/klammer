/**
 * Splitting a built sentence into its fields — shown after Prüfen.
 *
 * The learner builds one row, left to right, the way a sentence is said. The
 * fields only appear once it is checked, filled from that row, so the rule is
 * taught with the learner's own sentence: two Satzteile before the verb show
 * up as two tiles in position 1, which is the mistake made visible.
 *
 * This is display, not validation. Whether the order is right is still the
 * hash lookup in engine/validate.ts; this only decides which box each tile is
 * drawn in, from the role tags and nothing else.
 */
import type { FieldId } from './fields';

/** Verbal material that closes a main clause's right bracket. */
const RIGHT_BRACKET_ROLES = new Set(['PART', 'INF', 'PTKVZ']);

/** What may stand after the right bracket — content/roles.ts NACHFELD_ELIGIBLE. */
const NACHFELD_ROLES = new Set(['NEBENSATZ', 'VERGL']);

export type Segments = Partial<Record<FieldId, string[]>>;

export function segmentOrder(
  order: readonly string[],
  roleOf: (id: string) => string | undefined,
  fieldIds: readonly FieldId[],
): Segments {
  const has = (id: FieldId) => fieldIds.includes(id);
  const out: Segments = {};
  for (const id of fieldIds) out[id] = [];

  const verbFinal = order.some((id) => roleOf(id) === 'KONJ');

  // The right bracket is the run of verbal tiles at the very end. A verbal
  // tile anywhere else stays in the middle, which is where the learner put it.
  const closes = (id: string) => {
    const role = roleOf(id) ?? '';
    return RIGHT_BRACKET_ROLES.has(role) || (verbFinal && role === 'FIN');
  };

  // The Nachfeld is whatever Nachfeld material ends the sentence, behind the
  // bracket. Peeled first, so the bracket's run of verbs is found in front of
  // it. Material of that kind anywhere else stays where the learner put it.
  let end = order.length;
  if (has('nachfeld')) {
    while (end > 0 && NACHFELD_ROLES.has(roleOf(order[end - 1] ?? '') ?? '')) end -= 1;
    out.nachfeld = order.slice(end);
  }
  const nachfeldStart = end;

  if (has('rechteKlammer')) {
    while (end > 0 && closes(order[end - 1] ?? '')) end -= 1;
  }

  let start = 0;
  if (verbFinal) {
    // A subordinate clause opens with its conjunction and has no Vorfeld.
    if (roleOf(order[0] ?? '') === 'KONJ') start = 1;
    out.linkeKlammer = order.slice(0, start);
  } else {
    const fin = order.findIndex((id) => roleOf(id) === 'FIN');
    if (fin >= 0 && fin < end) {
      if (has('vorfeld')) out.vorfeld = order.slice(0, fin);
      out.linkeKlammer = [order[fin] ?? ''];
      start = fin + 1;
    }
  }

  out.mittelfeld = order.slice(start, end);
  if (has('rechteKlammer')) out.rechteKlammer = order.slice(end, nachfeldStart);

  return out;
}
