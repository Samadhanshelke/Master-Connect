const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = withNativeWind(getDefaultConfig(__dirname), { input: "./global.css" });

// Firebase JS Auth breaks under Metro's package.json "exports" resolution
// (Expo SDK 53+/RN 0.79+). Disable it so auth registers correctly.
config.resolver.sourceExts.push("cjs");
config.resolver.unstable_enablePackageExports = false;

module.exports = config;