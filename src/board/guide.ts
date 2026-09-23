/**
 * The line under the board that says what to do next.
 *
 * Two modes. The guided first sentence (PRODUCT.md: "obvious in the first ten
 * seconds") walks a new learner through one real puzzle: pick a tile, put it
 * in a field, the verb goes second, check. After that the guide gets out of
 * the way and only the two hints worth repeating remain.
 *
 * Every step is read off the board's state rather than advanced by a script,
 * so a learner who skips ahead, drags instead of tapping, or undoes a move is
 * never shown a step that no longer fits.
 */
import type { Verdict } from '@/engine/validate';

export type GuideLine = { de: string; en: string };

export type GuideState = {
  /** The guided first sentence is still running. */
  guided: boolean;
  /** Tiles still in the tray. */
  trayCount: number;
  /** Tiles already placed on the board. */
  placedCount: number;
  /** A tile is waiting for a destination (tap-to-place). */
  hasSelection: boolean;
  /** The finite verb sits in the left bracket. */
  verbInPlace: boolean;
  /** The current verdict, once checked. */
  verdict: Verdict | null;
  /** This verdict came from a second try, which does not count. */
  isRetry: boolean;
};

export function guideLine(state: GuideState): GuideLine | null {
  const { guided, trayCount, placedCount, hasSelection, verbInPlace, verdict, isRetry } = state;

  if (verdict !== null) {
    if (isRetry) {
      return {
        de: 'Gewertet wird nur der erste Versuch.',
        en: 'Only your first try counts.',
      };
    }
    if (!guided) return null;
    return verdict === 'falsch'
      ? {
          de: 'Kein Problem. Versuch es nochmal oder lass dir die Lösung zeigen.',
          en: 'No problem. Try again, or have the fix shown to you.',
        }
      : {
          de: 'Geschafft. Das Verb stand an Position 2, das ist die Grundregel.',
          en: 'Done. The verb was in position 2; that is the basic rule.',
        };
  }

  if (hasSelection) {
    return {
      de: 'Jetzt ein Feld antippen. Jedes Feld nimmt jeden Baustein an.',
      en: 'Now tap a field. Every field accepts any tile.',
    };
  }

  if (trayCount === 0) {
    return {
      de: 'Alle Bausteine gesetzt. Tippe auf Prüfen.',
      en: 'All tiles placed. Tap Prüfen to check.',
    };
  }

  if (placedCount === 0) {
    return {
      de: 'Tippe einen Baustein an, dann ein Feld. Oder zieh ihn hin.',
      en: 'Tap a tile, then a field. Or drag it there.',
    };
  }

  if (!guided) return null;

  return verbInPlace
    ? {
        de: 'Gut. Vorn steht genau ein Satzteil, alles andere kommt danach.',
        en: 'Good. Exactly one part goes in front; everything else comes after.',
      }
    : {
        de: 'Tipp: Das konjugierte Verb steht immer an Position 2.',
        en: 'Tip: the conjugated verb always goes in position 2.',
      };
}
