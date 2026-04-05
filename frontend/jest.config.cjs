module.exports = {
  testEnvironment: 'jsdom',
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      'babel-jest',
      {
        presets: [
          [
            '@babel/preset-env',
            {
              targets: {
                node: 'current',
              },
              modules: 'auto',
            },
          ],
          '@babel/preset-react',
        ],
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(fast-check|@testing-library)/)',
  ],
};