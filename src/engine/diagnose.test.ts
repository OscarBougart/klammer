import { describe, expect, it } from 'vitest';

import type { FieldId } from '@/board/fields';

import { diagnoseRule } from './diagnose';

const TIER1: FieldId[] = ['vorfeld', 'linkeKlammer', 'mittelfeld'];
const TIER2: FieldId[] = ['vorfeld', 'linkeKlammer', 'mittelfeld', 'rechteKlammer'];

/** t1-07: Wir wohnen seit drei Jahren in Aachen. */
const tier1Tiles = [
  { id: 'wir', role: 'PRON_NOM' },
  { id: 'wohnen', role: 'FIN' },
  { id: 'jahre', role: 'TEMP' },
  { id: 'aachen', role: 'LOK' },
];

/** t2-16: Ich muss morgen zum Zahnarzt gehen. */
const tier2Tiles = [
  { id: 'ich', role: 'PRON_NOM' },
  { id: 'muss', role: 'FIN' },
  { id: 'morgen', role: 'TEMP' },
  { id: 'arzt', role: 'DIR' },
  { id: 'gehen', role: 'INF' },
];

describe('diagnoseRule', () => {
  it('names verb-second when the verb is not in field two', () => {
    expect(
      diagnoseRule({
        fields: { vorfeld: ['wir'], linkeKlammer: ['jahre'], mittelfeld: ['wohnen', 'aachen'] },
        fieldOrder: TIER1,
        tiles: tier1Tiles,
        sentenceRuleId: 'tekamolo-te-lo',
      }),
    ).toBe('v2-deklarativ');
  });

  it('names verb-second when the Vorfeld holds two constituents', () => {
    expect(
      diagnoseRule({
        fields: { vorfeld: ['wir', 'jahre'], linkeKlammer: ['wohnen'], mittelfeld: ['aachen'] },
        fieldOrder: TIER1,
        tiles: tier1Tiles,
        sentenceRuleId: 'tekamolo-te-lo',
      }),
    ).toBe('v2-deklarativ');
  });

  it("falls back to the sentence's rule once the verb is second", () => {
    expect(
      diagnoseRule({
        fields: { vorfeld: ['wir'], linkeKlammer: ['wohnen'], mittelfeld: ['aachen', 'jahre'] },
        fieldOrder: TIER1,
        tiles: tier1Tiles,
        sentenceRuleId: 'tekamolo-te-lo',
      }),
    ).toBe('tekamolo-te-lo');
  });

  it('names the bracket rule when the infinitive is not in the right bracket', () => {
    expect(
      diagnoseRule({
        fields: {
          vorfeld: ['ich'],
          linkeKlammer: ['muss'],
          mittelfeld: ['morgen', 'gehen'],
          rechteKlammer: ['arzt'],
        },
        fieldOrder: TIER2,
        tiles: tier2Tiles,
        sentenceRuleId: 'negation-vor-klammer',
      }),
    ).toBe('satzklammer-modal');
  });

  it("prefers the sentence's own bracket rule when it is one", () => {
    expect(
      diagnoseRule({
        fields: {
          vorfeld: ['ich'],
          linkeKlammer: ['muss'],
          mittelfeld: ['morgen', 'arzt', 'gehen'],
          rechteKlammer: [],
        },
        fieldOrder: TIER2,
        tiles: tier2Tiles,
        sentenceRuleId: 'satzklammer-modal',
      }),
    ).toBe('satzklammer-modal');
  });

  it('leaves verb-final clauses to their own rule', () => {
    expect(
      diagnoseRule({
        fields: { linkeKlammer: ['weil'], mittelfeld: [], rechteKlammer: [] },
        fieldOrder: ['linkeKlammer', 'mittelfeld', 'rechteKlammer'],
        tiles: [{ id: 'weil', role: 'KONJ' }, { id: 'kommt', role: 'FIN' }],
        sentenceRuleId: 'verbletzt',
      }),
    ).toBe('verbletzt');
  });
});
