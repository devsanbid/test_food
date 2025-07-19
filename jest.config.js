module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/models/**/*.js',
    '!src/models/index.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  testTimeout: 30000,
  verbose: true,
  transform: {
    '^.+\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(mongodb-memory-server)/)',
  ],
  moduleNameMapper: {
    '^(\.{1,2}/.*)\.js$': '$1'
  },
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};