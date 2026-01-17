import { defineConfig } from 'vite';

export default defineConfig({
  base: '/DataHeist/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    port: 3000
  }
});