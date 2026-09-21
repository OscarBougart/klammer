/**
 * Type scale helpers — design.md §6.
 *
 * Every piece of text in the app goes through one of these. Nothing else may
 * name a font or a size. Each helper names its face explicitly; see the note
 * on `fonts` in tokens.ts for why `fontWeight` is not used.
 */
import type { TextStyle } from 'react-native';

import { fonts, fontSize, palette, tracking } from './tokens';

/** Tile faces: display at 21/600, dark type on a chalk face. */
export const tileText: TextStyle = {
  fontFamily: fonts.displaySemiBold,
  fontSize: fontSize.tile,
  color: palette.schiefer,
};

/** A tile holding the finite verb, once correctly placed — face goes brass. */
export const tileTextFinite: TextStyle = {
  ...tileText,
};

/** Field labels: 13 with loose tracking, sentence case, never all-caps. */
export const fieldLabel: TextStyle = {
  fontFamily: fonts.displayMedium,
  fontSize: fontSize.label,
  letterSpacing: tracking.loose,
  color: palette.grau,
};

/** Numerals — progress counters, the week strip. */
export const numeral: TextStyle = {
  fontFamily: fonts.displaySemiBold,
  fontSize: fontSize.bodyLarge,
  color: palette.kreide,
};

/** German explanation text. Always sits above its English gloss. */
export const explanation: TextStyle = {
  fontFamily: fonts.text,
  fontSize: fontSize.body,
  color: palette.kreide,
};

/** The emphasised constituent inside an explanation. */
export const explanationStrong: TextStyle = {
  fontFamily: fonts.textBold,
  fontSize: fontSize.body,
  color: palette.kreide,
};

/**
 * English gloss, muted, under the German. At 15px, which is the floor for
 * `grau` on `schiefer` — 4.7:1 contrast is only acceptable above that size.
 */
export const gloss: TextStyle = {
  fontFamily: fonts.text,
  fontSize: fontSize.body,
  color: palette.grau,
};

export const heading: TextStyle = {
  fontFamily: fonts.displaySemiBold,
  fontSize: fontSize.heading,
  color: palette.kreide,
};

export const display: TextStyle = {
  fontFamily: fonts.displaySemiBold,
  fontSize: fontSize.display,
  color: palette.kreide,
};
