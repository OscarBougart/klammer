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

/**
 * Button labels. Display face at 17: the main action on a screen is the one
 * thing a first-time learner must find, so it does not whisper in body text.
 */
export const buttonLabel: TextStyle = {
  fontFamily: fonts.displaySemiBold,
  fontSize: fontSize.bodyLarge,
  color: palette.kreide,
};

/**
 * The sentence as the learner is building it, read as one line above the
 * board. Display face, between body and tile size, so it reads as the result
 * of the tiles rather than as another tile.
 */
export const sentenceLine: TextStyle = {
  fontFamily: fonts.displayMedium,
  fontSize: fontSize.bodyLarge,
  color: palette.kreide,
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

/** The small tiles in Home's sample sentence: same face, a size down. */
export const miniTileText: TextStyle = {
  fontFamily: fonts.displaySemiBold,
  fontSize: fontSize.bodyLarge,
  color: palette.schiefer,
};

/** A Stufe's name in the level path. */
export const levelName: TextStyle = {
  fontFamily: fonts.displaySemiBold,
  fontSize: fontSize.bodyLarge,
  color: palette.kreide,
};
