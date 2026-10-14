// Metro bundler configuration for Expo + NativeWind v4
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Drizzle ships migrations as .sql files that src/db/migrations/migrations.js
// imports directly. Metro must resolve them as source, and babel-plugin-inline-import
// (see babel.config.js) turns each one into a string before the JavaScript
// parser ever sees `CREATE TABLE`. Both halves are required: sourceExts alone
// makes Metro hand raw SQL to the JS parser and the build fails.
config.resolver.sourceExts.push("sql");

// expo-sqlite's web build loads wa-sqlite from a .wasm file. Without this the
// web preview's database worker never starts. Native builds are unaffected.
config.resolver.assetExts.push("wasm");

// withNativeWind wraps the config to:
//   1. Process global.css through PostCSS + Tailwind
//   2. Make the generated styles available to the NativeWind runtime
module.exports = withNativeWind(config, {
  input: "./global.css", // Entry CSS file with @tailwind directives
});
