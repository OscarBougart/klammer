/**
 * The board's field model — E2.1.
 *
 * design.md §2: the board *is* the topological field model, and it grows with
 * the tier. A learner on tier 1 never sees five zones, because the board is
 * honest about how much structure is currently in play.
 *
 * Zones are derived from the tier, never hardcoded per screen. Adding a tier
 * is a change here and nowhere else.
 */

export const FIELD_IDS = [
  'vorfeld',
  'linkeKlammer',
  'mittelfeld',
  'rechteKlammer',
  'nachfeld',
] as const;

export type FieldId = (typeof FIELD_IDS)[number];

export type Tier = 1 | 2 | 3 | 4 | 5;

export type Field = {
  id: FieldId;
  /** Shown under the zone, 13px with loose tracking, sentence case. */
  label: string;
  /**
   * Screen-reader label.
   *
   * German, like everything else on screen. A screen reader that switches
   * language mid-board garbles both halves, and the field names are part of
   * what the app teaches — a learner who hears `Vorfeld` is learning the word
   * they will see written on the board.
   */
  a11yLabel: string;
  /**
   * Whether the zone holds one constituent or many. The Vorfeld holds exactly
   * one — that is the rule tier 1 teaches — and the brackets hold verbal
   * material only.
   */
  capacity: 'single' | 'many';
};

/**
 * Field definitions. The label for the left bracket changes at tier 4, where
 * it stops being the finite verb's home and becomes the conjunction's.
 */
function fieldsFor(tier: Tier): Field[] {
  const vorfeld: Field = {
    id: 'vorfeld',
    label: 'Vorfeld',
    a11yLabel: 'Vorfeld, erste Position, ein Satzglied',
    capacity: 'single',
  };

  const linkeKlammer: Field =
    tier >= 4
      ? {
          id: 'linkeKlammer',
          label: 'Konjunktion',
          a11yLabel: 'Linke Klammer, die Konjunktion',
          capacity: 'single',
        }
      : {
          id: 'linkeKlammer',
          label: 'Linke Klammer',
          a11yLabel: 'Linke Klammer, das finite Verb',
          capacity: 'single',
        };

  const mittelfeld: Field = {
    id: 'mittelfeld',
    label: 'Mittelfeld',
    a11yLabel: 'Mittelfeld',
    capacity: 'many',
  };

  // Tier 1 is Vorfeld · finite verb · everything else. Naming the third zone
  // "Mittelfeld" before the right bracket exists would be a lie the learner
  // has to unlearn at tier 2, so it is simply the rest of the sentence.
  const rest: Field = {
    id: 'mittelfeld',
    label: 'Rest',
    a11yLabel: 'Der Rest des Satzes',
    capacity: 'many',
  };

  const rechteKlammer: Field = {
    id: 'rechteKlammer',
    label: 'Rechte Klammer',
    a11yLabel: 'Rechte Klammer, die übrigen Verbteile',
    capacity: 'many',
  };

  const nachfeld: Field = {
    id: 'nachfeld',
    label: 'Nachfeld',
    a11yLabel: 'Nachfeld, hinter der rechten Klammer',
    capacity: 'many',
  };

  switch (tier) {
    case 1:
      return [vorfeld, linkeKlammer, rest];
    case 2:
    case 3:
    case 4:
      return [vorfeld, linkeKlammer, mittelfeld, rechteKlammer];
    case 5:
      return [vorfeld, linkeKlammer, mittelfeld, rechteKlammer, nachfeld];
  }
}

export type ClauseShape = {
  /**
   * A verb-final clause: the left bracket holds a conjunction and the finite
   * verb closes the right bracket. Tier 4 and 5 sentences may be either this
   * or an ordinary main clause — t4-02 is subordinate, t4-03 is a main clause
   * with a subordinate clause sitting in its Vorfeld — so the shape travels
   * with the sentence, not with the tier.
   */
  verbFinal: boolean;
};

/**
 * The zones on the board for this sentence, left to right.
 *
 * A subordinate clause has no Vorfeld at all. Drawing one would offer a slot
 * that must stay empty to be correct, and since slots never reject, a learner
 * could fill it and be told the structure they just built does not exist.
 * The board shows the structure actually in play.
 */
export function boardFields(tier: Tier, shape: ClauseShape = { verbFinal: false }): Field[] {
  const fields = fieldsFor(tier);
  if (!shape.verbFinal) return fields;
  return fields.filter((f) => f.id !== 'vorfeld');
}

/**
 * Whether the Klammer arc can be drawn at this tier. The arc spans the two
 * bracket halves, so before the right bracket exists there is nothing to
 * close — tier 1 has no arc, which is why tier 2 is called "Die Klammer".
 */
export function hasKlammer(tier: Tier): boolean {
  return tier >= 2;
}

/**
 * Whether a sentence is played verb-final, read off its chunks rather than its
 * tier: a conjunction in the left bracket is exactly what pushes the finite
 * verb to the end.
 */
export function isVerbFinal(roles: readonly string[]): boolean {
  return roles.includes('KONJ');
}
