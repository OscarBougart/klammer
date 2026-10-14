/**
 * These tests guard the authored content against the review tool.
 *
 * The failure being prevented is not "the vetoes came out wrong" — it is "a
 * month of hand-authored sentences came back with their comments stripped and
 * their alignment reflowed". So the assertions are mostly about what did NOT
 * change.
 */
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';

import { applyDecisions, PatchError } from './patch-yaml';

const DOC = `# Tier 1 — Position zwei.
#
# Authored source of truth.

- id: t1-01
  tier: 1
  ruleId: v2-deklarativ
  gloss: I drink coffee in the mornings.
  # Kaffee is bare, so it cannot climb over the temporal.
  chunks:
    - { id: ich,     surface: "Ich",     neutralSurface: "ich",     role: SUBJ }
    - { id: trinke,  surface: "trinke",  neutralSurface: "trinke",  role: FIN }
    - { id: morgens, surface: "Morgens", neutralSurface: "morgens", role: TEMP }
    - { id: kaffee,  surface: "Kaffee",  neutralSurface: "Kaffee",  role: AKK, definite: false }
  canonical: [ich, trinke, morgens, kaffee]

- id: t1-02
  tier: 1
  ruleId: v2-deklarativ
  gloss: The train arrives in ten minutes.
  chunks:
    - { id: zug,   surface: "Der Zug", neutralSurface: "der Zug", role: SUBJ }
    - { id: kommt, surface: "kommt",   neutralSurface: "kommt",   role: FIN }
  canonical: [zug, kommt]
`;

describe('applyDecisions', () => {
  it('records vetoes and the reviewed flag', () => {
    const out = applyDecisions(DOC, 't1-01', {
      vetoed: [['kaffee', 'trinke', 'ich', 'morgens']],
      reviewed: true,
    });

    const parsed = load(out) as Record<string, unknown>[];
    expect(parsed[0]?.vetoed).toEqual([['kaffee', 'trinke', 'ich', 'morgens']]);
    expect(parsed[0]?.reviewed).toBe(true);
  });

  it('leaves comments and alignment in the rest of the file untouched', () => {
    const out = applyDecisions(DOC, 't1-01', { vetoed: [], reviewed: true });

    expect(out).toContain('# Tier 1 — Position zwei.');
    expect(out).toContain('# Kaffee is bare, so it cannot climb over the temporal.');
    // The aligned chunk table is the thing a dump/reload would destroy.
    expect(out).toContain(
      '    - { id: ich,     surface: "Ich",     neutralSurface: "ich",     role: SUBJ }',
    );
  });

  it('does not touch a sentence it was not asked about', () => {
    const out = applyDecisions(DOC, 't1-01', {
      vetoed: [['kaffee', 'trinke', 'ich', 'morgens']],
      reviewed: true,
    });

    const parsed = load(out) as Record<string, unknown>[];
    expect(parsed[1]).toEqual((load(DOC) as unknown[])[1]);
  });

  it('replaces previous decisions rather than appending a second copy', () => {
    const once = applyDecisions(DOC, 't1-01', {
      vetoed: [['kaffee', 'trinke', 'ich', 'morgens']],
      reviewed: true,
    });
    const twice = applyDecisions(once, 't1-01', {
      vetoed: [['morgens', 'trinke', 'ich', 'kaffee']],
      reviewed: true,
    });

    const parsed = load(twice) as Record<string, unknown>[];
    expect(parsed[0]?.vetoed).toEqual([['morgens', 'trinke', 'ich', 'kaffee']]);
    expect(twice.match(/vetoed:/g)).toHaveLength(1);
  });

  it('clears vetoes when the author takes them back', () => {
    const withVeto = applyDecisions(DOC, 't1-01', {
      vetoed: [['kaffee', 'trinke', 'ich', 'morgens']],
      reviewed: true,
    });
    const cleared = applyDecisions(withVeto, 't1-01', {
      vetoed: [],
      reviewed: true,
    });

    const parsed = load(cleared) as Record<string, unknown>[];
    expect(parsed[0]?.vetoed).toBeUndefined();
    expect(cleared).not.toContain('vetoed:');
  });

  it('is idempotent', () => {
    const decisions = { vetoed: [['kaffee', 'trinke', 'ich', 'morgens']], reviewed: true };
    const once = applyDecisions(DOC, 't1-01', decisions);
    expect(applyDecisions(once, 't1-01', decisions)).toBe(once);
  });

  it('patches the last sentence in a file', () => {
    const out = applyDecisions(DOC, 't1-02', { vetoed: [], reviewed: true });
    const parsed = load(out) as Record<string, unknown>[];
    expect(parsed[1]?.reviewed).toBe(true);
    expect(parsed).toHaveLength(2);
  });

  it('refuses an unknown sentence rather than writing nothing quietly', () => {
    expect(() =>
      applyDecisions(DOC, 'nope', { vetoed: [], reviewed: true }),
    ).toThrow(PatchError);
  });

  it('refuses a document where the id appears twice', () => {
    expect(() =>
      applyDecisions(`${DOC}\n- id: t1-01\n  tier: 1\n`, 't1-01', {
        vetoed: [],
        reviewed: true,
      }),
    ).toThrow(PatchError);
  });
});
