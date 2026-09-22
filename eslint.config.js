/**
 * ESLint flat config.
 *
 * The rule that matters here is the hex ban. CLAUDE.md says a hex value, font
 * name, spacing number or duration may not appear outside src/theme/. A rule
 * can only reliably catch the first of those, so it catches that one and the
 * rest is review discipline.
 */
const expoConfig = require("eslint-config-expo/flat");

/** Any string that is a CSS hex colour, with or without alpha. */
const HEX = "/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/";

module.exports = [
  ...expoConfig,

  {
    ignores: [
      "node_modules/**",
      ".expo/**",
      "android/**",
      "ios/**",
      "content/generated/**",
    ],
  },

  {
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: `Literal[value=${HEX}]`,
          message:
            "No hex literals outside src/theme/. Import a token from @/theme.",
        },
        {
          selector: `TemplateElement[value.raw=${HEX}]`,
          message:
            "No hex literals outside src/theme/. Import a token from @/theme.",
        },
      ],
    },
  },

  {
    // The one folder allowed to name a colour.
    files: ["src/theme/**"],
    rules: { "no-restricted-syntax": "off" },
  },

  {
    // Reanimated's SharedValue is mutated by design — `sv.value = x` is the
    // whole API. The React Compiler rule assumes React state semantics and
    // reads every assignment as a mistake, so it is a false positive here and
    // nowhere else. Scoped to the board, which is the only place Reanimated
    // lives.
    files: ["src/board/**"],
    rules: { "react-hooks/immutability": "off" },
  },

  {
    // Setting state from an effect after async work (loading a session from
    // SQLite) or when derived input changes (a new sentence is dealt) is the
    // pattern React still sanctions without Suspense. Arrived with the
    // React-Compiler-aware config in SDK 57; reviewed case by case and none of
    // the four are bugs.
    //
    // Worth revisiting — the guidance is sound in general, and these would be
    // cleaner as derived state — but not during an SDK upgrade, and not in
    // code that has never run on a device.
    files: ["app/**", "src/board/Tile.tsx"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
];
