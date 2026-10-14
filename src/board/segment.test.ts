import { describe, expect, it } from 'vitest';

import type { FieldId } from './fields';
import { segmentOrder } from './segment';

const TIER1: FieldId[] = ['vorfeld', 'linkeKlammer', 'mittelfeld'];
const TIER2: FieldId[] = ['vorfeld', 'linkeKlammer', 'mittelfeld', 'rechteKlammer'];
const VERB_FINAL: FieldId[] = ['linkeKlammer', 'mittelfeld', 'rechteKlammer'];
const TIER5: FieldId[] = ['vorfeld', 'linkeKlammer', 'mittelfeld', 'rechteKlammer', 'nachfeld'];

const roles: Record<string, string> = {
  ich: 'PRON_NOM',
  trinke: 'FIN',
  morgens: 'TEMP',
  kaffee: 'AKK',
  hat: 'FIN',
  gekauft: 'PART',
  ruft: 'FIN',
  an: 'PTKVZ',
  weil: 'KONJ',
  muss: 'FIN',
  gehen: 'INF',
  bin: 'FIN',
  hause: 'LOK',
  geblieben: 'PART',
  krank: 'NEBENSATZ',
  als: 'VERGL',
};
const roleOf = (id: string) => roles[id];

describe('segmentOrder', () => {
  it('splits a right tier-1 sentence into position 1, verb, rest', () => {
    expect(segmentOrder(['ich', 'trinke', 'morgens', 'kaffee'], roleOf, TIER1)).toEqual({
      vorfeld: ['ich'],
      linkeKlammer: ['trinke'],
      mittelfeld: ['morgens', 'kaffee'],
    });
  });

  it('puts everything before the verb in position 1, so a V2 mistake is visible', () => {
    expect(segmentOrder(['morgens', 'ich', 'trinke', 'kaffee'], roleOf, TIER1)).toEqual({
      vorfeld: ['morgens', 'ich'],
      linkeKlammer: ['trinke'],
      mittelfeld: ['kaffee'],
    });
  });

  it('leaves position 1 empty when the sentence starts with the verb', () => {
    expect(segmentOrder(['trinke', 'ich', 'kaffee'], roleOf, TIER1)).toEqual({
      vorfeld: [],
      linkeKlammer: ['trinke'],
      mittelfeld: ['ich', 'kaffee'],
    });
  });

  it('closes the bracket with a trailing participle at tier 2', () => {
    expect(segmentOrder(['ich', 'hat', 'kaffee', 'gekauft'], roleOf, TIER2)).toEqual({
      vorfeld: ['ich'],
      linkeKlammer: ['hat'],
      mittelfeld: ['kaffee'],
      rechteKlammer: ['gekauft'],
    });
  });

  it('closes the bracket with a separable prefix', () => {
    expect(segmentOrder(['ich', 'ruft', 'morgens', 'an'], roleOf, TIER2).rechteKlammer).toEqual([
      'an',
    ]);
  });

  it('keeps a stray bracket tile where the learner put it', () => {
    expect(segmentOrder(['ich', 'hat', 'gekauft', 'kaffee'], roleOf, TIER2)).toEqual({
      vorfeld: ['ich'],
      linkeKlammer: ['hat'],
      mittelfeld: ['gekauft', 'kaffee'],
      rechteKlammer: [],
    });
  });

  it('puts everything in the rest when there is no finite verb to anchor on', () => {
    expect(segmentOrder(['ich', 'kaffee', 'gekauft'], roleOf, TIER2)).toEqual({
      vorfeld: [],
      linkeKlammer: [],
      mittelfeld: ['ich', 'kaffee'],
      rechteKlammer: ['gekauft'],
    });
  });

  it('opens a verb-final clause with its conjunction and closes it with the verb', () => {
    expect(segmentOrder(['weil', 'ich', 'morgen', 'gehen', 'muss'], roleOf, VERB_FINAL)).toEqual({
      linkeKlammer: ['weil'],
      mittelfeld: ['ich', 'morgen'],
      rechteKlammer: ['gehen', 'muss'],
    });
  });

  it('puts a clause after the bracket in the Nachfeld', () => {
    expect(segmentOrder(['ich', 'bin', 'hause', 'geblieben', 'krank'], roleOf, TIER5)).toEqual({
      vorfeld: ['ich'],
      linkeKlammer: ['bin'],
      mittelfeld: ['hause'],
      rechteKlammer: ['geblieben'],
      nachfeld: ['krank'],
    });
  });

  it('leaves the Nachfeld empty when the clause is fronted', () => {
    expect(segmentOrder(['krank', 'bin', 'ich', 'hause', 'geblieben'], roleOf, TIER5)).toEqual({
      vorfeld: ['krank'],
      linkeKlammer: ['bin'],
      mittelfeld: ['ich', 'hause'],
      rechteKlammer: ['geblieben'],
      nachfeld: [],
    });
  });

  it('keeps a comparison inside the bracket in the Mittelfeld', () => {
    expect(segmentOrder(['ich', 'hat', 'kaffee', 'als', 'gekauft'], roleOf, TIER5)).toMatchObject({
      mittelfeld: ['kaffee', 'als'],
      rechteKlammer: ['gekauft'],
      nachfeld: [],
    });
  });
});
