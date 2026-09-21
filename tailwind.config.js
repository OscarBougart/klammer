/**
 * Tailwind / NativeWind config.
 *
 * Every value here is read from src/theme/tokens.json — the same file
 * src/theme/tokens.ts reads. Do not add a literal colour, size or spacing
 * value to this file; add it to the JSON and it appears in both places.
 */
const tokens = require("./src/theme/tokens.json");

/** Tailwind wants strings for sizes; the JSON stores points. */
const px = (obj) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, `${v}px`]));

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],

  presets: [require("nativewind/preset")],

  theme: {
    // Replaced, not extended: the palette is exactly seven values and the app
    // must not be able to reach for a stray Tailwind blue.
    colors: {
      transparent: "transparent",
      ...tokens.palette,
    },

    extend: {
      // Each weight is its own family — Android will not pick a custom face
      // by fontWeight. See the note on `fonts` in src/theme/tokens.ts.
      fontFamily: {
        display: ["BricolageGrotesque_400Regular"],
        "display-medium": ["BricolageGrotesque_500Medium"],
        "display-semibold": ["BricolageGrotesque_600SemiBold"],
        text: ["AtkinsonHyperlegible_400Regular"],
        "text-bold": ["AtkinsonHyperlegible_700Bold"],
      },

      fontSize: px(tokens.fontSize),
      spacing: px(tokens.space),
      borderRadius: px(tokens.radius),
    },
  },

  plugins: [],
};
