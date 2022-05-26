import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'
import { chromeExtension as ChromeExtension } from 'vite-plugin-chrome-extension'

export default defineConfig({
  plugins: [
    ChromeExtension(),
  ],
  build: {
    rollupOptions: {
      input: 'src/manifest.json',
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
