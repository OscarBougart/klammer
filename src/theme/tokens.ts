/**
 * Klammer design tokens — design.md §6.
 *
 * THIS FOLDER IS THE ONLY PLACE IN THE APP WHERE A HEX VALUE, FONT NAME,
 * SPACING NUMBER OR DURATION MAY APPEAR. Everything else imports from here, or
 * uses the Tailwind classes that tailwind.config.js derives from the same JSON.
 *
 * The primitives live in tokens.json because tailwind.config.js is CommonJS and
 * has to read them too. One source, two consumers, no mirror to keep in sync.
 */
import raw from './tokens.json';

/** Seven values. `messing` and `ziegel` never appear together. */
export const palette = raw.palette;

/**
 * schiefer — board ground
 * feld     — field zones, tile tray
 * kante    — hard tile shadow, field edges
 * kreide   — primary type, tile faces
 * grau     — field labels, English gloss, secondary (never below 15px)
 * messing  — the Klammer arc, finite verb, success
 * ziegel   — error state only
 */
export type PaletteToken = keyof typeof palette;

/**
 * Font families.
 *
 * Each weight is registered as its own family, and the type helpers name the
 * family directly rather than leaning on `fontWeight`. React Native on Android
 * will not select a custom face by weight — it synthesises a fake bold off the
 * regular, which on a variable grotesque looks like a smeared version of the
 * real thing. Naming the face is the only way to get the drawn one.
 *
 * These strings are the export names from @expo-google-fonts, which is what
 * useAppFonts registers them under. They must stay in step.
 */
export const fonts = {
  /** Tiles, field labels, numerals. Condensed enough to survive compounds. */
  display: 'BricolageGrotesque_400Regular',
  /** Field labels. */
  displayMedium: 'BricolageGrotesque_500Medium',
  /** Tile faces — design.md §6 puts tiles at the display size, weight 600. */
  displaySemiBold: 'BricolageGrotesque_600SemiBold',
  /** Explanations, glosses, all running text. Maximum letterform clarity. */
  text: 'AtkinsonHyperlegible_400Regular',
  /** Emphasis inside an explanation — the fronted constituent, mostly. */
  textBold: 'AtkinsonHyperlegible_700Bold',
} as const;

/** design.md §6 — 13 / 15 / 17 / 21 / 28 / 40. */
export const fontSize = raw.fontSize;

/** Field labels at 13 carry loose tracking; nothing else is tracked. */
export const tracking = {
  none: 0,
  loose: 0.8,
} as const;

/** 4pt grid. */
export const space = raw.space;

/** Tiles are radius 6 — not pills. Pills read as chips; these are objects. */
export const radius = raw.radius;

/** Hard offset shadows only. No soft blur anywhere in the app. */
export const shadow = {
  tileRest: { offsetY: 2, blur: 0, color: palette.kante },
  tileLifted: { offsetY: 5, blur: 0, color: palette.kante },
} as const;

export const scale = {
  tileRest: 1,
  tileLifted: 1.04,
} as const;

export const duration = {
  /** Tile snap into a slot. */
  snap: 110,
  /** Reduced-motion replacement for every spring. */
  reducedFade: 120,
  /** One shake leg; the tile does two. */
  shakeLeg: 90,
  /** The bracket closing — the app's only scripted animation. */
  arcDraw: 420,
  /** Vorfeld capitalisation flip. */
  capitaliseFlip: 180,
} as const;

/**
 * The Klammer arc. Its height is how far the bracket drops below the fields
 * before running across; the stroke is deliberately thin so it reads as a
 * drawn diagram rather than a UI chrome bar.
 */
export const arc = {
  height: 28,
  stroke: 2,
} as const;

/** Outline weights. Used where colour alone must not carry meaning. */
export const border = {
  hairline: 1,
  emphasis: 2,
} as const;

/** Reanimated spring config for tile lift, follow and settle. */
export const spring = {
  damping: 18,
  stiffness: 220,
} as const;

/** Wrong answers shake the offending tile 3px, twice. No screen flash. */
export const shake = {
  distance: 3,
  legs: 2,
} as const;

/** Accessibility floor — design.md §10. */
export const a11y = {
  /** Minimum touch target, points. */
  minTouchTarget: 48,
  /** `grau` is 4.7:1 on `schiefer` and may never be used below this size. */
  grauMinFontSize: 15,
  /** Tiles wrap rather than truncate up to this type scale multiplier. */
  maxDynamicTypeScale: 2,
} as const;
