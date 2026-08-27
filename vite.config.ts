import { defineConfig } from 'vitest/config'

export default defineConfig({
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  server: {
    headers: {
      'Service-Worker-Allowed': '/',
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
