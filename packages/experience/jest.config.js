/** @type {import('jest').Config} */
const config = {
  roots: ['<rootDir>/src'],
  testEnvironment: 'jsdom',
  // Polyfills must load before module imports that need them (e.g. ky v2's TextEncoder use).
  setupFiles: ['<rootDir>/src/jest.polyfills.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/jest.setup.ts'],
  collectCoverageFrom: ['**/*.{js,jsx,ts,tsx}'],
  coveragePathIgnorePatterns: ['/node_modules/', '/src/__mocks__/', '/src/include.d/'],
  coverageReporters: ['text-summary', 'lcov'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        sourceMaps: true,
        jsc: {
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
        },
      },
    ],
    '\\.(svg)$': 'jest-transformer-svg',
    '\\.(png)$': 'jest-transform-stub',
  },
  moduleNameMapper: {
    // Ensure CSS modules are stubbed before applying path aliases.
    '\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    // Stub plain stylesheet imports (e.g. third-party CSS like react-easy-crop).
    '\\.(css|sass|scss)$': 'identity-obj-proxy',
    '^@/([^?]*)(\\?.*)?$': '<rootDir>/src/$1',
    '^@logto/shared/(.*)$': '<rootDir>/../shared/lib/$1',
  },
  transformIgnorePatterns: ['node_modules/(?!(.*(nanoid|jose|ky|@logto|@silverhand))/)'],
};

export default config;
