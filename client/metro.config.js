const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  config.resolver.extraNodeModules = {
    'react-native': require.resolve('react-native-web'),
  };

  config.resolver.sourceExts = [
     ...config.resolver.sourceExts,
    'cjs',
    'web.tsx',
    'web.ts',
    'web.jsx',
    'web.js',
    'tsx',
    'ts',
    'jsx',
    'js',
  ];

  config.resolver.blockList = [
    /node_modules\/react-native\/.*\/PlatformColorValueTypes\/.*/
  ];

  return config;
})();

