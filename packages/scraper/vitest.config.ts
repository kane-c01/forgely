import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/__tests__/**',
        'src/index.ts',
        // Type-only modules (interfaces / types only):
        'src/types.ts',
        'src/ai/vision.ts',
        'src/storage/types.ts',
        // Re-export barrels:
        'src/browser/index.ts',
        'src/storage/index.ts',
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        // Branches is intentionally lower: noUncheckedIndexedAccess + many
        // optional ScrapeOptions create lots of `?? null` defensive branches
        // whose 100% coverage adds little signal.
        branches: 60,
      },
    },
  },
})
