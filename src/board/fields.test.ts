import { describe, expect, it } from 'vitest';

import { boardFields, clauseShape, hasKlammer, isVerbFinal } from './fields';

describe('boardFields', () => {
  it('shows three zones at tier 1 and calls the third one Rest', () => {
    const fields = boardFields(1);
    expect(fields.map((f) => f.id)).toEqual([
      'vorfeld',
      'linkeKlammer',
      'mittelfeld',
    ]);
    // Naming it Mittelfeld before a right bracket exists is a lie the learner
    // would have to unlearn at tier 2.
    expect(fields[2]?.label).toBe('Rest');
  });

  it('adds the right bracket at tier 2', () => {
    expect(boardFields(2).map((f) => f.id)).toContain('rechteKlammer');
  });

  it('adds the Nachfeld only at tier 5', () => {
    expect(boardFields(4).map((f) => f.id)).not.toContain('nachfeld');
    expect(boardFields(5).map((f) => f.id)).toContain('nachfeld');
  });

  it('renames the left bracket for the conjunction in a verb-final clause', () => {
    expect(boardFields(3)[1]?.label).toBe('Linke Klammer');
    expect(boardFields(4, { verbFinal: true })[0]?.label).toBe('Konjunktion');
  });

  it('keeps the verb in the left bracket of a main clause from tier 4 on', () => {
    // t4 `Weil ich krank war, bin ich …`: `bin` is a verb, not a conjunction.
    expect(boardFields(4)[1]?.label).toBe('Linke Klammer');
    expect(boardFields(5)[1]?.label).toBe('Linke Klammer');
  });

  it('gives a tier-4 main clause a Nachfeld when it has a clause to put there', () => {
    const roles = ['NEBENSATZ', 'FIN', 'PRON_NOM', 'LOK', 'PART'];
    expect(boardFields(4, clauseShape(roles)).map((f) => f.id)).toContain('nachfeld');
    expect(boardFields(4, clauseShape(['PRON_NOM', 'FIN', 'PART'])).map((f) => f.id)).not.toContain(
      'nachfeld',
    );
  });

  it('never gives a verb-final clause a Vorfeld or a Nachfeld', () => {
    const ids = boardFields(5, clauseShape(['KONJ', 'PRON_NOM', 'FIN'])).map((f) => f.id);
    expect(ids).toEqual(['linkeKlammer', 'mittelfeld', 'rechteKlammer']);
  });

  it('drops the Vorfeld for a verb-final clause', () => {
    // t4-01 rejects `ob morgen er kommt` — a subordinate clause has no
    // Vorfeld, so the board must not offer one.
    const fields = boardFields(4, { verbFinal: true });
    expect(fields.map((f) => f.id)).not.toContain('vorfeld');
    expect(fields[0]?.label).toBe('Konjunktion');
  });

  it('keeps the Vorfeld for a main clause at the same tier', () => {
    // t4-03 is a main clause with a subordinate clause in its Vorfeld.
    expect(boardFields(4, { verbFinal: false }).map((f) => f.id)).toContain(
      'vorfeld',
    );
  });

  it('gives the Vorfeld a capacity of exactly one', () => {
    expect(boardFields(1)[0]?.capacity).toBe('single');
  });
});

describe('hasKlammer', () => {
  it('is false at tier 1 — there is no second half to close', () => {
    expect(hasKlammer(1)).toBe(false);
  });

  it('is true from tier 2, which is why that tier is called Die Klammer', () => {
    expect(hasKlammer(2)).toBe(true);
  });
});

describe('isVerbFinal', () => {
  it('reads the conjunction off the roles, not the tier', () => {
    expect(isVerbFinal(['KONJ', 'SUBJ', 'TEMP', 'FIN'])).toBe(true);
    expect(isVerbFinal(['SUBJ', 'FIN', 'TEMP', 'PART', 'NEBENSATZ'])).toBe(false);
  });
});
