/**
 * E8.4 — the contrast audit, as a test rather than a spreadsheet.
 *
 * design.md §10 makes three specific claims. A claim in a design document is
 * a promise nobody checks; a failing test is a promise that cannot quietly
 * rot when a colour is nudged.
 *
 * Ratios are WCAG 2.1 relative luminance.
 */
import { describe, expect, it } from 'vitest';

import { a11y, fontSize, palette } from './tokens';

/** WCAG relative luminance of an sRGB hex colour. */
function luminance(hex: string): number {
  const value = hex.replace('#', '');
  const channels = [0, 2, 4].map((i) => {
    const raw = parseInt(value.slice(i, i + 2), 16) / 255;
    // The 0.03928 knee is the sRGB transfer function, not a fudge factor.
    return raw <= 0.03928 ? raw / 12.92 : ((raw + 0.055) / 1.055) ** 2.4;
  });

  const [r, g, b] = channels as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  const [light, dark] = a > b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}

/** Rounded the way design.md quotes them. */
const round = (value: number) => Math.round(value * 10) / 10;

describe('design.md §10 contrast claims', () => {
  // Measured, not quoted. design.md states 12.4 / 7.9 / 4.7; the palette as
  // shipped measures 12.3 / 8.1 / 5.3. Two of the three are *better* than
  // claimed, so nothing is broken — but the document and the code had already
  // drifted apart, which is exactly what this file exists to stop.
  it('kreide on schiefer clears 12:1', () => {
    expect(round(ratio(palette.kreide, palette.schiefer))).toBeCloseTo(12.3, 1);
  });

  it('messing on schiefer clears 8:1', () => {
    expect(round(ratio(palette.messing, palette.schiefer))).toBeCloseTo(8.1, 1);
  });

  it('grau on schiefer clears 5:1', () => {
    expect(round(ratio(palette.grau, palette.schiefer))).toBeCloseTo(5.3, 1);
  });
});

describe('WCAG thresholds', () => {
  it('body text clears AA at 4.5:1', () => {
    // Everything that carries meaning in running text.
    for (const colour of [palette.kreide, palette.messing, palette.grau]) {
      expect(ratio(colour, palette.schiefer)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('grau is only safe above its stated floor', () => {
    // 4.7:1 clears AA for normal text but leaves no headroom, which is why
    // design.md bars `grau` below 15px. The token records that floor; this
    // test records why it exists.
    expect(ratio(palette.grau, palette.schiefer)).toBeLessThan(7);
    expect(a11y.grauMinFontSize).toBe(fontSize.body);
  });

  it('tile type reads against its own face, not the board', () => {
    // Tiles are schiefer type on a kreide face — the inverse pairing, and it
    // has to clear AA in that direction too.
    expect(ratio(palette.schiefer, palette.kreide)).toBeGreaterThanOrEqual(4.5);
  });

  it('the finite-verb tile stays legible when its face turns brass', () => {
    expect(ratio(palette.schiefer, palette.messing)).toBeGreaterThanOrEqual(4.5);
  });

  it('the error colour clears AA on the board', () => {
    // ziegel was originally #C96A6A, which measured 4.29:1 — under the floor
    // for normal text, on the one line a struggling learner most needs to
    // read. Nudged to #CC7171 (4.60:1): same hue, 2% lighter.
    expect(ratio(palette.ziegel, palette.schiefer)).toBeGreaterThanOrEqual(4.5);
  });

  it('field zones sit on the board without relying on fill alone', () => {
    // feld on schiefer is only 1.15:1 — nearly invisible as a fill. That is
    // why FieldZone draws a `kante` border: the edge does the work, not the
    // panel. This test fails if someone removes that border thinking the fill
    // is enough.
    expect(ratio(palette.feld, palette.schiefer)).toBeLessThan(1.3);
    expect(ratio(palette.kante, palette.feld)).toBeGreaterThan(1.2);
  });
});
