/**
 * The line under the board that says what to do next.
 *
 * Two modes. The guided first sentence (PRODUCT.md: "obvious in the first ten
 * seconds") walks a new learner through one real puzzle: tap words into the
 * row, take one back out, the verb goes second, check. After that the guide
 * gets out of the way and only the hints worth repeating remain.
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
  /** Words still in the bank. */
  bankCount: number;
  /** Words already in the sentence row. */
  lineCount: number;
  /** The finite verb is the second word of the row. */
  verbSecond: boolean;
  /** The current verdict, once checked. */
  verdict: Verdict | null;
  /** This verdict came from a second try, which does not count. */
  isRetry: boolean;
};

export function guideLine(state: GuideState): GuideLine | null {
  const { guided, bankCount, lineCount, verbSecond, verdict, isRetry } = state;

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
          en: 'No problem. Try again, or have the answer shown to you.',
        }
      : {
          de: 'Geschafft. Das Verb stand an Position 2, das ist die Grundregel.',
          en: 'Done. The verb was in position 2; that is the basic rule.',
        };
  }

  if (bankCount === 0) {
    return {
      de: 'Alle Wörter stehen im Satz. Tippe auf Prüfen.',
      en: 'Every word is in the sentence. Tap Prüfen to check.',
    };
  }

  if (lineCount === 0) {
    return {
      de: 'Tippe die Wörter in der richtigen Reihenfolge an.',
      en: 'Tap the words in the right order.',
    };
  }

  if (!guided) return null;

  if (lineCount === 1) {
    return {
      de: 'Falsches Wort? Tippe es im Satz an, dann geht es zurück.',
      en: 'Wrong word? Tap it in the sentence to send it back.',
    };
  }

  return verbSecond
    ? {
        de: 'Gut, das Verb steht an Position 2. Der Rest kommt danach.',
        en: 'Good, the verb is in position 2. The rest comes after it.',
      }
    : {
        de: 'Tipp: Das konjugierte Verb steht immer an Position 2.',
        en: 'Tip: the conjugated verb always goes in position 2.',
      };
}
