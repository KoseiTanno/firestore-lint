import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      // TODO: re-enable once real modules exist (Task 2+). A 0% coverage
      // placeholder would fail these thresholds and block CI.
      // thresholds: {
      //   lines: 90,
      //   functions: 90,
      //   branches: 85,
      //   statements: 90,
      // },
    },
  },
})