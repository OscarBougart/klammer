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
];
