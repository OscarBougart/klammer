import { beforeEach, describe, expect, it } from 'vitest';

import { bankTiles, isComplete, useBoardStore } from './board';

const TILES = [
  { id: 'ich', neutralSurface: 'ich', role: 'SUBJ' },
  { id: 'trinke', neutralSurface: 'trinke', role: 'FIN' },
  { id: 'morgens', neutralSurface: 'morgens', role: 'TEMP' },
  { id: 'kaffee', neutralSurface: 'Kaffee', role: 'AKK' },
];

const BANK = ['kaffee', 'ich', 'morgens', 'trinke'];

describe('board store', () => {
  beforeEach(() => {
    useBoardStore.getState().reset();
    useBoardStore.getState().load(TILES, BANK);
  });

  it('starts with every tile in the bank and an empty row', () => {
    const state = useBoardStore.getState();
    expect(state.line).toEqual([]);
    expect(bankTiles(state)).toEqual(BANK);
    expect(isComplete(state)).toBe(false);
  });

  it('adds each tapped tile to the end of the row, in tap order', () => {
    const { append } = useBoardStore.getState();
    append('ich');
    append('trinke');
    append('morgens');
    expect(useBoardStore.getState().line).toEqual(['ich', 'trinke', 'morgens']);
  });

  it('accepts an order that is obviously wrong', () => {
    // The board must never block this. Being wrong has to be possible or
    // nothing is being tested.
    const { append } = useBoardStore.getState();
    append('kaffee');
    append('morgens');
    expect(useBoardStore.getState().line).toEqual(['kaffee', 'morgens']);
  });

  it('returns a removed tile to its own bank slot', () => {
    const { append, remove } = useBoardStore.getState();
    append('ich');
    append('morgens');
    remove('ich');

    const state = useBoardStore.getState();
    expect(state.line).toEqual(['morgens']);
    expect(bankTiles(state)).toEqual(['kaffee', 'ich', 'trinke']);
  });

  it('inserts at an index and moves a tile already in the row', () => {
    const { append, insert } = useBoardStore.getState();
    append('ich');
    append('morgens');
    insert('trinke', 1);
    expect(useBoardStore.getState().line).toEqual(['ich', 'trinke', 'morgens']);

    insert('ich', 3);
    expect(useBoardStore.getState().line).toEqual(['trinke', 'morgens', 'ich']);
  });

  it('never holds a tile twice', () => {
    const { append } = useBoardStore.getState();
    append('ich');
    append('ich');
    expect(useBoardStore.getState().line).toEqual(['ich']);
  });

  it('is complete only once the bank is empty', () => {
    const { append } = useBoardStore.getState();
    for (const tile of TILES) append(tile.id);
    expect(isComplete(useBoardStore.getState())).toBe(true);
  });

  it('replaces the row with a corrected order', () => {
    const { append, setLine } = useBoardStore.getState();
    for (const id of ['morgens', 'ich', 'trinke', 'kaffee']) append(id);
    setLine(['ich', 'trinke', 'morgens', 'kaffee']);
    expect(useBoardStore.getState().line).toEqual(['ich', 'trinke', 'morgens', 'kaffee']);
  });
});
