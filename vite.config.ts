import { defineConfig } from 'vite'

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
})
