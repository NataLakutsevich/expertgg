module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/node_modules/react-native-gesture-handler/jestSetup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-async-storage|@react-navigation|react-native-screens|react-native-gesture-handler|react-native-safe-area-context)/)',
  ],
};
