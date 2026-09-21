/** @type {import('@babel/core').TransformOptions} */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // babel-preset-expo handles JSX + TS transforms
      // jsxImportSource: "nativewind" enables className → style prop transformation
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],

      // NativeWind v4 preset — transforms Tailwind className strings at build time
      "nativewind/babel",
    ],
    plugins: [
      // react-native-reanimated v4 plugin — transforms worklet functions
      // MUST be listed last among plugins
      "react-native-reanimated/plugin",
    ],
  };
};
