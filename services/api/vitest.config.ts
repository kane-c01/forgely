import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
    globals: false,
    pool: 'forks',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts',
        'src/router/index.ts',
        'src/auth/index.ts',
        'src/credits/index.ts',
        'src/stripe/index.ts',
        'src/**/*.test.ts',
      ],
    },
  },
});
