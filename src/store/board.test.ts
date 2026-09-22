import { beforeEach, describe, expect, it } from 'vitest';

import { isComplete, useBoardStore } from './board';

const TILES = [
  { id: 'ich', neutralSurface: 'ich', role: 'SUBJ' },
  { id: 'trinke', neutralSurface: 'trinke', role: 'FIN' },
  { id: 'morgens', neutralSurface: 'morgens', role: 'TEMP' },
  { id: 'kaffee', neutralSurface: 'Kaffee', role: 'AKK' },
];

const load = () =>
  useBoardStore
    .getState()
    .load(TILES, ['kaffee', 'ich', 'morgens', 'trinke']);

describe('board store', () => {
  beforeEach(() => {
    useBoardStore.getState().reset();
    load();
  });

  it('starts with everything in the tray', () => {
    const state = useBoardStore.getState();
    expect(state.tray).toHaveLength(4);
    expect(isComplete(state)).toBe(false);
  });

  it('places a tile and removes it from the tray', () => {
    useBoardStore.getState().place('ich', 'vorfeld');
    const state = useBoardStore.getState();
    expect(state.fields.vorfeld).toEqual(['ich']);
    expect(state.tray).not.toContain('ich');
  });

  it('accepts a placement that is obviously wrong', () => {
    // The board must never block this. Being wrong has to be possible or
    // nothing is being tested.
    useBoardStore.getState().place('trinke', 'vorfeld');
    useBoardStore.getState().place('kaffee', 'linkeKlammer');
    const state = useBoardStore.getState();
    expect(state.fields.vorfeld).toEqual(['trinke']);
    expect(state.fields.linkeKlammer).toEqual(['kaffee']);
  });

  it('never leaves a tile in two fields at once', () => {
    const { place } = useBoardStore.getState();
    place('ich', 'vorfeld');
    place('ich', 'mittelfeld');

    const state = useBoardStore.getState();
    expect(state.fields.vorfeld).toEqual([]);
    expect(state.fields.mittelfeld).toEqual(['ich']);
  });

  it('inserts at an index and reflows the rest', () => {
    const { place } = useBoardStore.getState();
    place('morgens', 'mittelfeld');
    place('kaffee', 'mittelfeld');
    place('ich', 'mittelfeld', 0);

    expect(useBoardStore.getState().fields.mittelfeld).toEqual([
      'ich',
      'morgens',
      'kaffee',
    ]);
  });

  it('reorders within a field without duplicating', () => {
    const { place } = useBoardStore.getState();
    place('morgens', 'mittelfeld');
    place('kaffee', 'mittelfeld');
    place('kaffee', 'mittelfeld', 0);

    expect(useBoardStore.getState().fields.mittelfeld).toEqual([
      'kaffee',
      'morgens',
    ]);
  });

  it('returns a tile to the tray', () => {
    const { place, returnToTray } = useBoardStore.getState();
    place('ich', 'vorfeld');
    returnToTray('ich');

    const state = useBoardStore.getState();
    expect(state.fields.vorfeld).toEqual([]);
    expect(state.tray).toContain('ich');
  });

  it('reads the built order across fields in board order', () => {
    const { place } = useBoardStore.getState();
    place('ich', 'vorfeld');
    place('trinke', 'linkeKlammer');
    place('morgens', 'mittelfeld');
    place('kaffee', 'mittelfeld');

    const order = useBoardStore
      .getState()
      .submittedOrder(['vorfeld', 'linkeKlammer', 'mittelfeld']);

    expect(order).toEqual(['ich', 'trinke', 'morgens', 'kaffee']);
  });

  it('is complete only once the tray is empty', () => {
    const { place } = useBoardStore.getState();
    for (const tile of TILES) place(tile.id, 'mittelfeld');
    expect(isComplete(useBoardStore.getState())).toBe(true);
  });

  it('clears the selection when a tile is placed', () => {
    const { select, place } = useBoardStore.getState();
    select('ich');
    expect(useBoardStore.getState().selectedTileId).toBe('ich');
    place('ich', 'vorfeld');
    expect(useBoardStore.getState().selectedTileId).toBeNull();
  });
});

describe('applyOrder', () => {
  beforeEach(() => {
    useBoardStore.getState().reset();
    useBoardStore
      .getState()
      .load(TILES, ['kaffee', 'ich', 'morgens', 'trinke']);
  });

  const FIELDS = ['vorfeld', 'linkeKlammer', 'mittelfeld'] as const;

  it('re-lays a corrected order while keeping each field the same size', () => {
    const { place, applyOrder } = useBoardStore.getState();
    // A wrong board: the finite verb is third.
    place('ich', 'vorfeld');
    place('morgens', 'linkeKlammer');
    place('trinke', 'mittelfeld');
    place('kaffee', 'mittelfeld');

    applyOrder(FIELDS, ['ich', 'trinke', 'morgens', 'kaffee']);

    const state = useBoardStore.getState();
    expect(state.fields.vorfeld).toEqual(['ich']);
    expect(state.fields.linkeKlammer).toEqual(['trinke']);
    expect(state.fields.mittelfeld).toEqual(['morgens', 'kaffee']);
  });

  it('reads back exactly the order it was given', () => {
    const { place, applyOrder } = useBoardStore.getState();
    for (const tile of TILES) place(tile.id, 'mittelfeld');

    const corrected = ['morgens', 'ich', 'kaffee', 'trinke'];
    applyOrder(FIELDS, corrected);

    expect(useBoardStore.getState().submittedOrder(FIELDS)).toEqual(corrected);
  });

  it('clears any selection', () => {
    const { place, select, applyOrder } = useBoardStore.getState();
    place('ich', 'vorfeld');
    select('ich');
    applyOrder(FIELDS, ['ich', 'trinke', 'morgens', 'kaffee']);
    expect(useBoardStore.getState().selectedTileId).toBeNull();
  });
});
