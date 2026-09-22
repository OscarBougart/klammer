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
      // Drizzle's migrations bundle imports .sql files directly. This inlines
      // them as strings at build time; without it Metro hands the SQL to the
      // JavaScript parser and the build dies on `CREATE TABLE`.
      ["inline-import", { extensions: [".sql"] }],

      // Worklet transform. Reanimated 4 extracted worklets into
      // react-native-worklets, and `react-native-reanimated/plugin` is now only
      // a shim that re-exports this one — so name the real plugin, which will
      // outlive the shim.
      //
      // MUST be listed last among plugins.
      "react-native-worklets/plugin",
    ],
  };
};
