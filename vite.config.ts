import { defineConfig } from 'vite'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
    codeInspectorPlugin({
      bundler: 'vite',
      editor: 'trae',
    }),
  ],
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
})
