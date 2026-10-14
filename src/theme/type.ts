/**
 * Type scale helpers — design.md §6.
 *
 * Every piece of text in the app goes through one of these, via
 * `useTheme().type` so the colours follow the theme. Nothing else may
 * name a font or a size. Each helper names its face explicitly; see the note
 * on `fonts` in tokens.ts for why `fontWeight` is not used.
 */
import type { TextStyle } from 'react-native';

import { fonts, fontSize, tracking, type Palette } from './tokens';

/** The type scale in one theme's colours. Built once per theme (useTheme.ts). */
export function typeScale(palette: Palette) {
  /** Tile faces: display at 21/600, dark type on a chalk face. */
  const tileText: TextStyle = {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSize.tile,
    color: palette.schiefer,
  };

  /** A tile holding the finite verb, once correctly placed — face goes brass. */
  const tileTextFinite: TextStyle = {
    ...tileText,
  };

  /** Field labels: 13 with loose tracking, sentence case, never all-caps. */
  const fieldLabel: TextStyle = {
    fontFamily: fonts.displayMedium,
    fontSize: fontSize.label,
    letterSpacing: tracking.loose,
    color: palette.grau,
  };

  /** Numerals — progress counters, the week strip. */
  const numeral: TextStyle = {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSize.bodyLarge,
    color: palette.kreide,
  };

  /** German explanation text. Always sits above its English gloss. */
  const explanation: TextStyle = {
    fontFamily: fonts.text,
    fontSize: fontSize.body,
    color: palette.kreide,
  };

  /** The emphasised constituent inside an explanation. */
  const explanationStrong: TextStyle = {
    fontFamily: fonts.textBold,
    fontSize: fontSize.body,
    color: palette.kreide,
  };

  /**
   * English gloss, muted, under the German. At 15px, which is the floor for
   * `grau` on `schiefer` — 4.7:1 contrast is only acceptable above that size.
   */
  const gloss: TextStyle = {
    fontFamily: fonts.text,
    fontSize: fontSize.body,
    color: palette.grau,
  };

  /**
   * Button labels. Display face at 17: the main action on a screen is the one
   * thing a first-time learner must find, so it does not whisper in body text.
   */
  const buttonLabel: TextStyle = {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSize.bodyLarge,
    color: palette.kreide,
  };

  /**
   * The sentence as the learner is building it, read as one line above the
   * board. Display face, between body and tile size, so it reads as the result
   * of the tiles rather than as another tile.
   */
  const sentenceLine: TextStyle = {
    fontFamily: fonts.displayMedium,
    fontSize: fontSize.bodyLarge,
    color: palette.kreide,
  };

  const heading: TextStyle = {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSize.heading,
    color: palette.kreide,
  };

  const display: TextStyle = {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSize.display,
    color: palette.kreide,
  };

  /** The small tiles in Home's sample sentence: same face, a size down. */
  const miniTileText: TextStyle = {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSize.bodyLarge,
    color: palette.schiefer,
  };

  /** A Stufe's name in the level path. */
  const levelName: TextStyle = {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSize.bodyLarge,
    color: palette.kreide,
  };

  return {
    tileText,
    tileTextFinite,
    fieldLabel,
    numeral,
    explanation,
    explanationStrong,
    gloss,
    buttonLabel,
    sentenceLine,
    heading,
    display,
    miniTileText,
    levelName,
  };
}

export type TypeScale = ReturnType<typeof typeScale>;
