/**
 * The app icon and splash mark, drawn from the theme tokens — E7.3.
 *
 * The mark is the picture on Home's sample card reduced to its bones: a brass
 * tile (the finite verb), a chalk tile (the other half of the bracket), and a
 * brass bracket joining them underneath. No text — the name sits under the
 * icon everywhere it appears.
 *
 * Colours come from src/theme/tokens.json, so the icon follows the palette and
 * no hex value is written outside the theme. Run `npm run icons` after a
 * palette change and commit the PNGs.
 *
 * Android's adaptive icon crops its foreground to a mask anywhere inside the
 * middle 66 of 108 dp, so the foreground keeps the whole mark within that
 * circle. The store icon and the legacy icon are full-bleed squares and can
 * carry the mark larger.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import sharp from 'sharp';

import tokens from '../src/theme/tokens.json';

const { schiefer, kreide, messing } = tokens.palette;

const OUT = join(__dirname, '..', 'assets', 'images');

/**
 * The mark in its own units. The tiles are unequal on purpose: a short
 * finite verb and a long closing part, the way a bracket sentence looks
 * (`hat … gemacht`). Two equal blocks over a curve read as a face. The
 * bracket is shallow and square-cornered like the board's, not a smile.
 */
const VERB_W = 170;
const OTHER_W = 300;
const GAP = 60;
const TILE_H = 130;
const TILE_R = 24;

const STROKE = 30;
const BRACKET_TOP = TILE_H + 28;
const BRACKET_DEPTH = 64;
const BRACKET_R = 16;

const MARK_WIDTH = VERB_W + GAP + OTHER_W;
const MARK_HEIGHT = BRACKET_TOP + BRACKET_DEPTH;

type Paint = {
  verb: string;
  other: string;
  bracket: string;
};

const COLOUR: Paint = { verb: messing, other: kreide, bracket: messing };
/** Android 13 themed icons use the alpha channel only; one ink. */
const MONO: Paint = { verb: 'white', other: 'white', bracket: 'white' };

/** Flat on purpose: no bottom edge or shadow, nothing that fakes depth. */
function tile(x: number, width: number, face: string): string {
  return `<rect x="${x}" y="0" width="${width}" height="${TILE_H}" rx="${TILE_R}" fill="${face}"/>`;
}

function bracket(colour: string): string {
  const left = VERB_W / 2;
  const right = VERB_W + GAP + OTHER_W / 2;
  const top = BRACKET_TOP;
  const bottom = BRACKET_TOP + BRACKET_DEPTH;
  const r = BRACKET_R;
  const d = [
    `M ${left} ${top}`,
    `V ${bottom - r}`,
    `A ${r} ${r} 0 0 0 ${left + r} ${bottom}`,
    `H ${right - r}`,
    `A ${r} ${r} 0 0 0 ${right} ${bottom - r}`,
    `V ${top}`,
  ].join(' ');
  return `<path d="${d}" fill="none" stroke="${colour}" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function mark(paint: Paint): string {
  return [
    tile(0, VERB_W, paint.verb),
    tile(VERB_W + GAP, OTHER_W, paint.other),
    bracket(paint.bracket),
  ].join('');
}

/**
 * The mark centred on a square canvas, scaled so it spans `fraction` of the
 * canvas width.
 */
function svg(size: number, fraction: number, paint: Paint, background: string | null): string {
  const scale = (size * fraction) / MARK_WIDTH;
  const x = (size - MARK_WIDTH * scale) / 2;
  // The bracket hangs below the tiles; centre the whole group, stroke included.
  const y = (size - (MARK_HEIGHT + STROKE / 2) * scale) / 2;
  const bg = background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    bg +
    `<g transform="translate(${x} ${y}) scale(${scale})">${mark(paint)}</g>` +
    `</svg>`
  );
}

async function write(name: string, source: string): Promise<void> {
  await sharp(Buffer.from(source)).png().toFile(join(OUT, name));
  console.log(`  ${name}`);
}

/**
 * Inside the adaptive icon's 66/108 safe circle with some air: the mark's
 * half-diagonal at this width stays under the circle's radius.
 */
const SAFE_FRACTION = 0.54;
/** Full-bleed squares: the store and launcher round the corners themselves. */
const FULL_FRACTION = 0.68;

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  console.log('Writing icons to assets/images:');
  await write('icon.png', svg(1024, FULL_FRACTION, COLOUR, schiefer));
  await write('play-store-icon.png', svg(512, FULL_FRACTION, COLOUR, schiefer));
  // The background colour is app.json's android.adaptiveIcon.backgroundColor.
  await write('adaptive-icon.png', svg(1024, SAFE_FRACTION, COLOUR, null));
  await write('adaptive-monochrome.png', svg(1024, SAFE_FRACTION, MONO, null));
  // Android 12+ shows the splash icon inside a circle, like the adaptive icon.
  await write('splash-icon.png', svg(1024, SAFE_FRACTION, COLOUR, null));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
