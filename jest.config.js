module.exports = {
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [
    'node_modules/(?!(axios|leaflet|react-leaflet)/)'
  ],
  moduleNameMapper: {
    '^leaflet$': '<rootDir>/node_modules/leaflet/dist/leaflet.js',
  }
};
