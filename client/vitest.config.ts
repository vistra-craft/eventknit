import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import viteConfig from './vite.config'

export default defineConfig({
  ...viteConfig,
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        url: 'http://localhost:3000',
      },
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
  resolve: {
    ...viteConfig.resolve,
    alias: {
      ...viteConfig.resolve?.alias,
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'globalThis',
  },
})

