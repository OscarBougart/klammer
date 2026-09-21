// Metro bundler configuration for Expo + NativeWind v4
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// withNativeWind wraps the config to:
//   1. Process global.css through PostCSS + Tailwind
//   2. Make the generated styles available to the NativeWind runtime
module.exports = withNativeWind(config, {
  input: "./global.css", // Entry CSS file with @tailwind directives
});
